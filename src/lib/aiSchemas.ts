import { z } from "zod";

export const InterviewQuestionSchema = z.object({
  question: z.string()
});

export const BehaviourProfileSchema = z.object({
  primaryAddiction: z.string(),
  secondaryAddiction: z.string(),
  rootCause: z.string(),
  highRiskTime: z.string(),
  highRiskSituation: z.string(),
  motivationSummary: z.string(),
  behaviourSummary: z.string()
});

export const SOSDecisionSchema = z.object({
  options: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      effortLevel: z.string(),
      score: z.number()
    })
  ),
  chosenOption: z.object({
    title: z.string(),
    reason: z.string()
  }),
  reasoning: z.string(),
  escalation: z.object({
    shouldEscalate: z.boolean(),
    escalationReason: z.string()
  })
});

export const FutureSelfSchema = z.object({
  relapse: z.string(),
  resist: z.string()
});

export const TodayInsightSchema = z.object({
  insight: z.string(),
  adaptiveMove: z.enum(["keepPlan", "increaseDifficulty", "swapStrategy"]),
  adaptiveReason: z.string()
});

export const RecoveryPlanSchema = z.object({
  todayGoal: z.string(),
  replacementActivity: z.string(),
  microHabit: z.string(),
  encouragement: z.string(),
  tomorrowFocus: z.string()
});

export const AccountabilityMessageSchema = z.object({
  messageText: z.string()
});

// Input validation schemas for Security Hardening
export const OnboardingInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.string().min(1, "Age is required"),
  occupation: z.string().min(1, "Occupation is required"),
  habits: z.array(z.string()).min(1, "At least one habit is required"),
  shortTermGoal: z.string().min(1, "Short-term goal is required"),
  longTermGoal: z.string().min(1, "Long-term goal is required"),
  whyGoalMatters: z.string().min(1, "Why goal matters is required"),
  accountabilityPartner: z.string().nullable().optional()
});

export const TranscriptTurnSchema = z.object({
  question: z.string(),
  answer: z.string()
});

export const HistoryEntrySchema = z.object({
  timestamp: z.string(),
  trigger: z.string(),
  chosenAction: z.string(),
  outcome: z.enum(["success", "relapsed"])
});

