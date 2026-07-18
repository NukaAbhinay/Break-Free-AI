import { describe, it, expect } from 'vitest';
import { detectCrisis, CRISIS_KEYWORDS, EMERGENCY_RESOURCES } from '../lib/safety';
import {
  InterviewQuestionSchema,
  BehaviourProfileSchema,
  SOSDecisionSchema,
  FutureSelfSchema,
  TodayInsightSchema,
  RecoveryPlanSchema,
  AccountabilityMessageSchema
} from '../lib/aiSchemas';

describe('BreakFree AI - Core Safety & Behavioral Diagnostic Suite', () => {
  describe('Safety & Crisis Detection', () => {
    it('should detect extreme crisis phrases accurately', () => {
      const urgentInput = "I am feeling extremely hopeless and want to kill myself tonight";
      expect(detectCrisis(urgentInput)).toBe(true);
    });

    it('should detect exact crisis keywords', () => {
      CRISIS_KEYWORDS.forEach(keyword => {
        expect(detectCrisis(`Some words before ${keyword} and some after`)).toBe(true);
      });
    });

    it('should pass benign inputs safely', () => {
      const safeInput = "I am feeling an urge to scroll Instagram because coding is difficult right now.";
      expect(detectCrisis(safeInput)).toBe(false);
    });

    it('should handle empty or undefined inputs gracefully', () => {
      expect(detectCrisis("")).toBe(false);
      expect(detectCrisis(undefined as any)).toBe(false);
    });

    it('should expose standard 988 emergency resources', () => {
      expect(EMERGENCY_RESOURCES.hotline).toBe("988");
      expect(EMERGENCY_RESOURCES.organization).toContain("Suicide & Crisis Lifeline");
    });
  });

  describe('Adaptive Behavioral History Calculations', () => {
    // Utility simulating frontend or backend behavioral calculation logic
    function calculateStreakAndSuccessRate(history: Array<{ outcome: 'success' | 'relapse' }>) {
      if (history.length === 0) return { streak: 0, successRate: 0 };
      
      let streak = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].outcome === 'success') {
          streak++;
        } else {
          break;
        }
      }
      
      const successes = history.filter(h => h.outcome === 'success').length;
      const successRate = Math.round((successes / history.length) * 100);
      
      return { streak, successRate };
    }

    it('should calculate active clean streak correctly', () => {
      const history = [
        { outcome: 'success' as const },
        { outcome: 'relapse' as const },
        { outcome: 'success' as const },
        { outcome: 'success' as const }
      ];
      const stats = calculateStreakAndSuccessRate(history);
      expect(stats.streak).toBe(2);
      expect(stats.successRate).toBe(75);
    });

    it('should handle zero streak cases', () => {
      const history = [
        { outcome: 'success' as const },
        { outcome: 'relapse' as const }
      ];
      const stats = calculateStreakAndSuccessRate(history);
      expect(stats.streak).toBe(0);
    });

    it('should return empty stats for empty history', () => {
      const stats = calculateStreakAndSuccessRate([]);
      expect(stats.streak).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('Onboarding Form Field Validation', () => {
    function validateOnboarding(data: {
      name: string;
      age: number;
      occupation: string;
      habits: string[];
      shortTermGoal: string;
      longTermGoal: string;
      whyGoalMatters: string;
    }) {
      const errors: string[] = [];
      if (!data.name || data.name.trim().length < 2) {
        errors.push("Name must be at least 2 characters.");
      }
      if (!data.age || data.age < 12 || data.age > 120) {
        errors.push("Please enter a valid age (12-120).");
      }
      if (!data.occupation || data.occupation.trim().length < 2) {
        errors.push("Occupation is required.");
      }
      if (!data.habits || data.habits.length === 0) {
        errors.push("At least one habit must be selected.");
      }
      if (!data.shortTermGoal || data.shortTermGoal.trim().length < 5) {
        errors.push("Please define a concrete short-term goal.");
      }
      return { isValid: errors.length === 0, errors };
    }

    it('should pass on valid onboarding data', () => {
      const validOnboarding = {
        name: "Abhinay",
        age: 28,
        occupation: "Software Engineer",
        habits: ["Instagram scrolling"],
        shortTermGoal: "Reduce screen time by 50%",
        longTermGoal: "Launch side project",
        whyGoalMatters: "To become a high-performer"
      };
      const result = validateOnboarding(validOnboarding);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should catch invalid name and age', () => {
      const invalidData = {
        name: "A",
        age: 5,
        occupation: "",
        habits: [] as string[],
        shortTermGoal: "Tiny",
        longTermGoal: "",
        whyGoalMatters: ""
      };
      const result = validateOnboarding(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Name must be at least 2 characters.");
      expect(result.errors).toContain("Please enter a valid age (12-120).");
      expect(result.errors).toContain("Occupation is required.");
      expect(result.errors).toContain("At least one habit must be selected.");
      expect(result.errors).toContain("Please define a concrete short-term goal.");
    });
  });

  describe('Zod Schema Runtime Validation Suite', () => {
    it('should validate InterviewQuestionSchema correctly', () => {
      const valid = { question: "What is your trigger?" };
      expect(InterviewQuestionSchema.parse(valid)).toEqual(valid);
      expect(() => InterviewQuestionSchema.parse({})).toThrow();
    });

    it('should validate BehaviourProfileSchema correctly', () => {
      const valid = {
        primaryAddiction: "scrolling",
        secondaryAddiction: "procrastination",
        rootCause: "stress",
        highRiskTime: "evening",
        highRiskSituation: "boredom",
        motivationSummary: "better health",
        behaviourSummary: "triggers loop"
      };
      expect(BehaviourProfileSchema.parse(valid)).toEqual(valid);
      expect(() => BehaviourProfileSchema.parse({ primaryAddiction: "scrolling" })).toThrow();
    });

    it('should validate SOSDecisionSchema correctly', () => {
      const valid = {
        options: [
          { title: "Deep breaths", reason: "calming", effortLevel: "Low", score: 95 }
        ],
        chosenOption: { title: "Deep breaths", reason: "highly rated" },
        reasoning: "best option",
        escalation: { shouldEscalate: false, escalationReason: "stable" }
      };
      expect(SOSDecisionSchema.parse(valid)).toEqual(valid);
      expect(() => SOSDecisionSchema.parse({})).toThrow();
    });

    it('should validate FutureSelfSchema correctly', () => {
      const valid = { relapse: "regret", resist: "pride" };
      expect(FutureSelfSchema.parse(valid)).toEqual(valid);
      expect(() => FutureSelfSchema.parse({})).toThrow();
    });

    it('should validate TodayInsightSchema correctly', () => {
      const valid = { insight: "doing great", adaptiveMove: "increaseDifficulty" as const, adaptiveReason: "ready" };
      expect(TodayInsightSchema.parse(valid)).toEqual(valid);
      
      const invalidMove = { insight: "doing great", adaptiveMove: "invalidChoice", adaptiveReason: "ready" };
      expect(() => TodayInsightSchema.parse(invalidMove)).toThrow();
    });

    it('should validate RecoveryPlanSchema correctly', () => {
      const valid = {
        todayGoal: "no scrolls",
        replacementActivity: "read a book",
        microHabit: "leave phone",
        encouragement: "you got this",
        tomorrowFocus: "stay focus"
      };
      expect(RecoveryPlanSchema.parse(valid)).toEqual(valid);
      expect(() => RecoveryPlanSchema.parse({})).toThrow();
    });

    it('should validate AccountabilityMessageSchema correctly', () => {
      const valid = { messageText: "hey help me out" };
      expect(AccountabilityMessageSchema.parse(valid)).toEqual(valid);
      expect(() => AccountabilityMessageSchema.parse({})).toThrow();
    });
  });
});
