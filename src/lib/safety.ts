/**
 * Resilient safety detection and crisis response utility.
 * Intercepts high-risk words to guarantee immediate, zero-latency local fallback.
 */

export const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "self-harm",
  "end my life",
  "want to die",
  "cutting myself",
  "overdose",
  "harm myself",
  "hopelessness"
];

/**
 * Checks if the user's input contains critical safety-relevant keyphrases.
 */
export function detectCrisis(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase().trim();
  return CRISIS_KEYWORDS.some(keyword => normalized.includes(keyword));
}

/**
 * Standard emergency contacts to show during high-risk scenarios.
 */
export const EMERGENCY_RESOURCES = {
  text: "If you are in immediate danger or experiencing thoughts of self-harm, please contact emergency services or text/call 988 (Suicide & Crisis Lifeline in the US & Canada). Help is available 24/7.",
  hotline: "988",
  organization: "Suicide & Crisis Lifeline"
};
