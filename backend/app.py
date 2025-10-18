from fastapi import FastAPI, HTTPException
from typing import List, Dict, Any, Optional
from models import MP, VotingItem, MPVote, ErrorResponse
from sejm_client import SejmClient

app = FastAPI(title="Sejm Votes Backend", version="0.1.0")
client = SejmClient()

@app.get("/health")
async def health():
    return {"status": "ok"}

# 1) Lista posłów z klubami
@app.get("/mps", response_model=List[MP], responses={502: {"model": ErrorResponse}})
async def mps():
    try:
        raw = await client.list_mps()
        # mapowanie minimalne -> nasze pola
        out = []
        for r in raw:
            out.append({
                "id": r.get("id"),
                "firstLastName": r.get("firstLastName"),
                "club": r.get("club"),
                "active": r.get("active"),
            })
        return out
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania mp: {e}")

# 2) Lista głosowań na wskazanym posiedzeniu
@app.get("/votings/{sitting}", response_model=List[VotingItem], responses={502: {"model": ErrorResponse}})
async def votings_for_sitting(sitting: int):
    try:
        raw = await client.list_votings_for_sitting(sitting)
        return raw  # struktura już pasuje do VotingItem (ma pola term/sitting/votingNumber/...)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania głosowań: {e}")

# 3) Szczegóły konkretnego głosowania (z wynikami)
@app.get("/votings/{sitting}/{voting_number}", responses={502: {"model": ErrorResponse}})
async def voting_details(sitting: int, voting_number: int) -> Dict[str, Any]:
    try:
        return await client.voting_details(sitting, voting_number)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania szczegółów głosowania: {e}")

# 4) Jak głosował dany poseł w danym dniu posiedzenia
@app.get("/mp/{leg}/votes/{sitting}/{date_iso}", responses={502: {"model": ErrorResponse}})
async def mp_votes_on_day(leg: int, sitting: int, date_iso: str) -> List[Dict[str, Any]]:
    try:
        return await client.mp_votes_on_day(leg, sitting, date_iso)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd pobierania głosów posła: {e}")
