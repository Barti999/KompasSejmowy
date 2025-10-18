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

    async def _get(self, url: str, params: Optional[Dict[str, Any]] = None) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            return r.json()

    # --- MPs ---
    async def list_mps(self) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/MP
        url = self._url(f"/sejm/term{self.term}/MP")
        return await self._get(url)

    # --- Votings ---
    async def list_votings_for_proceeding(self, proceeding: int) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/votings/{proceeding}
        url = self._url(f"/sejm/term{self.term}/votings/{proceeding}")
        return await self._get(url)

    async def voting_details(self, proceeding: int, voting_number: int) -> Dict[str, Any]:
        # GET /sejm/term{self.term}/votings/{proceeding}/{votingNum}
        url = self._url(f"/sejm/term{self.term}/votings/{proceeding}/{voting_number}")
        return await self._get(url)

    async def search_votings(
        self,
        proceeding: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        title: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/votings/search?proceeding=&dateFrom=&dateTo=&title=
        url = self._url(f"/sejm/term{self.term}/votings/search")
        params: Dict[str, Any] = {}
        if proceeding is not None:
            params["proceeding"] = proceeding
        if date_from:
            params["dateFrom"] = date_from
        if date_to:
            params["dateTo"] = date_to
        if title:
            params["title"] = title
        return await self._get(url, params=params)

    # --- MP votes/stats ---
    async def mp_votings_stats(self, leg: int) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/MP/{leg}/votings/stats
        url = self._url(f"/sejm/term{self.term}/MP/{leg}/votings/stats")
        return await self._get(url)

    async def mp_votes_on_day(self, leg: int, proceeding: int, date_iso: str) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/MP/{leg}/votings/{proceeding}/{date}
        url = self._url(f"/sejm/term{self.term}/MP/{leg}/votings/{proceeding}/{date_iso}")
        return await self._get(url)

    # --- Clubs ---
    async def list_clubs(self) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/clubs
        url = self._url(f"/sejm/term{self.term}/clubs")
        return await self._get(url)

    async def club_details(self, club_id: str) -> Dict[str, Any]:
        # GET /sejm/term{term}/clubs/{club}
        url = self._url(f"/sejm/term{self.term}/clubs/{club_id}")
        return await self._get(url)

    # --- Proceedings (posiedzenia) ---
    async def list_proceedings(self) -> List[Dict[str, Any]]:
        # GET /sejm/term{term}/proceedings
        url = self._url(f"/sejm/term{self.term}/proceedings")
        return await self._get(url)

    # --- Generic pagination helper (for endpoints które wspierają offset/limit) ---
    async def get_with_pagination(self, path: str, offset: int = 0, limit: int = 50) -> Any:
        # np. /sejm/term{term}/videos?offset=&limit=
        url = self._url(path)
        params = {"offset": offset, "limit": limit}
        return await self._get(url, params=params)
