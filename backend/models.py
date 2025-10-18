from pydantic import BaseModel
from typing import Optional, List, Dict, Literal

# --- MPs ---
class MP(BaseModel):
    id: int
    firstLastName: str
    club: Optional[str] = None
    active: Optional[bool] = None

# --- Votings (lista na posiedzeniu / search) ---
class VotingItem(BaseModel):
    term: int
    sitting: int  # = proceeding
    votingNumber: int
    date: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    kind: Optional[str] = None  # ELECTRONIC / TRADITIONAL / ON_LIST
    yes: Optional[int] = None
    no: Optional[int] = None
    abstain: Optional[int] = None
    notParticipating: Optional[int] = None
    present: Optional[int] = None
    majorityType: Optional[str] = None
    majorityVotes: Optional[int] = None

VoteDecision = Literal["YES","NO","ABSTAIN","VOTE_VALID","NP"]

class VotingPersonVote(BaseModel):
    MP: int
    club: Optional[str] = None
    firstName: Optional[str] = None
    secondName: Optional[str] = None
    lastName: Optional[str] = None
    vote: Optional[VoteDecision] = None
    listVotes: Optional[Dict[str, Literal["YES","NO"]]] = None  # dla ON_LIST

class VotingDetails(BaseModel):
    term: int
    sitting: int
    sittingDay: Optional[int] = None
    votingNumber: int
    date: str
    title: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    kind: str
    yes: int
    no: int
    abstain: int
    present: Optional[int] = None
    notParticipating: Optional[int] = None
    againstAll: Optional[int] = None
    votes: Optional[List[VotingPersonVote]] = None  # zwracane tylko w szczegółach

# --- Clubs ---
class Club(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    membersCount: Optional[int] = None

# --- Proceedings (posiedzenia) ---
class Proceeding(BaseModel):
    number: int
    title: str
    dates: List[str]
    current: Optional[bool] = None

class ErrorResponse(BaseModel):
    detail: str
