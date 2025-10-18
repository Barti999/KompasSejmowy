const API = import.meta.env.VITE_API_BASE as string;

export type VotingItem = {
  term: number;
  sitting: number;
  votingNumber: number;
  date?: string;
  title?: string;
  topic?: string;
  yes?: number;
  no?: number;
  abstain?: number;
  notParticipating?: number;
};

export async function getProceedings() {
  const r = await fetch(`${API}/proceedings`);
  if (!r.ok) throw new Error("Nie udało się pobrać posiedzeń");
  return (await r.json()) as { number: number; title: string; dates: string[] }[];
}

export async function getVotings(proceeding: number) {
  const r = await fetch(`${API}/votings/${proceeding}`);
  if (!r.ok) throw new Error("Nie udało się pobrać głosowań");
  return (await r.json()) as VotingItem[];
}

export async function getVotingByClub(proceeding: number, votingNumber: number) {
  const r = await fetch(`${API}/votings/${proceeding}/${votingNumber}/by-club`);
  if (!r.ok) throw new Error("Nie udało się pobrać agregacji");
  return await r.json() as {
    proceeding: number;
    votingNumber: number;
    byClub: Record<string, { YES: number; NO: number; ABSTAIN: number; NP: number }>;
  };
}
