/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OnboardingData, UrgeHistoryEntry, BehaviourProfile } from "../types";

// Seeded Onboarding answers for the Locked Demo Persona
export const DEFAULT_DEMO_ONBOARDING: OnboardingData = {
  name: "Alex Mercer",
  age: "24",
  occupation: "Junior Software Engineer",
  habits: ["Instagram"],
  shortTermGoal: "Reclaim 3 hours of daily focus blocks to master advanced systems architecture",
  longTermGoal: "Lead a Core Infrastructure engineering team and build high-performance databases",
  whyGoalMatters: "I want to escape the shallow scrolling cycle and actually build deep, impactful tech that secures my financial freedom",
  accountabilityPartner: "Sarah (Engineering Manager)"
};

// Seeded Urges History for dynamic coaching analysis & coaching pivot checks
export const SEEDED_URGE_HISTORY: UrgeHistoryEntry[] = [
  {
    timestamp: "3 days ago, 3:15 PM",
    trigger: "Got stuck on a nasty multi-threaded race condition bug, felt imposter syndrome",
    chosenAction: "Shut the laptop lid, walked outside for 10 minutes of fresh air",
    outcome: "success"
  },
  {
    timestamp: "3 days ago, 9:45 PM",
    trigger: "Lying in bed, finished coding for the day, felt restless",
    chosenAction: "Picked up phone, opened Instagram, doomscrolled Reels for 90 minutes",
    outcome: "relapsed"
  },
  {
    timestamp: "2 days ago, 11:15 AM",
    trigger: "Waiting for a slow CI/CD test pipeline run to complete",
    chosenAction: "Opened Terminal and wrote structured unit tests for the core parser instead",
    outcome: "success"
  },
  {
    timestamp: "2 days ago, 6:00 PM",
    trigger: "Finished standup, brain felt exhausted and wanted quick dopamine",
    chosenAction: "Unlocked phone, scrolled Instagram Reels for 45 minutes",
    outcome: "relapsed"
  },
  {
    timestamp: "Yesterday, 2:30 PM",
    trigger: "Frustrated because a senior pull request review had harsh feedback",
    chosenAction: "Walked away, drank a glass of cold water, did 10 squats",
    outcome: "success"
  },
  {
    timestamp: "Yesterday, 9:15 PM",
    trigger: "Stressed about presenting the pitch deck for PromptWars Hackathon tomorrow",
    chosenAction: "Used the BreakFree SOS mode, did 5 minutes of guided box breathing",
    outcome: "success"
  }
];

// Seeded profile fallback if Gemini API goes down
export const FALLBACK_PROFILE: BehaviourProfile = {
  primaryAddiction: "Excessive Instagram doomscrolling",
  secondaryAddiction: "Bedtime phone usage and seeking escapism during frustrating debugging tasks",
  rootCause: "Dopamine-seeking behavior triggered by high cognitive strain (such as difficult code bugs) and career performance anxiety",
  highRiskTime: "Late evenings (9 PM to 12 AM) and during mental fatigue or context-switching between dev tasks",
  highRiskSituation: "When code reviews are critical or when a compiler error stalls active work",
  motivationSummary: "Reclaim cognitive bandwidth to build high-performance software systems and advance to staff level",
  behaviourSummary: "Encounter challenging task -> Anxiety/Fatigue -> Pick up phone -> Infinite scroll reels -> Instant escape with severe post-scroll guilt and cognitive fog."
};
