/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OnboardingData {
  name: string;
  age: string;
  occupation: string;
  habits: string[];
  shortTermGoal: string;
  longTermGoal: string;
  whyGoalMatters: string;
  accountabilityPartner: string;
}

export interface InterviewTurn {
  question: string;
  answer: string;
}

export interface BehaviourProfile {
  primaryAddiction: string;
  secondaryAddiction: string;
  rootCause: string;
  highRiskTime: string;
  highRiskSituation: string;
  motivationSummary: string;
  behaviourSummary: string;
}

export interface UrgeHistoryEntry {
  timestamp: string;
  trigger: string;
  chosenAction: string;
  outcome: "success" | "relapsed";
}

export interface DecisionOption {
  title: string;
  reason: string;
  effortLevel: string; // e.g. "Low", "Medium", "High"
  score: number;       // e.g. 0-100 score indicating effectiveness
}

export interface DecisionEngineResponse {
  options: DecisionOption[];
  chosenOption: {
    title: string;
    reason: string;
  };
  reasoning: string;
  escalation: {
    shouldEscalate: boolean;
    escalationReason: string;
  };
}

export interface FutureSelfSimulation {
  relapse: string;
  resist: string;
}

export interface TodayInsightResponse {
  insight: string;
  adaptiveMove: "keepPlan" | "increaseDifficulty" | "swapStrategy";
  adaptiveReason: string;
}

export interface RecoveryPlanResponse {
  todayGoal: string;
  replacementActivity: string;
  microHabit: string;
  encouragement: string;
  tomorrowFocus: string;
}
