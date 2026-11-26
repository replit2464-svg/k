import type { Candidate } from '../data/pemiraData';

export type UserRole = 'admin' | 'validator' | 'user';

export interface VoterProfile {
  nim: string;
  fullName: string;
  programStudi: string;
  angkatan: string;
  gender: string;
  membershipStatus: string;
  role: 'user' | 'validator';
  uniqueCode: string;
  hasPassword: boolean;
  validationStatus: 'pending' | 'validated';
  validatedBy: string | null;
  validatedAt: string | null;
  hasVoted: boolean;
  votedAt: string | null;
}

export interface AdminUser {
  role: 'admin';
  username: string;
  name: string;
}

export interface PublicOverviewResponse {
  candidates: Candidate[];
  stats: {
    totalDpt: number;
    totalValidated: number;
    totalVoted: number;
  };
}

export interface AdminStatusResponse {
  envConfigured: boolean;
  bootstrapped: boolean;
  suggestedUsername: string;
}

export interface MonitoringResponse {
  summary: {
    totalDpt: number;
    totalValidators: number;
    totalValidated: number;
    totalVoted: number;
    pendingValidation: number;
    bphCandidatesCount: number;
    senatorCandidatesCount: number;
  };
  cohorts: Array<{
    angkatan: string;
    total: number;
    validated: number;
    voted: number;
  }>;
  logs: Array<{
    id: number;
    actorRole: string;
    actorId: string;
    action: string;
    targetId: string | null;
    details: string;
    createdAt: string;
  }>;
}

export interface CandidateWithVotes extends Candidate {
  votes: number;
  percentage: number;
}

export interface ResultsResponse {
  totalDpt: number;
  totalBallots: number;
  turnoutPercentage: number;
  bphResults: CandidateWithVotes[];
  senatorResults: CandidateWithVotes[];
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : `Permintaan gagal dengan kode ${res.status}.`
    );
  }
  return data as T;
}
