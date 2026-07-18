/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  OnboardingData, 
  UrgeHistoryEntry, 
  BehaviourProfile,
  DecisionEngineResponse,
  FutureSelfSimulation,
  TodayInsightResponse,
  RecoveryPlanResponse
} from "../types";

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

// -------------------------------------------------------------
// Offline Graceful Fallback generators for Gemini Failures
// -------------------------------------------------------------

export function getFallbackInterviewQuestion(currentIndex: number): { question: string } {
  const fallbackQuestions = [
    "What triggers your urge first thing in the morning?",
    "How does your habit typically interfere with your active working focus blocks?",
    "Have you attempted to quit or limit this habit in the past?",
    "How should your accountability partner check in on your focus goals?"
  ];
  const question = fallbackQuestions[currentIndex % fallbackQuestions.length];
  return { question };
}

export function getFallbackBehaviourProfile(onboarding: OnboardingData): BehaviourProfile {
  const mainHabit = onboarding.habits[0] || "screens";
  return {
    primaryAddiction: `Excessive ${mainHabit} scrolling`,
    secondaryAddiction: "Bedtime phone usage and seeking quick escapism during frustrating tasks",
    rootCause: "Dopamine-seeking behavior triggered by high cognitive strain and performance anxiety",
    highRiskTime: "Late evenings and during mental fatigue or context-switching",
    highRiskSituation: "When experiencing frustration or when a roadblock stalls active work",
    motivationSummary: `Reclaim cognitive bandwidth to achieve: "${onboarding.shortTermGoal || "focus goals"}"`,
    behaviourSummary: `Encounter challenging task -> Anxiety/Fatigue -> Pick up device -> Infinite scroll ${mainHabit} -> Instant escape with post-scroll guilt.`
  };
}

export function getFallbackSOSDecision(sosText: string): DecisionEngineResponse {
  return {
    options: [
      {
        title: "5-Minute Guided Box Breathing",
        reason: "Deep breathing regulates your nervous system, instantly breaking the physiological craving cycle.",
        effortLevel: "Low",
        score: 85
      },
      {
        title: "Brief Physical Context Switch",
        reason: "Standing up, stepping away from the screen, and drinking cold water resets your cognitive triggers.",
        effortLevel: "Low",
        score: 75
      },
      {
        title: "Write down 3 specific work micro-goals",
        reason: "Re-channels immediate cognitive attention on tangible, low-stress achievements instead of escapism.",
        effortLevel: "Medium",
        score: 80
      }
    ],
    chosenOption: {
      title: "5-Minute Guided Box Breathing",
      reason: "Box breathing is the fastest way to reduce craving-induced physical stress and regain immediate focus."
    },
    reasoning: `Your SOS trigger ("${sosText}") indicates immediate cognitive fatigue. Guided breathing provides the lowest barrier of entry to intercept this craving.`,
    escalation: {
      shouldEscalate: false,
      escalationReason: "Benign craving trigger. Standard behavioral interception applied."
    }
  };
}

export function getFallbackFutureSelf(onboarding: OnboardingData): FutureSelfSimulation {
  const mainHabit = onboarding.habits[0] || "Instagram";
  const name = onboarding.name || "Alex";
  const goal = onboarding.shortTermGoal || "reclaiming focus blocks";

  return {
    relapse: `Hey ${name}, it's your Future Self speaking from 30 days out. We didn't stop using ${mainHabit}. We're still doomscrolling, our goal for "${goal}" is completely abandoned, and we feel constant cognitive fog and regret. Put the device down now, let's break this cycle.`,
    resist: `Hey ${name}! We did it! It's been 30 days of consistent focus blocks, and the mental clarity is unbelievable. We successfully resisted the cravings, made incredible progress on "${goal}", and feel incredibly proud. This moment of discipline today was worth it!`
  };
}

export function getFallbackTodayInsight(profile: BehaviourProfile): TodayInsightResponse {
  const mainHabit = profile.primaryAddiction || "Instagram";
  return {
    insight: `Your logged patterns indicate that the urge to scroll ${mainHabit} peaks when you encounter complex debugging blockers.`,
    adaptiveMove: "swapStrategy",
    adaptiveReason: "High bedding-table rates and development roadblocks suggest shifting the focus replacement strategy."
  };
}

export function getFallbackRecoveryPlan(profile: BehaviourProfile): RecoveryPlanResponse {
  const mainHabit = profile.primaryAddiction || "Instagram";
  return {
    todayGoal: `Complete your active work blocks without opening any ${mainHabit} tabs. Max 10 minutes usage permitted only after tasks are complete.`,
    replacementActivity: "When an urge strikes, take 10 deep breaths, drink cold water, or walk away for 2 minutes.",
    microHabit: "Put your phone in another room or keep it inside a closed desk drawer before starting your work.",
    encouragement: "You have the discipline to master your focus. Every moment of resistance rewires your brain for success.",
    tomorrowFocus: "Prepare your physical workspace tonight to be completely digital-distraction free tomorrow morning."
  };
}

export function getFallbackAccountabilityMessage(onboarding: OnboardingData): { messageText: string } {
  const partner = onboarding.accountabilityPartner || "Sarah";
  const name = onboarding.name || "Alex";
  const habit = onboarding.habits[0] || "scrolling";
  const goal = onboarding.shortTermGoal || "my focus blocks";

  return {
    messageText: `Hey ${partner}, I'm using BreakFree AI to keep me focused on my goal to "${goal}" today. If you notice me getting distracted by ${habit}, shoot me a quick nudge to help me close the app! Thanks for your support!`
  };
}
