from fastapi import FastAPI, HTTPException
from typing import List, Dict, Any
from models import MP, VotingItem, VotingDetails, Club, Proceeding, ErrorResponse
from sejm_client import SejmClient
from collections import defaultdict

app = FastAPI(title="Sejm Votes Backend", version="0.2.0")
client = SejmClient()

@app.get("/health")
async def health():
    return {"status": "ok"}

# 1) Lista posłów
@app.get("/mps", response_model=List[MP], responses={502: {"model": ErrorResponse}})
async def mps():
    try:
        raw = await client.list_mps()
        return [
            {
                "id": r.get("id"),
                "firstLastName": r.get("firstLastName"),
                "club": r.get("club"),
                "active": r.get("active"),
            } for r in raw
        ]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania MP: {e}")

# 2) Lista głosowań na posiedzeniu (proceeding)
@app.get("/votings/{proceeding}", response_model=List[VotingItem], responses={502: {"model": ErrorResponse}})
async def votings_for_proceeding(proceeding: int):
    try:
        return await client.list_votings_for_proceeding(proceeding)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania głosowań: {e}")

# 3) Szczegóły głosowania (z indywidualnymi głosami)
@app.get("/votings/{proceeding}/{voting_number}", response_model=VotingDetails, responses={502: {"model": ErrorResponse}})
async def voting_details(proceeding: int, voting_number: int):
    try:
        return await client.voting_details(proceeding, voting_number)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania szczegółów głosowania: {e}")

# 3a) Agregacja: wynik wg klubów dla danego głosowania
@app.get("/votings/{proceeding}/{voting_number}/by-club", responses={502: {"model": ErrorResponse}})
async def voting_by_club(proceeding: int, voting_number: int):
    try:
        details = await client.voting_details(proceeding, voting_number)
        votes = details.get("votes", []) or []
        agg: Dict[str, Dict[str, int]] = defaultdict(lambda: {"YES":0,"NO":0,"ABSTAIN":0,"NP":0})
        for v in votes:
            club = v.get("club") or "UNKNOWN"
            d = v.get("vote")
            key = d if d in ["YES","NO","ABSTAIN"] else "NP"
            agg[club][key] += 1
        return {"proceeding": proceeding, "votingNumber": voting_number, "byClub": agg}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd agregacji: {e}")

# 4) Jak głosował dany poseł w danym dniu posiedzenia
@app.get("/mp/{leg}/votes/{proceeding}/{date_iso}", responses={502: {"model": ErrorResponse}})
async def mp_votes_on_day(leg: int, proceeding: int, date_iso: str):
    try:
        return await client.mp_votes_on_day(leg, proceeding, date_iso)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania głosów posła: {e}")

# 5) Wyszukiwanie głosowań
@app.get("/votings-search", response_model=List[VotingItem], responses={502: {"model": ErrorResponse}})
async def votings_search(proceeding: int | None = None, dateFrom: str | None = None, dateTo: str | None = None, title: str | None = None):
    try:
        return await client.search_votings(proceeding=proceeding, date_from=dateFrom, date_to=dateTo, title=title)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd wyszukiwania głosowań: {e}")

# 6) Kluby
@app.get("/clubs", response_model=List[Club], responses={502: {"model": ErrorResponse}})
async def clubs():
    try:
        return await client.list_clubs()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania klubów: {e}")

# 7) Posiedzenia
@app.get("/proceedings", response_model=List[Proceeding], responses={502: {"model": ErrorResponse}})
async def proceedings():
    try:
        return await client.list_proceedings()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania posiedzeń: {e}")
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sejm Votes Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
