from fastapi import APIRouter, HTTPException
from github import GithubException
from .models import RepoURL, RepoResponse, TextContentResponse, TextContentMetadata
from .utils import parse_github_url, get_repo_structure, get_repo_info, get_github_client
from typing import Optional
import base64

router = APIRouter()

@router.get("/health")
async def health_check():
    """Check if the API is running."""
    print("[DEBUG] Health check endpoint called")  
    try:
        g = get_github_client()
        print("[DEBUG] GitHub client initialized successfully") 
        return {
            "status": "ok",
            "message": "API is running and GitHub client is initialized"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
        
@router.post("/structure", response_model=RepoResponse)
async def get_repository_structure(repo_url: RepoURL):
    """Get the structure of a GitHub repository."""
    def try_fetch_repo(url: str) -> Optional[RepoResponse]:
        try:
            print(f"[DEBUG] Attempting to fetch repository with URL: {url}")
            owner, repo_name, branch = parse_github_url(url)
            print(f"[DEBUG] Parsed owner: {owner}, repo: {repo_name}, branch: {branch}")

            g = get_github_client()
            repo = g.get_repo(f"{owner}/{repo_name}")
            print(f"[DEBUG] Successfully got repo object for {owner}/{repo_name}")

            repo_info = get_repo_info(repo)

            # Use the specified branch or fall back to the default branch
            target_branch = branch or repo_info.default_branch
            print(f"[DEBUG] Using branch: {target_branch}")

            try:
                # Verify branch exists
                repo.get_branch(target_branch)
                structure = get_repo_structure(repo, branch=target_branch)
                print(f"[DEBUG] Successfully fetched repository structure for branch: {target_branch}")

                return RepoResponse(
                    status="success",
                    repo_info=repo_info,
                    structure=structure
                )
            except GithubException as e:
                if e.status == 404 and not branch:
                    # If branch not found and it was the default branch, return None to try other URLs
                    return None
                elif e.status == 404:
                    # If branch not found and it was specified in URL, raise 404
                    raise HTTPException(
                        status_code=404,
                        detail=f"Branch '{target_branch}' not found in repository"
                    )
                raise e

        except GithubException as e:
            print(f"[DEBUG] GitHub Exception: {e.status} - {str(e)}")
            if e.status == 404:
                return None
            raise e
        except ValueError as e:
            print(f"[DEBUG] Value Error in URL parsing: {str(e)}")
            raise e
        except Exception as e:
            print(f"[DEBUG] Unexpected error: {str(e)}")
            raise e

    try:
        # First try with the original URL
        result = try_fetch_repo(repo_url.url)
        if result is not None:
            return result

        # If no branch was specified and the first attempt failed,
        # try common branch names
        if "/tree/" not in repo_url.url and "/blob/" not in repo_url.url:
            common_branches = ["main", "master", "develop"]
            for branch in common_branches:
                url = f"{repo_url.url.rstrip('/')}/tree/{branch}"
                print(f"\n[DEBUG] Trying common branch: {url}")
                result = try_fetch_repo(url)
                if result is not None:
                    return result

        # If all attempts failed
        raise HTTPException(
            status_code=404,
            detail="Repository or specified branch not found. Please verify the repository and branch exist and are accessible."
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GithubException as e:
        if e.status == 403:
            raise HTTPException(
                status_code=403,
                detail="GitHub API rate limit exceeded or authentication required"
            )
        else:
            raise HTTPException(
                status_code=e.status,
                detail=str(e.data.get("message", "GitHub API error"))
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/text-content", response_model=TextContentResponse)
async def get_repository_text(repo_url: RepoURL):
    """Get the text content of all files in a repository."""
    try:
        print(f"[DEBUG] Processing text-content request for URL: {repo_url.url}")
        owner, repo_name, branch = parse_github_url(repo_url.url)
        print(f"[DEBUG] Parsed URL - owner: {owner}, repo: {repo_name}, branch: {branch}")

        g = get_github_client()
        repo = g.get_repo(f"{owner}/{repo_name}")
        print(f"[DEBUG] Successfully fetched repo object")

        contents = []
        skipped_files = []
        total_size = 0

        def process_contents(path=""):
            nonlocal total_size
            try:
                print(f"[DEBUG] Fetching contents for path: {path}")
                items = repo.get_contents(path, ref=branch or repo.default_branch)
                if not isinstance(items, list):
                    items = [items]

                for item in items:
                    try:
                        if item.type == "file":
                            print(f"[DEBUG] Processing file: {item.path}")
                            # Skip files in excluded directories
                            if any(excluded in item.path.lower() for excluded in ['node_modules', '.git', 'dist', 'build', 'venv']):
                                print(f"[DEBUG] Skipping excluded directory file: {item.path}")
                                skipped_files.append(f"{item.path} (excluded directory)")
                                continue

                            # Skip files larger than 100KB
                            if item.size > 100 * 1024:
                                print(f"[DEBUG] Skipping large file: {item.path} ({item.size/1024:.1f}KB)")
                                skipped_files.append(f"{item.path} (too large: {item.size/1024:.1f}KB)")
                                continue

                            # Skip binary files
                            if item.path.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip')):
                                print(f"[DEBUG] Skipping binary file: {item.path}")
                                skipped_files.append(f"{item.path} (binary file)")
                                continue

                            try:
                                file_content = base64.b64decode(item.content).decode('utf-8')
                                total_size += len(file_content)
                                contents.append(
                                    f"\n{'='*80}\n"
                                    f"File: {item.path}\n"
                                    f"Size: {item.size/1024:.2f}KB\n"
                                    f"{'='*80}\n\n"
                                    f"{file_content}\n"
                                )
                            except UnicodeDecodeError as e:
                                print(f"[DEBUG] Unicode decode error for {item.path}: {str(e)}")
                                skipped_files.append(f"{item.path} (encoding error)")
                            except Exception as e:
                                print(f"[DEBUG] Error processing file {item.path}: {str(e)}")
                                skipped_files.append(f"{item.path} (Error: {str(e)})")

                        elif item.type == "dir" and not any(excluded in item.path.lower() for excluded in ['node_modules', '.git', 'dist', 'build', 'venv']):
                            print(f"[DEBUG] Processing directory: {item.path}")
                            process_contents(item.path)

                    except Exception as e:
                        print(f"[DEBUG] Error processing item {item.path if hasattr(item, 'path') else 'unknown'}: {str(e)}")
                        continue

            except Exception as e:
                print(f"[DEBUG] Error in process_contents for path {path}: {str(e)}")
                raise

        try:
            process_contents()
            print("[DEBUG] Finished processing all contents")
        except Exception as e:
            print(f"[DEBUG] Error during content processing: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing repository contents: {str(e)}")

        # Prepare header with repository information
        header = (
                f"Repository: {owner}/{repo_name}\n"
                f"Branch: {branch or repo.default_branch}\n"
                f"Total files processed: {len(contents)}\n"
                f"Total size: {total_size/1024:.2f}KB\n"
                f"\nSkipped files ({len(skipped_files)}):\n"
                + "\n".join(f"- {file}" for file in skipped_files)
                + "\n\n"
        )

        return TextContentResponse(
            status="success",
            content=header + "".join(contents),
            metadata=TextContentMetadata(
                total_files=len(contents),
                skipped_files=len(skipped_files),
                total_size=total_size
            )
        )

    except GithubException as e:
        print(f"[DEBUG] GitHub API error: {str(e)}")
        raise HTTPException(
            status_code=e.status,
            detail=f"GitHub API error: {str(e.data.get('message', str(e)))}"
        )
    except Exception as e:
        print(f"[DEBUG] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )