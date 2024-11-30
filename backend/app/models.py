from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class RepoURL(BaseModel):
    url: str

class FileNode(BaseModel):
    name: str
    path: str
    type: str
    size: Optional[int] = None
    children: Optional[List['FileNode']] = None

class RepoInfo(BaseModel):
    name: str
    description: Optional[str] = None
    stars: int
    forks: int
    default_branch: str

class RepoResponse(BaseModel):
    status: str
    repo_info: RepoInfo
    structure: List[FileNode]

# This is needed for the self-referential FileNode type
FileNode.model_rebuild()