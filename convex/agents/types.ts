export type AgentType = "loop_agent";

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

export interface ExtractedData {
  conditions: string[];
  medications: string[];
  triggers: string[];
  copingPatterns: string[];
  commitments: string[];
  phqHint?: number;
  crisisSignal: boolean;
  dominantEmotion: string;
  moodScore: number;
}
