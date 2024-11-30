from github import Github, GithubException
from typing import Tuple, List, Dict, Any, Optional
import os
import re
from .models import FileNode, RepoInfo

def parse_github_url(url: str) -> Tuple[str, str, Optional[str]]:
    """Extract owner, repo name, and branch from GitHub URL.
    
    Args:
        url (str): GitHub repository URL
        
    Returns:
        Tuple[str, str, Optional[str]]: Repository owner, name, and branch (if specified)
        
    Examples:
        >>> parse_github_url("https://github.com/owner/repo")
        ('owner', 'repo', None)
        >>> parse_github_url("https://github.com/owner/repo/tree/main")
        ('owner', 'repo', 'main')
        >>> parse_github_url("owner/repo")
        ('owner', 'repo', None)
    """
    # Remove trailing slashes and .git extension
    url = url.rstrip('/').rstrip('.git')

    # Extract branch if present
    branch = None
    branch_patterns = [
        r'/tree/([^/]+)(?:/.*)?$',  # Matches /tree/branch-name
        r'/blob/([^/]+)(?:/.*)?$',  # Matches /blob/branch-name
    ]

    for pattern in branch_patterns:
        if match := re.search(pattern, url):
            branch = match.group(1)
            # Remove branch part from URL for further parsing
            url = re.sub(pattern, '', url)
            break

    # Try different GitHub URL patterns
    patterns = [
        r"(?:https?://)?github\.com[:/]([^/]+)/([^/]+)",  # https://github.com/owner/repo
        r"^([^/]+)/([^/]+)$",                             # owner/repo
    ]

    for pattern in patterns:
        if match := re.search(pattern, url):
            owner, repo = match.group(1), match.group(2)
            # Additional validation
            if all(name.strip() for name in [owner, repo]):  # Ensure neither is empty
                return owner, repo, branch

    raise ValueError("Invalid GitHub repository URL. Please provide a URL in the format 'https://github.com/owner/repo' or 'owner/repo'")
def get_repo_structure(repo, path: str = "", branch: str = None) -> List[FileNode]:
    """Recursively get repository structure."""
    try:
        contents = repo.get_contents(path, ref=branch)
        structure = []

        for content in contents:
            node = FileNode(
                name=content.name,
                path=content.path,
                type="directory" if content.type == "dir" else "file",
                size=content.size if content.type != "dir" else None
            )

            if content.type == "dir":
                node.children = get_repo_structure(repo, content.path, branch)

            structure.append(node)

        # Sort directories first, then files, both alphabetically
        return sorted(structure,
                      key=lambda x: (x.type != "directory", x.name.lower()))

    except GithubException as e:
        raise GithubException(e.status, e.data)

def get_repo_info(repo) -> RepoInfo:
    """Get repository information."""
    return RepoInfo(
        name=repo.name,
        description=repo.description,
        stars=repo.stargazers_count,
        forks=repo.forks_count,
        default_branch=repo.default_branch
    )

def get_github_client() -> Github:
    """Get authenticated GitHub client."""
    token = "GITHUB_TOKEN"  # GitHub token environment variable
    if not token:
        raise ValueError("GitHub token not found in environment variables")
    return Github(token)