import os
from typing import Any, Dict, List, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE = os.getenv("SEJM_API_BASE", "https://api.sejm.gov.pl").rstrip("/")
TERM = int(os.getenv("SEJM_TERM", "10"))
TIMEOUT = int(os.getenv("HTTP_TIMEOUT_S", "20"))

class SejmClient:
    def __init__(self, base: str = BASE, term: int = TERM, timeout_s: int = TIMEOUT):
        self.base = base
        self.term = term
        self.timeout = httpx.Timeout(timeout_s)

    def _url(self, path: str) -> str:
        return f"{self.base}{path}"

    async def list_mps(self) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/MP  (lista posłów) – dokumentacja
        # https://api.sejm.gov.pl/sejm/term10/MP
        url = self._url(f"/sejm/term{self.term}/MP")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()

    async def list_votings_for_sitting(self, sitting: int) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/votings/{sitting} – lista głosowań na posiedzeniu
        url = self._url(f"/sejm/term{self.term}/votings/{sitting}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()

    async def voting_details(self, sitting: int, voting_number: int) -> Dict[str, Any]:
        # GET /sejm/term{term}/votings/{sitting}/{votingNum} – szczegóły głosowania
        url = self._url(f"/sejm/term{self.term}/votings/{sitting}/{voting_number}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()

    async def mp_votings_stats(self, leg: int) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/MP/{leg}/votings/stats – statystyki wg dni/posiedzeń
        url = self._url(f"/sejm/term{self.term}/MP/{leg}/votings/stats")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()

    async def mp_votes_on_day(self, leg: int, sitting: int, date_iso: str) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/MP/{leg}/votings/{sitting}/{date}
        url = self._url(f"/sejm/term{self.term}/MP/{leg}/votings/{sitting}/{date_iso}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()
