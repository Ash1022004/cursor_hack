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
  institution?: string; // city/university — used as default location for local suggestions
  memoryNote?: string; // accumulated free-text memory, max 2000 chars
  // Fields merged from the logged-in user's profile (when anonymousId is jwt:<userId>)
  occupation?: string;
  ageGroup?: string;
  userBio?: string;
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
  memoryFacts: string[]; // short facts worth remembering extracted from this message
}
