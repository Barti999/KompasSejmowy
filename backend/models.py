from pydantic import BaseModel
from typing import Optional, List

class MP(BaseModel):
    id: int
    firstLastName: str
    club: Optional[str] = None  # klub/koło (partia parlamentarna)
    active: Optional[bool] = None

class VotingItem(BaseModel):
    term: int
    sitting: int
    votingNumber: int
    date: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    yes: Optional[int] = None
    no: Optional[int] = None
    abstain: Optional[int] = None
    notParticipating: Optional[int] = None

class MPVote(BaseModel):
    leg: int
    proceeding: int
    date: str
    votingNumber: int
    decision: str  # "YES"/"NO"/"ABSTAIN"/"NP" (przykładowo)

class ErrorResponse(BaseModel):
    detail: str
