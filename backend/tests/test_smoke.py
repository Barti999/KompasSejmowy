import asyncio
from sejm_client import SejmClient

def test_list_mps_runs():
    async def _run():
        c = SejmClient()
        mps = await c.list_mps()
        assert isinstance(mps, list)
        assert len(mps) > 0
    asyncio.run(_run())
