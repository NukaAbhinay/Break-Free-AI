/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { z, ZodError } from "zod";
import { detectCrisis } from "./src/lib/safety";
import {
  InterviewQuestionSchema,
  BehaviourProfileSchema,
  SOSDecisionSchema,
  FutureSelfSchema,
  TodayInsightSchema,
  RecoveryPlanSchema,
  AccountabilityMessageSchema,
  OnboardingInputSchema,
  TranscriptTurnSchema,
  HistoryEntrySchema
} from "./src/lib/aiSchemas";
import {
  DEFAULT_DEMO_ONBOARDING,
  FALLBACK_PROFILE,
  getFallbackInterviewQuestion,
  getFallbackBehaviourProfile,
  getFallbackSOSDecision,
  getFallbackFutureSelf,
  getFallbackTodayInsight,
  getFallbackRecoveryPlan,
  getFallbackAccountabilityMessage
} from "./src/lib/demoData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Google Gen AI client helper
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in AI Studio Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Global model selection
const MODEL_NAME = "gemini-3.5-flash";

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * 1. AI INTERVIEW (Gemini call #1)
 * Generates the next deep follow-up question.
 */
app.post("/api/interview/next", async (req, res) => {
  try {
    const validationResult = z.object({
      onboarding: OnboardingInputSchema,
      transcript: z.array(TranscriptTurnSchema).optional().default([]),
      currentIndex: z.number().nonnegative()
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { onboarding, transcript, currentIndex } = validationResult.data;

    const ai = getAI();

    // Compile conversational background
    const prompt = `
      You are the elite behavior psychologist and behavioral change architect behind BreakFree AI.
      We are performing a multi-step dynamic onboarding interview for a user wanting to break an addiction or habit.
      
      User's Onboarding Information:
      - Name: ${onboarding.name}
      - Age: ${onboarding.age}
      - Occupation: ${onboarding.occupation}
      - Habit(s) to break: ${onboarding.habits.join(", ")}
      - Short-term Goal: ${onboarding.shortTermGoal}
      - Long-term Goal: ${onboarding.longTermGoal}
      - Why goal matters: ${onboarding.whyGoalMatters}
      - Accountability Partner: ${onboarding.accountabilityPartner || "None listed"}

      Current Interview Transcript so far (empty if this is the first question):
      ${transcript && transcript.length > 0 
        ? transcript.map((t: any, i: number) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`).join("\n\n")
        : "None. This is the very first follow-up question."}

      This is Question Number ${currentIndex + 1} of 4.
      
      Your Goal:
      Based on the user's specific answers and context, generate the single NEXT most insightful follow-up question.
      
      CRITICAL CONSTRAINT: The question MUST be extremely short, crisp, and conversational (maximum 15 words). 
      Avoid clumsy introductions, explanations, or academic preambles. Get straight to the point.
      
      Example style: "What triggers your urge to scroll first thing in the morning?" or "How does Sarah check in on your focus goals?"
      
      Target these behavioral dimensions across the interview:
      - Root causes (emotional triggers)
      - Environmental cues/triggers
      - Daily routines
      - Prior attempts to quit
      
      Return a structured JSON with a single property 'question'.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "The next customized follow-up question to ask the user."
            }
          },
          required: ["question"]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = InterviewQuestionSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating next question (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const currentIndex = typeof req.body?.currentIndex === 'number' ? req.body.currentIndex : 0;
    const fallback = getFallbackInterviewQuestion(currentIndex);
    return res.json({ ...fallback, isFallback: true });
  }
});

/**
 * 2. BEHAVIOUR PROFILE (Gemini call #2)
 * Compiles the full interview transcript into a structured Behaviour Profile card.
 */
app.post("/api/interview/profile", async (req, res) => {
  try {
    const validationResult = z.object({
      onboarding: OnboardingInputSchema,
      transcript: z.array(TranscriptTurnSchema)
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { onboarding, transcript } = validationResult.data;

    const ai = getAI();

    const prompt = `
      You are an expert behavior psychologist. Based on the user's onboarding info and the complete follow-up interview,
      synthesize a comprehensive Behaviour Profile.
      
      User's Onboarding Info:
      - Name: ${onboarding.name}
      - Age: ${onboarding.age}
      - Occupation: ${onboarding.occupation}
      - Declared Habit(s): ${onboarding.habits.join(", ")}
      - Goals: Short-term "${onboarding.shortTermGoal}", Long-term "${onboarding.longTermGoal}" (Why: "${onboarding.whyGoalMatters}")

      Completed Interview Transcript:
      ${transcript.map((t: any, i: number) => `Q: ${t.question}\nA: ${t.answer}`).join("\n\n")}

      Analyze the underlying psychological factors and return a structured JSON behavior profile. Be direct, compassionate, and highly professional.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryAddiction: {
              type: Type.STRING,
              description: "The main behavioral pattern or core addiction being tackled (e.g. Excessive Instagram scrolling)."
            },
            secondaryAddiction: {
              type: Type.STRING,
              description: "Any secondary or underlying habits/cues (e.g. YouTube consumption, bedtime doomscrolling, procrastination)."
            },
            rootCause: {
              type: Type.STRING,
              description: "The deeper psychological driver (e.g. Escape from engineering Imposter Syndrome, dopamine deficit, anxiety relief)."
            },
            highRiskTime: {
              type: Type.STRING,
              description: "The times or routines with highest vulnerability (e.g. Late evenings after work, immediately after debug failures)."
            },
            highRiskSituation: {
              type: Type.STRING,
              description: "Environmental cues triggering the urge (e.g. Stuck on a coding problem, physical fatigue with laptop open)."
            },
            motivationSummary: {
              type: Type.STRING,
              description: "Core motivator summary (e.g. Desires to build a breakthrough tech project, protect focus block)."
            },
            behaviourSummary: {
              type: Type.STRING,
              description: "A summary of their typical cycle (Trigger -> Craving -> Habit -> Negative Reward)."
            }
          },
          required: [
            "primaryAddiction",
            "secondaryAddiction",
            "rootCause",
            "highRiskTime",
            "highRiskSituation",
            "motivationSummary",
            "behaviourSummary"
          ]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = BehaviourProfileSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating behaviour profile (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const onboarding = req.body?.onboarding || DEFAULT_DEMO_ONBOARDING;
    const fallback = getFallbackBehaviourProfile(onboarding);
    return res.json({ ...fallback, isFallback: true });
  }
});

/**
 * 3. SOS DECISION ENGINE (Gemini call #3) — HERO FEATURE
 * Receives current SOS urge text, the Behaviour Profile, and a history of logged past urges/outcomes.
 * It must output candidate options, choose the best one, justify it, and decide on escalation.
 */
app.post("/api/sos/decide", async (req, res) => {
  try {
    const validationResult = z.object({
      sosText: z.string().min(1, "SOS text is required"),
      profile: BehaviourProfileSchema,
      history: z.array(HistoryEntrySchema).optional().default([])
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { sosText, profile, history } = validationResult.data;

    // Safety pre-flight crisis intercept
    if (detectCrisis(sosText)) {
      return res.json({
        options: [
          {
            title: "988 Suicide & Crisis Lifeline",
            reason: "Immediate professional support is available 24/7. This is the optimal response to ensure your safety.",
            effortLevel: "Low",
            score: 100
          },
          {
            title: "Crisis Text Line (SMS HOME to 741741)",
            reason: "Connect with a volunteer crisis counselor via text for confidential support.",
            effortLevel: "Low",
            score: 100
          },
          {
            title: "Notify Accountability Partner",
            reason: "Contact your trusted partner directly or request a face-to-face check-in.",
            effortLevel: "Low",
            score: 100
          }
        ],
        chosenOption: {
          title: "988 Suicide & Crisis Lifeline",
          reason: "Please call or text 988. Professional care and support is available 24/7. You do not have to carry this alone."
        },
        reasoning: "A security safety check matched high-risk keywords in your SOS entry. Bypassing the AI model to guarantee immediate crisis care and hotline information.",
        escalation: {
          shouldEscalate: true,
          escalationReason: "Pre-flight safety logic flagged crisis/self-harm risk phrases."
        }
      });
    }

    const ai = getAI();

    const prompt = `
      You are the core decision engine of BreakFree AI. An active craving/SOS crisis event has been triggered.
      
      User's Urge Description: "${sosText}"

      User's Behavioral Profile:
      - Primary Addiction: ${profile.primaryAddiction}
      - Root Cause: ${profile.rootCause}
      - High Risk Time/Situation: ${profile.highRiskTime} / ${profile.highRiskSituation}
      - Core Motivator: ${profile.motivationSummary}

      Recent Urge/Craving History (for context of what worked/failed before):
      ${history && history.length > 0
        ? history.map((h: any) => `- Trigger: "${h.trigger}" | Action Chosen: "${h.chosenAction}" | Outcome: "${h.outcome}"`).join("\n")
        : "No previous history logged yet."}

      YOUR CRITICAL INSTRUCTIONS:
      1. CRID/CRISIS CHECK: Evaluate the urge text for safety signals (such as self-harm, severe substance withdrawal danger, or acute crisis). 
         - If severe crisis or self-harm is detected, set "escalation.shouldEscalate" to true, and skip normal productivity tips. Provide official emergency response/hotline recommendations in the chosenOption.
      2. COMPETING OPTIONS: Formulate 3 distinct candidate strategies to combat this urge in the moment. Each option must have:
         - title: The name of the action.
         - reason: A personalized, contextual justification referencing why this fits the user's root cause or matches their goals (e.g. engineering aspirations).
         - effortLevel: "Low", "Medium", or "High".
         - score: (0-100) estimated chance of success based on history/triggers.
      3. CHOOSE WINNER: Select the single best option. Highlight why this is the winner in "reasoning", specifically referencing details like past success in history or compatibility with their current state.
      4. ESCALATION: Decide if we should escalate (set "shouldEscalate" to true if user is highly struggling or text is intense/alarming). Give an "escalationReason".
      
      Format the response exactly as structured JSON matching the requested schema.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Personalized reason why this activity defuses this specific urge." },
                  effortLevel: { type: Type.STRING, description: "Low, Medium, or High." },
                  score: { type: Type.INTEGER, description: "Predictive success score from 0 to 100." }
                },
                required: ["title", "reason", "effortLevel", "score"]
              }
            },
            chosenOption: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["title", "reason"]
            },
            reasoning: {
              type: Type.STRING,
              description: "A detailed comparison explaining why the chosen option is the optimal action, linking history to the profile."
            },
            escalation: {
              type: Type.OBJECT,
              properties: {
                shouldEscalate: { type: Type.BOOLEAN, description: "True if severe struggle or emergency is detected, requiring peer/support notification." },
                escalationReason: { type: Type.STRING, description: "Why the decision engine chose to trigger escalation." }
              },
              required: ["shouldEscalate", "escalationReason"]
            }
          },
          required: ["options", "chosenOption", "reasoning", "escalation"]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = SOSDecisionSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error in SOS decision engine (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const sosText = typeof req.body?.sosText === 'string' ? req.body.sosText : "feeling trigger";
    const fallback = getFallbackSOSDecision(sosText);
    return res.json({ ...fallback, isFallback: true });
  }
});

/**
 * 4. FUTURE SELF SIMULATION (Gemini call #4) — THE UNFORGETTABLE MOMENT
 * Generates two short, first-person audio scripts from 30 days in the future.
 */
app.post("/api/future-self", async (req, res) => {
  try {
    const validationResult = z.object({
      onboarding: OnboardingInputSchema.optional(),
      profile: BehaviourProfileSchema
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { onboarding, profile } = validationResult.data;

    const ai = getAI();

    const prompt = `
      You are the user's Future Self, speaking to them from 30 days in the future.
      You must write two first-person messages. 
      Use the user's actual profile details:
      - Name: ${onboarding?.name || "Friend"}
      - Occupation: ${onboarding?.occupation || "Software Engineer"}
      - Primary Addiction/Habit: ${profile.primaryAddiction}
      - Motivation/Long-Term Goal: ${profile.motivationSummary}

      Messages must be highly realistic, specific to their occupation (e.g. software engineering, debugging, building software, career goals), emotional, and impactful. Avoid preachy or generic copy.
      Keep them relatively short (40-60 words each) so they play beautifully via Text-To-Speech.

      Return a structured JSON with two scripts:
      1. 'relapse': The future if they continued their addiction. Speak in a quietly sad, regretful, exhausted tone. Detail how their goals slipped away, how they failed to build what they wanted, and the screen-time fog.
      2. 'resist': The future if they resisted today. Speak in an earned, energized, clear, proud tone. Detail how their focus returned, how they finally built their project/met their goals, and the clarity they feel.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relapse: {
              type: Type.STRING,
              description: "A short first-person regretful narrative. 40-60 words."
            },
            resist: {
              type: Type.STRING,
              description: "A short first-person empowered narrative. 40-60 words."
            }
          },
          required: ["relapse", "resist"]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = FutureSelfSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating future self scripts (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const onboarding = req.body?.onboarding || DEFAULT_DEMO_ONBOARDING;
    const fallback = getFallbackFutureSelf(onboarding);
    return res.json({ ...fallback, isFallback: true });
  }
});

/**
 * 5. TODAY'S AI INSIGHT (Gemini call #5)
 * Analyzes past urge history + profile to provide an adaptive coaching move.
 */
app.post("/api/today-insight", async (req, res) => {
  try {
    const validationResult = z.object({
      profile: BehaviourProfileSchema,
      history: z.array(HistoryEntrySchema)
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { profile, history } = validationResult.data;

    const ai = getAI();

    const prompt = `
      You are the Lead Behavioral Coach for BreakFree AI. 
      Analyze the user's Behaviour Profile and the past urge history log.
      
      User Profile:
      - Primary Habit: ${profile.primaryAddiction}
      - Root Cause: ${profile.rootCause}
      - High Risk Situation: ${profile.highRiskSituation}

      Past Urges History:
      ${JSON.stringify(history)}

      INSTRUCTIONS:
      1. Analyze patterns in the history (e.g. do urges happen late at night, or when coding gets hard? Did they successfully resist or relapse?). Refer to specific counts or patterns in the data.
      2. Provide a single 'insight' statement that connects a visible pattern in their logs to their profile (e.g. "You've successfully resisted late night urges 3 times, but struggle when debug tasks stall in the afternoon.").
      3. Decide on an adaptive coaching move ('adaptiveMove') which MUST be one of these three strings:
         - "keepPlan": if things are going steady.
         - "increaseDifficulty": if they are on a streak of successes.
         - "swapStrategy": if they had recent relapses or are struggling in the same high-risk situation.
      4. Provide a solid one-line justification explaining why you made this adaptive change ('adaptiveReason').
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: {
              type: Type.STRING,
              description: "A data-driven, highly personalized behavioral insight referencing the logged history trends."
            },
            adaptiveMove: {
              type: Type.STRING,
              description: "Must be exactly 'keepPlan', 'increaseDifficulty', or 'swapStrategy'."
            },
            adaptiveReason: {
              type: Type.STRING,
              description: "A professional coaching explanation of the plan adjustment."
            }
          },
          required: ["insight", "adaptiveMove", "adaptiveReason"]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = TodayInsightSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating today's insight (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const profile = req.body?.profile || FALLBACK_PROFILE;
    const fallback = getFallbackTodayInsight(profile);
    return res.json({ ...fallback, isFallback: true });
  }
});

/**
 * 6. RECOVERY PLAN (Gemini call #6)
 * Generates the daily goals and microhabits aligned with the adaptive decision.
 */
app.post("/api/recovery-plan", async (req, res) => {
  try {
    const validationResult = z.object({
      profile: BehaviourProfileSchema,
      adaptiveMove: z.enum(["keepPlan", "increaseDifficulty", "swapStrategy"])
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { profile, adaptiveMove } = validationResult.data;

    const ai = getAI();

    const prompt = `
      Create a highly actionable Recovery Plan for today. 
      The plan must be fully aligned with the active coaching move: "${adaptiveMove}".
      
      User Profile:
      - Habit: ${profile.primaryAddiction}
      - Root Cause: ${profile.rootCause}
      - High Risk: ${profile.highRiskSituation}

      Formulate practical engineering-friendly microhabits and clear actionable statements.
      - "keepPlan": reinforce existing routines, stay steady.
      - "increaseDifficulty": introduce higher barriers, like turning off notifications or doing a longer coding lock-block.
      - "swapStrategy": implement a completely different physical or mental trigger replacement (e.g. standing desk setup or deep box breathing).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            todayGoal: {
              type: Type.STRING,
              description: "A quantitative, highly concrete goal for today (e.g. Max 15 mins Instagram, strictly after 8 PM)."
            },
            replacementActivity: {
              type: Type.STRING,
              description: "A tailored alternative to do immediately when the urge hits (e.g. Work on your compiler side-project, write a test case)."
            },
            microHabit: {
              type: Type.STRING,
              description: "A tiny 2-minute habit to implement (e.g. Leave phone in another room before opening IDE)."
            },
            encouragement: {
              type: Type.STRING,
              description: "A customized behavioral encouragement line referencing their goals."
            },
            tomorrowFocus: {
              type: Type.STRING,
              description: "A brief mental cue for tomorrow's defensive setup."
            }
          },
          required: ["todayGoal", "replacementActivity", "microHabit", "encouragement", "tomorrowFocus"]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = RecoveryPlanSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating recovery plan (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const profile = req.body?.profile || FALLBACK_PROFILE;
    const fallback = getFallbackRecoveryPlan(profile);
    return res.json({ ...fallback, isFallback: true });
  }
});

/**
 * 7. ACCOUNTABILITY PARTNER MESSAGE GENERATOR
 * Generates a tailored message the user can send to their trusted contact.
 */
app.post("/api/accountability/message", async (req, res) => {
  try {
    const validationResult = z.object({
      onboarding: OnboardingInputSchema,
      profile: BehaviourProfileSchema.nullable().optional()
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        details: validationResult.error.issues
      });
    }
    const { onboarding, profile } = validationResult.data;

    const ai = getAI();

    const partnerName = onboarding.accountabilityPartner || "Partner";

    const prompt = `
      You are a warm, helpful, non-melodramatic assistant. 
      Generate a short text message that ${onboarding.name} can send to their accountability partner, ${partnerName}.
      The message should be honest, warm, not overly dramatic, but clear about asking for help with overcoming their habit (${profile?.primaryAddiction || onboarding.habits[0]}).
      Reference their core goal: "${onboarding.shortTermGoal}" so the partner understands why this matters.
      Keep it brief, ready to copy and paste.
      
      Return structured JSON with a single property 'messageText'.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            messageText: {
              type: Type.STRING,
              description: "The pasteable SMS or chat text to send to their accountability partner."
            }
          },
          required: ["messageText"]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const data = AccountabilityMessageSchema.parse(rawData);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating accountability message (using fallback):", error);
    res.setHeader("x-is-fallback", "true");
    const onboarding = req.body?.onboarding || DEFAULT_DEMO_ONBOARDING;
    const fallback = getFallbackAccountabilityMessage(onboarding);
    return res.json({ ...fallback, isFallback: true });
  }
});

// -------------------------------------------------------------
// Dev & Production serving
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BreakFree AI Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
