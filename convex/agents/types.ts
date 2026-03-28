export type AgentType =
  | "empathy"
  | "screening"
  | "mood"
  | "crisis"
  | "resource";

export interface PatientProfile {
  anonymousId: string;
  age?: number;
  conditions: string[];
  medications: string[];
  triggers: string[];
  copingPatterns: string[];
  phqScore?: number;
  gadScore?: number;
  crisisFlag: boolean;
  totalSessions: number;
  language: string;
}

export interface SupervisorResult {
  agentType: AgentType;
  response: string;
}

export interface ExtractedData {
  conditions: string[];
  medications: string[];
  triggers: string[];
  copingPatterns: string[];
  phqHint?: number;
  crisisSignal: boolean;
  dominantEmotion: string;
  moodScore: number;
}
