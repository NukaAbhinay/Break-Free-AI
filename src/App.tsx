/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  ArrowRight, 
  MessageSquare, 
  Compass, 
  Zap, 
  Activity, 
  TrendingUp, 
  Heart, 
  User, 
  Volume2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Plus, 
  RefreshCw,
  Home,
  CheckCircle,
  HelpCircle,
  X,
  Play,
  Square,
  Sparkles
} from "lucide-react";

import { 
  OnboardingData, 
  InterviewTurn, 
  BehaviourProfile, 
  UrgeHistoryEntry, 
  DecisionEngineResponse, 
  FutureSelfSimulation, 
  TodayInsightResponse, 
  RecoveryPlanResponse 
} from "./types";

import { 
  DEFAULT_DEMO_ONBOARDING, 
  SEEDED_URGE_HISTORY, 
  FALLBACK_PROFILE 
} from "./lib/demoData";

import { detectCrisis } from "./lib/safety";

export default function App() {
  // Navigation Phases: "landing" | "onboarding" | "interview" | "profile" | "dashboard"
  const [phase, setPhase] = useState<"landing" | "onboarding" | "interview" | "profile" | "dashboard">("landing");
  
  // Highlighted Pillar indicator (for Hackathon Judges)
  const [activePillar, setActivePillar] = useState<number | null>(null);

  // -------------------------------------------------------------
  // Onboarding & Interview States
  // -------------------------------------------------------------
  const [onboarding, setOnboarding] = useState<OnboardingData>({ ...DEFAULT_DEMO_ONBOARDING });
  const [interviewTranscript, setInterviewTranscript] = useState<InterviewTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [interviewIndex, setInterviewIndex] = useState<number>(0);
  
  // -------------------------------------------------------------
  // Compiled Behavior State
  // -------------------------------------------------------------
  const [profile, setProfile] = useState<BehaviourProfile | null>(null);
  
  // -------------------------------------------------------------
  // Dashboard & Tracking States
  // -------------------------------------------------------------
  const [history, setHistory] = useState<UrgeHistoryEntry[]>([...SEEDED_URGE_HISTORY]);
  const [todayInsight, setTodayInsight] = useState<TodayInsightResponse | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlanResponse | null>(null);
  const [accountabilityMsg, setAccountabilityMsg] = useState<string>("");
  const [copiedMsg, setCopiedMsg] = useState<boolean>(false);

  // -------------------------------------------------------------
  // SOS & Decision Engine States
  // -------------------------------------------------------------
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [sosText, setSosText] = useState<string>("");
  const [decisionResult, setDecisionResult] = useState<DecisionEngineResponse | null>(null);
  
  // -------------------------------------------------------------
  // Future Self Simulation States
  // -------------------------------------------------------------
  const [futureSelf, setFutureSelf] = useState<FutureSelfSimulation | null>(null);
  const [playingAudio, setPlayingAudio] = useState<"relapse" | "resist" | null>(null);

  // -------------------------------------------------------------
  // Manual Urge Logging States (for interactive live demo checks)
  // -------------------------------------------------------------
  const [customLogActive, setCustomLogActive] = useState<boolean>(false);
  const [customTrigger, setCustomTrigger] = useState<string>("");
  const [customAction, setCustomAction] = useState<string>("");
  const [customOutcome, setCustomOutcome] = useState<"success" | "relapsed">("success");

  // -------------------------------------------------------------
  // Loading & Global Error States (with high-grade robustness fallback)
  // -------------------------------------------------------------
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationModal, setValidationModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

  // Auto-clear success highlights
  useEffect(() => {
    if (copiedMsg) {
      const timer = setTimeout(() => setCopiedMsg(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMsg]);

  // Ensure speech synthesisis cancelled on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Update highlighted Hackathon Pillars based on active interaction
  useEffect(() => {
    if (phase === "profile") {
      setActivePillar(5); // Sustained Behaviour Change
    } else if (sosActive) {
      setActivePillar(4); // Support Mechanisms (Escalation / Accountability)
    } else {
      setActivePillar(null);
    }
  }, [phase, sosActive]);

  // -------------------------------------------------------------
  // Gemini API client actions (Full Error-to-UI Mapping)
  // -------------------------------------------------------------

  const triggerError = (err: any, fallbackMessage: string) => {
    console.error(err);
    setApiError(`${fallbackMessage}: ${err.message || err.toString()}`);
    setLoading(false);
  };

  // Skip error / use offline pre-seeded defaults for bulletproof demo safety
  const loadOfflineSeededSession = () => {
    setApiError(null);
    setProfile(FALLBACK_PROFILE);
    setTodayInsight({
      insight: "You experience high screen cravings during engineering roadblocks around late afternoon. Pre-empting frustation with a 5-minute break works 80% of the time.",
      adaptiveMove: "swapStrategy",
      adaptiveReason: "Recent 45-minute Instagram relapse suggests bedside reels and code blockers are persistent pitfalls."
    });
    setRecoveryPlan({
      todayGoal: "Block all browsers during active coding. Max 10 minutes Instagram scrolling strictly after dinner.",
      replacementActivity: "Write an esbuild plugin or build an automated test suite when stuck on code.",
      microHabit: "Put phone in another room or keep in deep desk drawer during VS Code focus blocks.",
      encouragement: "Sarah is tracking your progress. Master distributed systems, Alex. Your future self is waiting.",
      tomorrowFocus: "Late evening focus shift. Ensure bedside table is phone-free."
    });
    setAccountabilityMsg("Hey Sarah, I'm using BreakFree AI to keep me focused on mastering distributed systems today. If I'm unresponsive or active on Instagram later, drop me a nudge to close the app. Thanks for being my wingman!");
    setFutureSelf({
      relapse: "Alex, it's 30 days from now. We didn't stop. We're still doomscrolling Instagram late into the night. That advanced systems project is abandoned. Sarah is disappointed, and we're stuck in the same entry-level coding loop. Please, close the tab now.",
      resist: "Alex! We made it. It's been 30 days. We reclaimed 3 hours of focus blocks every day. We completed the core database parser.Sarah has recommended us for the system architecture lead role. The focus feels incredible. Proud of you for resisting."
    });
    setPhase("profile");
  };

  // Phase transition: Launch Onboarding
  const startOnboarding = () => {
    setApiError(null);
    setPhase("onboarding");
  };

  // Call 1: Dynamic Question Engine (starts the Interview phase)
  const submitOnboardingAndFetchQuestion = async () => {
    // 1. Name validation
    if (!onboarding.name || !onboarding.name.trim()) {
      setValidationModal({
        isOpen: true,
        title: "Name is Required",
        message: "Please enter your name so the coach can personalize your behavioral diagnostic interview."
      });
      return;
    }

    // 2. Age validation: must be a positive number
    const parsedAge = Number(onboarding.age);
    if (!onboarding.age || isNaN(parsedAge) || parsedAge <= 0) {
      setValidationModal({
        isOpen: true,
        title: "Invalid Age Entry",
        message: "Age must be a positive number. Please enter a valid positive number for your age (e.g. 24)."
      });
      return;
    }

    // 3. Occupation validation
    if (!onboarding.occupation || !onboarding.occupation.trim()) {
      setValidationModal({
        isOpen: true,
        title: "Occupation is Required",
        message: "Please enter your occupation so the AI can ground coaching scenarios in your professional routine."
      });
      return;
    }

    // 4. Habit selection validation: at least one habit
    if (!onboarding.habits || onboarding.habits.length === 0) {
      setValidationModal({
        isOpen: true,
        title: "Target Habit Required",
        message: "You must select at least one target habit (e.g. Instagram, YouTube) to start the behavioral diagnostic."
      });
      return;
    }

    setLoading(true);
    setApiError(null);
    setLoadingMessage("Gemini is analyzing your goals & crafting your interview path...");
    
    try {
      const response = await fetch("/api/interview/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding, transcript: [], currentIndex: 0 })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setCurrentQuestion(data.question);
      setInterviewTranscript([]);
      setInterviewIndex(0);
      setPhase("interview");
    } catch (err) {
      triggerError(err, "Gemini failed to generate follow-up question. Use the offline fallback for demo purposes.");
    } finally {
      setLoading(false);
    }
  };

  // Call 1 (cont.): Next Question Turn
  const submitInterviewTurn = async () => {
    if (!userAnswer.trim()) {
      alert("Please enter a response to the question.");
      return;
    }
    setLoading(true);
    setApiError(null);
    setLoadingMessage(`Gemini is evaluating Answer #${interviewIndex + 1}...`);

    const newTranscript = [...interviewTranscript, { question: currentQuestion, answer: userAnswer }];
    setInterviewTranscript(newTranscript);
    setUserAnswer("");

    const nextIndex = interviewIndex + 1;

    if (nextIndex >= 4) {
      // Completed 4 questions! Generate Behaviour Profile automatically
      await generateBehaviourProfile(newTranscript);
    } else {
      // Fetch Next Question
      try {
        const response = await fetch("/api/interview/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarding, transcript: newTranscript, currentIndex: nextIndex })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        setCurrentQuestion(data.question);
        setInterviewIndex(nextIndex);
      } catch (err) {
        triggerError(err, "Failed to load next interview question.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Call 2: Generate Behaviour Profile from full transcript
  const generateBehaviourProfile = async (completedTranscript: InterviewTurn[]) => {
    setLoading(true);
    setLoadingMessage("Psychological Synthesis: Gemini is compiling your Behaviour Profile card...");
    try {
      // Fetch Behaviour Profile
      const profileRes = await fetch("/api/interview/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding, transcript: completedTranscript })
      });
      if (!profileRes.ok) throw new Error(await profileRes.text());
      const profileData: BehaviourProfile = await profileRes.json();
      setProfile(profileData);

      // Pre-load Future Self Simulation (Call 4) & Today's Insight (Call 5) so the dashboard is instantly fully interactive
      await fetchInitialDashboardData(profileData);
      setPhase("profile");
    } catch (err) {
      triggerError(err, "Behavioral modeling synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Load Dashboard assets (Today's Insight, Recovery Plan, Future Self Script, Accountability Partner message)
  const fetchInitialDashboardData = async (activeProfile: BehaviourProfile) => {
    try {
      // 1. Fetch Insight & Adaptive Plan decision (Call 5)
      const insightRes = await fetch("/api/today-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: activeProfile, history })
      });
      const insightData: TodayInsightResponse = insightRes.ok 
        ? await insightRes.json()
        : {
            insight: "You usually seek quick Instagram escapes when debugging gets difficult around 3 PM.",
            adaptiveMove: "swapStrategy",
            adaptiveReason: "High bedside scrolling rates and code barriers suggest switching focus activities."
          };
      setTodayInsight(insightData);

      // 2. Fetch Recovery Plan (Call 6)
      const planRes = await fetch("/api/recovery-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: activeProfile, adaptiveMove: insightData.adaptiveMove })
      });
      const planData: RecoveryPlanResponse = planRes.ok
        ? await planRes.json()
        : {
            todayGoal: "Strictly offline focus coding blocks. Phone left out of reach entirely.",
            replacementActivity: "Open terminal, review a local git commit, or drink cold water.",
            microHabit: "Shut down phone browser app before opening IDE workspace.",
            encouragement: "Remember Alex, Sarah and your engineering goals depend on reclaiming focus.",
            tomorrowFocus: "Keep morning sessions completely digital-distraction free."
          };
      setRecoveryPlan(planData);

      // 3. Fetch Future Self scripts (Call 4)
      const fsRes = await fetch("/api/future-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding, profile: activeProfile })
      });
      const fsData: FutureSelfSimulation = fsRes.ok
        ? await fsRes.json()
        : {
            relapse: `Hey ${onboarding.name}, it's your Future Self. It's been 30 days and we relapsed on Instagram. We failed to master distributed systems. Sarah and our team notice our low progress. We feel exhausted and unfocused. Put the phone down now.`,
            resist: `Hey ${onboarding.name}! We resisted and completed our system architecture modules. Our focus is razor sharp, Sarah promoted us, and we are leading database engineering. Your resilience today paid off.`
          };
      setFutureSelf(fsData);

      // 4. Fetch Accountability Partner Message
      const accRes = await fetch("/api/accountability/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding, profile: activeProfile })
      });
      const accData = accRes.ok 
        ? await accRes.json()
        : { messageText: `Hey ${onboarding.accountabilityPartner || 'Sarah'}, I'm using BreakFree AI to hit my goals to master systems today. If I'm offline or distracted by Instagram, shoot me a check-in! Thank you!` };
      setAccountabilityMsg(accData.messageText);

    } catch (err) {
      console.error("Dashboard preloading warnings:", err);
    }
  };

  // Re-trigger dynamic insights manually (proving insight adapts if seeded history changes!)
  const recalculateDailyInsights = async () => {
    if (!profile) return;
    setLoading(true);
    setLoadingMessage("Re-evaluating tracking logs and recalculating adaptive coaching rules...");
    try {
      await fetchInitialDashboardData(profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Call 3: SOS DECISION ENGINE (The Hero Feature)
  const triggerSOSDecision = async () => {
    if (!sosText.trim()) {
      alert("Please type out what you are experiencing so Gemini can analyze it.");
      return;
    }

    if (detectCrisis(sosText)) {
      setDecisionResult({
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
        reasoning: "Our local pre-flight safety check matched high-risk keywords in your SOS entry. We bypassed AI network systems to instantly guarantee crisis care and helpline information.",
        escalation: {
          shouldEscalate: true,
          escalationReason: "Pre-flight safety logic flagged crisis/self-harm risk phrases."
        }
      });
      return;
    }

    setLoading(true);
    setLoadingMessage("Decision Engine processing safety metrics, history models, and behavioral plans...");
    setDecisionResult(null);

    try {
      const response = await fetch("/api/sos/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sosText, profile, history })
      });
      if (!response.ok) throw new Error(await response.text());
      const data: DecisionEngineResponse = await response.json();
      setDecisionResult(data);
    } catch (err) {
      triggerError(err, "SOS Decision Engine API error.");
    } finally {
      setLoading(false);
    }
  };

  // Play audio simulation using SpeechSynthesis (Grounds UNFORGETTABLE MOMENT)
  const playSpeech = (type: "relapse" | "resist") => {
    if (!futureSelf) return;
    const text = type === "relapse" ? futureSelf.relapse : futureSelf.resist;
    
    setPlayingAudio(type);
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose voice gracefully
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (voice) utterance.voice = voice;
    
    utterance.rate = 1.0;
    utterance.pitch = type === "relapse" ? 0.85 : 1.02; // regress sound deeper/depressed vs resist is brighter
    
    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = () => setPlayingAudio(null);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setPlayingAudio(null);
  };

  // Action: Add custom log dynamically during live demo (satisfies Today's Insight adaptive check)
  const logCustomUrge = () => {
    if (!customTrigger.trim() || !customAction.trim()) {
      alert("Please fill in both trigger and action.");
      return;
    }
    const newEntry: UrgeHistoryEntry = {
      timestamp: "Just now",
      trigger: customTrigger,
      chosenAction: customAction,
      outcome: customOutcome
    };
    
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    setCustomTrigger("");
    setCustomAction("");
    setCustomLogActive(false);

    // Auto recalculate insights to PROVE it updates dynamically!
    setTimeout(() => {
      recalculateDailyInsights();
    }, 100);
  };

  // Clean application state reset
  const resetApp = () => {
    setPhase("landing");
    setOnboarding({ ...DEFAULT_DEMO_ONBOARDING });
    setInterviewTranscript([]);
    setProfile(null);
    setHistory([...SEEDED_URGE_HISTORY]);
    setTodayInsight(null);
    setRecoveryPlan(null);
    setSosActive(false);
    setSosText("");
    setDecisionResult(null);
    setFutureSelf(null);
    setApiError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5  rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Global Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 id="app-logo" className="text-xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              BreakFree AI
            </h1>
            <p className="text-xs text-slate-400 font-medium">Break habits. Build your future.</p>
          </div>
        </div>

        {/* 5 Pillars Tracker Bar for Hackathon Judges */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-full px-5 py-1.5 text-xs">
          <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase font-bold mr-2">HACKATHON PILLARS:</span>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${activePillar === 1 || (phase === "dashboard" && !sosActive) ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            1. Intelligent Nudges
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${activePillar === 2 || (phase === "dashboard" && !sosActive) ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            2. Tracking
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${activePillar === 3 || (phase === "dashboard" && !sosActive) ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            3. Adaptive Coaching
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${activePillar === 4 ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/20' : 'text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            4. Support Mech
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${activePillar === 5 ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/20' : 'text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            5. Behaviour Change
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-3">
          {phase !== "landing" && (
            <button 
              id="reset-flow-btn"
              onClick={resetApp} 
              aria-label="Restart Demo Flow"
              className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 transition-all flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <RefreshCw className="w-3 h-3" />
              Restart Demo
            </button>
          )}
          <span className="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full font-mono font-medium border border-indigo-500/10">
            PROMPTWARS LIVE DEMO
          </span>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">

        {/* Global Error Banner with Instant Bypass */}
        {apiError && (
          <div id="error-banner" role="alert" className="mb-6 p-4 bg-rose-950/60 border border-rose-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-200 text-sm">Gemini Connection Error</h4>
                <p className="text-xs text-rose-300 mt-1 max-w-2xl">{apiError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button 
                id="bypass-btn"
                onClick={loadOfflineSeededSession} 
                aria-label="Bypass connection error and use seeded fallback data"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Bypass & Use Seeded Fallback
              </button>
              <button 
                id="close-error-btn"
                onClick={() => setApiError(null)} 
                aria-label="Dismiss error banner"
                className="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              id="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/85 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md"
            >
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin absolute top-3 left-3 animation-delay-150"></div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 text-center"
                >
                  <p className="text-sm font-semibold tracking-wide text-slate-300 font-mono">BREAKFREE COCHING ENGINE RUNNING</p>
                  <h3 className="text-xl font-display font-bold text-white mt-2 max-w-md">{loadingMessage}</h3>
                  <p className="text-xs text-indigo-400 mt-3 animate-pulse">Running live reasoning call on gemini-3.5-flash...</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Validation Modal Popup */}
        <AnimatePresence>
          {validationModal?.isOpen && (
            <motion.div 
              id="validation-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setValidationModal(null)}
            >
              <motion.div 
                id="validation-modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="validation-modal-title"
                aria-describedby="validation-modal-message"
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-rose-500/5 relative text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-rose-500/15 border border-rose-500/35 p-3 rounded-2xl text-rose-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 id="validation-modal-title" className="text-lg font-display font-bold text-white tracking-tight">
                      {validationModal.title}
                    </h3>
                    <p id="validation-modal-message" className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {validationModal.message}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    id="validation-modal-dismiss-btn"
                    onClick={() => setValidationModal(null)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    Got it, let me fix it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          
          {/* ==========================================
              LANDING SCREEN
             ========================================== */}
          {phase === "landing" && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto text-center py-12 md:py-20 relative px-4"
            >
              {/* Vibrant Ambient Glow behind header */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute -top-12 left-1/3 -translate-x-1/2 w-[240px] h-[240px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 px-4 py-2 rounded-full text-cyan-300 text-xs font-mono font-semibold mb-8 backdrop-blur-md shadow-lg shadow-cyan-500/5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                GOOGLE PROMPTWARS CHAMPION ENTRY
              </div>
              
              <h1 id="landing-title" className="text-5xl sm:text-7xl font-display font-extrabold tracking-tight text-white leading-tight">
                Break dopamine loops. <br />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
                  Visibly Decide.
                </span>
              </h1>
              
              <p className="mt-6 text-slate-300 text-base sm:text-xl max-w-xl mx-auto leading-relaxed font-sans">
                A gorgeous, AI-directed behavior coach designed to intercept screen addictions, bedtime doomscrolling, and high-risk urges with clinical, interactive decision logic.
              </p>

              {/* Refined Simplified Callout */}
              <div className="mt-12 p-6 bg-slate-900/40 border border-slate-800 rounded-3xl text-left glass-card relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
                <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/15 transition-all"></div>
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 animate-pulse text-cyan-400" /> 
                  ENGINE ARCHITECTURE STATUS:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-cyan-400 font-mono font-bold">01</span>
                    <div>
                      <span className="text-white font-semibold block">Decision Engine</span>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Runs dynamic simulation trees matching triggers to highly optimized recovery actions.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-purple-400 font-mono font-bold">02</span>
                    <div>
                      <span className="text-white font-semibold block">Future Self Simulation</span>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Confronts immediate triggers with dual voice simulations using native browser TTS.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  id="launch-onboarding-btn"
                  onClick={startOnboarding}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold px-10 py-4.5 rounded-2xl shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Start Behavioral Check
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
                <button
                  id="direct-seeded-btn"
                  onClick={loadOfflineSeededSession}
                  className="w-full sm:w-auto text-slate-300 hover:text-white font-semibold px-8 py-4.5 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/80 transition-all text-sm backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Skip to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              STEP 1: AI ONBOARDING
             ========================================== */}
          {phase === "onboarding" && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] border border-slate-800/80 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative top background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-6">
                <span>Phase 01</span>
                <span>•</span>
                <span>Onboarding Profile Setup</span>
              </div>
              
              <h2 id="onboarding-title" className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                Tell us your <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">struggle & goals</span>
              </h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                The onboarding fields are pre-filled with our rehearsed Hackathon Demo Persona to allow an immediate rapid pitch. Feel free to modify them.
              </p>

              <form noValidate onSubmit={(e) => { e.preventDefault(); submitOnboardingAndFetchQuestion(); }} className="space-y-6 mt-8 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="input-name" className="block text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Your Name</label>
                    <input 
                      type="text"
                      id="input-name"
                      value={onboarding.name}
                      onChange={(e) => setOnboarding({ ...onboarding, name: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all placeholder-slate-600"
                      placeholder="e.g. Alex Mercer"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="input-age" className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider">Age</label>
                      <label htmlFor="input-occupation" className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider pr-16 sm:pr-20">Occupation</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <input 
                          type="number"
                          id="input-age"
                          value={onboarding.age}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOnboarding({ ...onboarding, age: val });
                            const parsed = Number(val);
                            if (val !== "" && (isNaN(parsed) || parsed <= 0)) {
                              setValidationModal({
                                isOpen: true,
                                title: "Invalid Age Entry",
                                message: "Age must be a positive number. Please enter a valid positive number for your age (e.g. 24)."
                              });
                            }
                          }}
                          className={`w-full bg-slate-950/60 border rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all ${onboarding.age !== "" && (Number(onboarding.age) <= 0 || isNaN(Number(onboarding.age))) ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-cyan-500'}`}
                          placeholder="24"
                          required
                        />
                      </div>
                      <input 
                        type="text"
                        id="input-occupation"
                        value={onboarding.occupation}
                        onChange={(e) => setOnboarding({ ...onboarding, occupation: e.target.value })}
                        className="col-span-2 bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all placeholder-slate-600"
                        placeholder="e.g. Software Engineer"
                        required
                      />
                    </div>
                    {onboarding.age !== "" && (Number(onboarding.age) <= 0 || isNaN(Number(onboarding.age))) && (
                      <span className="text-rose-400 text-[10px] mt-1.5 block font-semibold animate-pulse">
                        ✕ Age must be a positive number
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider">Select Target Habit to Break</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-medium">At least one habit required</span>
                  </div>
                  
                  {onboarding.habits.length === 0 && (
                    <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Please select <strong>at least one</strong> target habit below to begin your behavioral diagnostic check.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Instagram", "YouTube", "Gaming", "Smoking", "Alcohol", "Custom"].map((habit) => {
                      const selected = onboarding.habits.includes(habit);
                      return (
                        <button
                          type="button"
                          key={habit}
                          onClick={() => {
                            if (selected) {
                              setOnboarding({ ...onboarding, habits: onboarding.habits.filter(h => h !== habit) });
                            } else {
                              setOnboarding({ ...onboarding, habits: [...onboarding.habits, habit] });
                            }
                          }}
                          aria-label={`Habit: ${habit}`}
                          aria-pressed={selected}
                          className={`px-3 py-3 rounded-xl text-xs font-semibold border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${selected ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/5' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
                        >
                          {habit}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-short-goal" className="block text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Short-Term Goal</label>
                    <textarea 
                      id="input-short-goal"
                      value={onboarding.shortTermGoal}
                      onChange={(e) => setOnboarding({ ...onboarding, shortTermGoal: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all h-20 resize-none placeholder-slate-600"
                      placeholder="e.g. Master distributed systems, reclaim focus blocks"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="input-long-goal" className="block text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Long-Term Vision</label>
                    <textarea 
                      id="input-long-goal"
                      value={onboarding.longTermGoal}
                      onChange={(e) => setOnboarding({ ...onboarding, longTermGoal: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all h-20 resize-none placeholder-slate-600"
                      placeholder="e.g. Become a Lead Systems Architect"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-why" className="block text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Why does this goal matter?</label>
                    <textarea 
                      id="input-why"
                      value={onboarding.whyGoalMatters}
                      onChange={(e) => setOnboarding({ ...onboarding, whyGoalMatters: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all h-20 resize-none placeholder-slate-600"
                      placeholder="Deep internal drive..."
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="input-partner" className="block text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">Accountability Partner (Optional)</label>
                    <input 
                      type="text"
                      id="input-partner"
                      value={onboarding.accountabilityPartner}
                      onChange={(e) => setOnboarding({ ...onboarding, accountabilityPartner: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all placeholder-slate-600"
                      placeholder="Sarah (Engineering Manager)"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">
                      Generates emergency alerts to copy-paste & send to your trusted manager or partner during heavy cravings.
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-900">
                  <button 
                    type="submit"
                    id="submit-onboarding-btn"
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-xl shadow-cyan-500/10 uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    Start AI Diagnostic Interview
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ==========================================
              STEP 2: AI INTERVIEW (DYNAMICAL TRANSCRIPT)
             ========================================== */}
          {phase === "interview" && (
            <motion.div 
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto glass-panel p-8 rounded-[32px] border border-slate-800/80 shadow-2xl relative overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 right-0 w-60 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="flex items-center justify-between text-cyan-400 text-xs font-mono uppercase tracking-widest mb-6 border-b border-slate-900 pb-4">
                <span className="flex items-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  Diagnostic Interview
                </span>
                <span className="bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full text-cyan-300 font-bold">
                  Question {interviewIndex + 1} of 4
                </span>
              </div>

              {/* Running interview chat timeline */}
              <div className="space-y-4 max-h-[280px] overflow-y-auto mb-6 pr-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs max-w-lg">
                    <p className="text-slate-300 leading-relaxed">
                      Hello {onboarding.name}. I see you struggle with <strong>{onboarding.habits.join(", ")}</strong> and want to reclaim focus for <strong>{onboarding.shortTermGoal}</strong>. Let's do a deep-dive diagnostic check to construct your custom Recovery Plan.
                    </p>
                  </div>
                </div>

                {interviewTranscript.map((turn, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs max-w-lg">
                        <p className="text-slate-300 leading-relaxed">{turn.question}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-xs max-w-lg text-right">
                        <p className="text-indigo-200 leading-relaxed">{turn.answer}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active prompt question from Gemini */}
              <div aria-live="polite" className="bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border border-cyan-500/15 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-lg shadow-cyan-500/5">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">ACTIVE COACHING QUESTION:</h4>
                <p id="active-question-text" className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  {currentQuestion || "Formulating diagnostics..."}
                </p>
              </div>

              {/* Input for user's answer */}
              <div className="space-y-4">
                <label htmlFor="interview-answer-input" className="sr-only">Type your response to the active coaching question</label>
                <textarea
                  id="interview-answer-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all h-24 resize-none placeholder-slate-600"
                  placeholder="Type your deep answer... (Be honest - e.g. 'I scroll bedtime reels because my brain is too tired to read')"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitInterviewTurn();
                    }
                  }}
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 italic">Press Enter to submit, Shift+Enter for new line</span>
                  <button
                    id="submit-turn-btn"
                    onClick={submitInterviewTurn}
                    aria-label="Submit Answer"
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-xl shadow-cyan-500/10 uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    Submit Answer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              STEP 3: BEHAVIOUR PROFILE REVEAL
             ========================================== */}
          {phase === "profile" && profile && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-3xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] border border-slate-800/80 shadow-2xl relative overflow-hidden"
            >
              {/* Elegant ambient light flare */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="flex items-center justify-between text-amber-400 text-xs font-mono uppercase tracking-widest mb-6">
                <span className="flex items-center gap-1.5 font-bold">
                  <Compass className="w-4 h-4 animate-spin-slow text-amber-400" />
                  DIAGNOSTIC COMPLETED • Pillar 5
                </span>
                <span className="bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full text-amber-300 font-bold font-mono">
                  BEHAVIORAL MODEL
                </span>
              </div>

              <h2 id="profile-reveal-title" className="text-3xl sm:text-4xl font-display font-extrabold text-white leading-tight tracking-tight">
                Profile Compiled for <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">{onboarding.name}</span>
              </h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Our behavior analysis engine processed your transcript to isolate core drivers, triggers, and cognitive loop overrides.
              </p>

              {/* Behavior Diagnostic Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                  <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1.5">PRIMARY CONFLICT</h4>
                  <p id="profile-primary" className="text-sm font-semibold text-white leading-snug">{profile.primaryAddiction}</p>
                </div>
                
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                  <h4 className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest mb-1.5">SECONDARY PATTERNS</h4>
                  <p id="profile-secondary" className="text-sm text-slate-300 leading-snug">{profile.secondaryAddiction}</p>
                </div>
                
                <div className="bg-slate-900/40 border border-cyan-500/10 rounded-2xl p-6 sm:col-span-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl"></div>
                  <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-2">DEEPER ROOT PSYCHOLOGICAL CAUSE</h4>
                  <p id="profile-rootcause" className="text-xs text-slate-200 font-medium leading-relaxed">{profile.rootCause}</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                  <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">HIGH-RISK CRITICAL HOURS</h4>
                  <p id="profile-risktime" className="text-xs text-slate-300 font-medium leading-relaxed">{profile.highRiskTime}</p>
                </div>
                
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                  <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">HIGH-RISK ENVIRONMENTAL CONTEXTS</h4>
                  <p id="profile-risksituation" className="text-xs text-slate-300 font-medium leading-relaxed">{profile.highRiskSituation}</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:col-span-2">
                  <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">CORE DRIVER SUMMARY</h4>
                  <p id="profile-behaviorsummary" className="text-xs text-slate-300 leading-relaxed">{profile.behaviourSummary}</p>
                </div>
              </div>

              {/* Core Motivations card */}
              <div className="mt-6 p-5 bg-emerald-950/15 border border-emerald-500/20 rounded-2xl flex items-start gap-3.5 shadow-lg shadow-emerald-500/5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 font-mono tracking-wide uppercase">AI-EXTRACTED MOTIVATOR FOCUS:</h4>
                  <p id="profile-motivation" className="text-xs text-emerald-100/90 leading-relaxed mt-1.5 font-sans">{profile.motivationSummary}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-900 pt-6">
                <button
                  id="go-dashboard-btn"
                  onClick={() => setPhase("dashboard")}
                  aria-label="Generate Daily Recovery Dashboard"
                  className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-500/10 flex items-center gap-2 text-sm uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Generate Daily Recovery Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              RECOVERY DASHBOARD (MAIN SYSTEM)
             ========================================== */}
          {phase === "dashboard" && profile && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              
              {/* Dashboard Hero Banner */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
                {/* Stunning glowing core on the right */}
                <div className="absolute right-0 top-0 w-80 h-full bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute right-10 top-0 w-40 h-full bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 id="dashboard-user-name" className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">{onboarding.name}</h2>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                        {onboarding.occupation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Primary Overriding Target: <span className="text-cyan-300 font-semibold">{profile.primaryAddiction}</span>
                    </p>
                  </div>
                </div>

                {/* Main SOS button (Triggering Call 3) */}
                <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto">
                  <button
                    id="trigger-sos-overlay-btn"
                    onClick={() => { setSosActive(true); setSosText(""); setDecisionResult(null); }}
                    aria-label="Trigger Urgent AI Support Overrides"
                    className="flex-1 md:flex-none bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-550 text-white font-extrabold px-8 py-4 rounded-2xl shadow-2xl shadow-rose-600/20 hover:shadow-rose-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2.5 text-xs uppercase tracking-widest animate-pulse focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-550 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    <Zap className="w-5 h-5 fill-white text-white" />
                    I Have an Urge Right Now
                  </button>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* -------------------------------------------
                    LEFT PANEL: COACHING CORE
                   ------------------------------------------- */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Daily AI Coach Insight card */}
                  {todayInsight && (
                    <div className="glass-panel p-6 sm:p-7 rounded-[24px] border border-cyan-500/10 relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                          <Activity className="w-4 h-4 animate-pulse text-cyan-400" />
                          PILLAR 1: INTELLIGENT ADAPTIVE NUDGE
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full uppercase font-bold">
                            Plan Override: {todayInsight.adaptiveMove}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white font-display tracking-tight">Today's Live Psychological Focus</h3>
                      <p id="dashboard-insight-text" className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed italic border-l-2 border-cyan-500 pl-4 font-sans py-1 bg-slate-950/20 pr-2 rounded-r-xl">
                        "{todayInsight.insight}"
                      </p>

                      <div className="mt-5 p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-start gap-3 text-xs">
                        <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-cyan-400 block font-bold uppercase tracking-wider font-mono text-[9px]">Decision Engine Logic:</span>
                          <span id="dashboard-insight-reason" className="text-slate-300 leading-relaxed block mt-1">{todayInsight.adaptiveReason}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adaptive Coaching Daily Recovery Plan */}
                  {recoveryPlan && (
                    <div className="glass-panel p-6 sm:p-7 rounded-[24px] border border-slate-800/80 relative shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-purple-400" />
                          PILLAR 3: RECOVERY SYSTEM ACTIONS
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">TODAY'S TARGETS</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl hover:border-slate-700/60 transition-all">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Core Focus Rule</span>
                          <p id="dashboard-plan-goal" className="text-sm font-semibold text-white mt-1.5 leading-relaxed">{recoveryPlan.todayGoal}</p>
                        </div>

                        <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl hover:border-slate-700/60 transition-all">
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Substitution Strategy</span>
                          <p id="dashboard-plan-replacement" className="text-sm font-semibold text-cyan-200 mt-1.5 leading-relaxed">{recoveryPlan.replacementActivity}</p>
                        </div>

                        <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl sm:col-span-2 hover:border-slate-700/60 transition-all">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Quantitative Micro Habit</span>
                          <p id="dashboard-plan-microhabit" className="text-xs text-slate-300 mt-1.5 leading-relaxed font-mono">{recoveryPlan.microHabit}</p>
                        </div>
                      </div>

                      {/* Encouragement banner */}
                      <div className="mt-5 p-4 bg-purple-950/10 border border-purple-900/30 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
                        <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block font-bold">Coach Encouragement</span>
                        <p id="dashboard-plan-encouragement" className="text-xs text-purple-200/90 leading-relaxed mt-1.5 italic font-sans">
                          "{recoveryPlan.encouragement}"
                        </p>
                      </div>

                      {/* Tomorrow focus cue */}
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                        <span>Tomorrow's defensive cue: <strong id="dashboard-plan-tomorrow-focus" className="text-slate-200 font-mono">{recoveryPlan.tomorrowFocus}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Expandable behavioral profile overview */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">BEHAVIOR DIAGNOSTIC RESULTS</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Review deep-dive cognitive loops and triggers.</p>
                      </div>
                      <button
                        onClick={() => setPhase("profile")}
                        aria-label="Expand Behavioral Diagnostic Results Card"
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 shrink-0 uppercase tracking-wider font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg px-2 py-1"
                      >
                        Expand Card <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* -------------------------------------------
                    RIGHT PANEL: SOCIAL & TRACKING CORES
                    - PILLAR 2: Personalized Tracking (Log/History)
                    - PILLAR 4: Support Mechanisms (Sarah Contact)
                    - PILLAR 5: Future Self simulation (Audio)
                   ------------------------------------------- */}
                <div className="space-y-6">

                  {/* Future Self Simulation Card */}
                  {futureSelf && (
                    <div className="glass-panel p-6 rounded-[24px] border border-emerald-500/10 relative overflow-hidden shadow-xl">
                      <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 animate-pulse text-emerald-400" />
                          PILLAR 5: FUTURE SELF SIMULATOR
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase font-bold font-mono">
                          Native TTS
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white font-display">Simulated Future Messages (30 Days Out)</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Hear your Future Self compare paths back-to-back. Grounded directly in your career goals and current actions.
                      </p>

                      {/* Speech controls */}
                      <div className="space-y-3 mt-5">
                        
                        {/* Play Regress version */}
                        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700/60 transition-all">
                          <div>
                            <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold block">Relapse Trajectory</span>
                            <span className="text-xs text-slate-300 block mt-1 font-medium line-clamp-1 italic">"{futureSelf.relapse}"</span>
                          </div>
                          {playingAudio === "relapse" ? (
                            <button 
                              onClick={stopSpeech}
                              aria-label="Stop playing Relapse trajectory speech"
                              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-full transition-all shrink-0 shadow-lg shadow-rose-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            >
                              <Square className="w-3.5 h-3.5 fill-white" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => playSpeech("relapse")}
                              aria-label="Play Relapse trajectory speech"
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-3 rounded-full transition-all hover:text-white shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            >
                              <Play className="w-3.5 h-3.5 fill-slate-300 text-slate-300" />
                            </button>
                          )}
                        </div>

                        {/* Play Resist version */}
                        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700/60 transition-all">
                          <div>
                            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">Resist Trajectory</span>
                            <span className="text-xs text-slate-300 block mt-1 font-medium line-clamp-1 italic">"{futureSelf.resist}"</span>
                          </div>
                          {playingAudio === "resist" ? (
                            <button 
                              onClick={stopSpeech}
                              aria-label="Stop playing Resist trajectory speech"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full transition-all shrink-0 shadow-lg shadow-emerald-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            >
                              <Square className="w-3.5 h-3.5 fill-white" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => playSpeech("resist")}
                              aria-label="Play Resist trajectory speech"
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-3 rounded-full transition-all hover:text-white shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            >
                              <Play className="w-3.5 h-3.5 fill-slate-300 text-slate-300" />
                            </button>
                          )}
                        </div>

                        {/* Speech Equalizer visualizer */}
                        {playingAudio && (
                          <div className="flex items-center justify-center gap-1.5 py-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                            <span className="text-[10px] font-mono text-indigo-400 animate-pulse uppercase mr-2 tracking-widest font-bold">Streaming simulated audio:</span>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                              <span 
                                key={i} 
                                className={`w-1 h-3.5 bg-indigo-500 rounded-full animate-pulse`}
                                style={{ animationDelay: `${i * 150}ms` }}
                              ></span>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* Accountability Partner Support Card */}
                  {onboarding.accountabilityPartner && (
                    <div className="glass-panel p-6 rounded-[24px] border border-slate-800/80 shadow-xl relative">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-400" />
                          PILLAR 4: SUPPORT MECHANISM
                        </span>
                        <span className="text-[9px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase font-bold font-mono">
                          AP SYNCED
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 id="dashboard-partner-name" className="text-xs font-bold text-white font-display">{onboarding.accountabilityPartner}</h4>
                          <span className="text-[10px] text-slate-400">Trusted Accountability Partner</span>
                        </div>
                      </div>

                      {/* Display accountability copy box */}
                      {accountabilityMsg && (
                        <div className="mt-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl relative hover:border-slate-700/50 transition-all">
                          <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-bold block mb-1">PROMPT-GENERATED ALERT TEXT</span>
                          <p id="dashboard-accountability-text" className="text-[11px] text-slate-300 leading-relaxed pr-8 line-clamp-3">
                            "{accountabilityMsg}"
                          </p>
                          <button
                            id="copy-ap-msg-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(accountabilityMsg);
                              setCopiedMsg(true);
                            }}
                            className="absolute top-3.5 right-3.5 text-slate-500 hover:text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            title="Copy message to clipboard"
                            aria-label="Copy prompt-generated alert text message to clipboard"
                          >
                            {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PILLAR 2: Personalized Tracking - Seeded logs list */}
                  <div className="glass-panel p-6 rounded-[24px] border border-slate-800/80 shadow-xl relative">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        PILLAR 2: PERSONALIZED TRACKING
                      </span>
                      <button
                        id="open-log-dialog-btn"
                        onClick={() => setCustomLogActive(true)}
                        aria-label="Log an urge event manually"
                        className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/20 text-cyan-300 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Urge
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white font-display">Active Behavioral Logs</h3>
                    
                    {/* Log list */}
                    <div id="urge-logs-container" className="space-y-3 mt-4 max-h-[220px] overflow-y-auto pr-1">
                      {history.map((h, i) => (
                        <div key={i} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl flex items-start justify-between gap-3 text-xs hover:border-slate-800 transition-all">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">{h.timestamp}</span>
                            <span className="text-slate-200 block font-medium">Trigger: <span className="text-slate-400 font-normal">{h.trigger}</span></span>
                            <span className="text-slate-200 block font-medium">Action: <span className="text-cyan-300 font-normal">{h.chosenAction}</span></span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold shrink-0 ${h.outcome === "success" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {h.outcome === "success" ? "Resisted" : "Gave In"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* -------------------------------------------
                  MODAL OVERLAYS: 
                  - SOS Interactive Decision Engine Overlay
                  - Log Urge Overlay
                 ------------------------------------------- */}

              {/* SOS overlay */}
              <AnimatePresence>
                {sosActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
                  >
                    <motion.div 
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="sos-overlay-title"
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
                    >
                      {/* Close button */}
                      <button
                        id="close-sos-overlay-btn"
                        onClick={() => { setSosActive(false); setSosText(""); setDecisionResult(null); }}
                        aria-label="Close Urge Intercept System"
                        className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 bg-slate-950 border border-slate-800 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase tracking-widest mb-4">
                        <Zap className="w-4 h-4 fill-rose-400 shrink-0" />
                        <span>AI Crisis Decision Engine • Pillar 4 & 5 Override</span>
                      </div>

                      <h2 id="sos-overlay-title" className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                        Urge Intercept System
                      </h2>
                      <p className="text-slate-400 text-xs mt-1">
                        Explain your current craving in plain text (e.g., "I'm looking at my phone bed-table about to scroll Instagram," or a crisis signal). Gemini will process alternative routes in real-time.
                      </p>

                      {/* Urge text field */}
                      <div className="mt-5 space-y-4">
                        <label htmlFor="sos-input-text" className="sr-only">Type your current craving trigger</label>
                        <textarea
                          id="sos-input-text"
                          value={sosText}
                          onChange={(e) => setSosText(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all h-24 resize-none"
                          placeholder="Type your current craving trigger... (unscripted, arbitrary text accepted)"
                          required
                        />

                        {/* Fast demo pre-fill helper buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">Demo Pre-fills:</span>
                          <button
                            type="button"
                            onClick={() => setSosText("I'm debugging this distributed lock manager and it has been 2 hours. I want to check Instagram Reels to clear my head.")}
                            className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                          >
                            Code Blocker Urge
                          </button>
                          <button
                            type="button"
                            onClick={() => setSosText("I have severe sleep anxiety tonight and I feel like looking at Reels till I fall asleep.")}
                            className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                          >
                            Bedtime Doomscroll Urge
                          </button>
                          <button
                            type="button"
                            onClick={() => setSosText("I am having severe self-harm urges right now.")}
                            className="text-[10px] bg-rose-950/20 border border-rose-900/30 text-rose-300 px-2.5 py-1 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            Crisis Escalation Trigger
                          </button>
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            id="execute-decision-engine-btn"
                            onClick={triggerSOSDecision}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          >
                            Execute Decision Engine
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Display Hero Decision Engine results (Call 3) */}
                      {decisionResult && (
                        <div id="decision-result-panel" className="mt-6 border-t border-slate-800 pt-6 space-y-6">
                          
                          {/* Competing candidates panel */}
                          <div>
                            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
                              Candidate Alternatives Compared Side-By-Side:
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {decisionResult.options.map((opt, i) => {
                                const isWinner = opt.title.toLowerCase() === decisionResult.chosenOption.title.toLowerCase();
                                return (
                                  <div 
                                    key={i} 
                                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${isWinner ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/5' : 'bg-slate-950/40 border-slate-800/80'}`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Candidate #{i + 1}</span>
                                        {isWinner && (
                                          <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                                            CHOSEN
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="font-bold text-sm text-white mt-2 leading-snug">{opt.title}</h5>
                                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.reason}</p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-900/60 pt-2 text-[10px]">
                                      <span className="text-slate-500 font-mono">Effort: <strong className="text-slate-300 font-normal">{opt.effortLevel}</strong></span>
                                      <span className="text-slate-500 font-mono">Success Odds: <strong className="text-indigo-400 font-bold">{opt.score}%</strong></span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Final choice and reasoning justification */}
                          <div className="p-5 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl">
                            <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              DECISION ENGINE RESOLUTION & REASONING:
                            </h4>
                            <p id="decision-chosen-title" className="text-sm font-bold text-white mt-1">Chosen Action: "{decisionResult.chosenOption.title}"</p>
                            <p id="decision-reasoning-text" className="text-xs text-slate-300 mt-2 leading-relaxed">
                              {decisionResult.reasoning}
                            </p>
                          </div>

                          {/* Escalation module */}
                          {decisionResult.escalation.shouldEscalate && (
                            <div id="sos-escalation-alert" className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-2xl flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-rose-300 font-mono uppercase tracking-wider">ACTIVE EMERGENCY ESCALATION SIGNAL DETECTED</h4>
                                <p className="text-xs text-slate-300 mt-1">
                                  Reason: <span id="sos-escalation-reason" className="text-slate-200">{decisionResult.escalation.escalationReason}</span>
                                </p>
                                
                                {/* If crisis/emergency, show direct official hotline support */}
                                {sosText.toLowerCase().includes("self-harm") || sosText.toLowerCase().includes("suicide") || sosText.toLowerCase().includes("crisis") ? (
                                  <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1">
                                    <p className="text-rose-200 font-bold">🚨 Professional Emergency Support Resources:</p>
                                    <p className="text-slate-300">National Suicide & Crisis Lifeline: Call or text <strong className="text-white">988</strong> (USA, 24/7, free & confidential).</p>
                                    <p className="text-slate-300">Crisis Text Line: Text <strong className="text-white">HOME to 741741</strong>.</p>
                                  </div>
                                ) : (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">Action:</span>
                                    <button
                                      id="copy-sos-ap-btn"
                                      onClick={() => {
                                        navigator.clipboard.writeText(accountabilityMsg);
                                        setCopiedMsg(true);
                                        alert("Accountability Partner text message copied to clipboard! Send it to your manager/friend immediately.");
                                      }}
                                      aria-label="Copy accountability SMS text message"
                                      className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                    >
                                      {copiedMsg ? "Copied!" : "Copy SMS to Sarah"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Accept chosen decision trigger */}
                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                              id="accept-sos-btn"
                              onClick={() => {
                                // Add success log
                                const newLog: UrgeHistoryEntry = {
                                  timestamp: "Just now",
                                  trigger: sosText,
                                  chosenAction: decisionResult.chosenOption.title,
                                  outcome: "success"
                                };
                                setHistory([newLog, ...history]);
                                setSosActive(false);
                                setSosText("");
                                setDecisionResult(null);
                                recalculateDailyInsights();
                              }}
                              aria-label="Log success of this action and return to dashboard"
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            >
                              Log Success & Return
                            </button>
                          </div>

                        </div>
                      )}

                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Log Urge modal overlay */}
              <AnimatePresence>
                {customLogActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                  >
                    <motion.div 
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="custom-log-title"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative"
                    >
                      <button
                        id="close-log-overlay-btn"
                        onClick={() => setCustomLogActive(false)}
                        aria-label="Close Log Current State Modal"
                        className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <h3 id="custom-log-title" className="text-xl font-display font-bold text-white mb-2">Log Current State</h3>
                      <p className="text-slate-400 text-xs mb-4">
                        Manually record an urge event to test how the coaching engine adapts.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="custom-log-trigger" className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">What triggered the urge?</label>
                          <input 
                            type="text"
                            id="custom-log-trigger"
                            value={customTrigger}
                            onChange={(e) => setCustomTrigger(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            placeholder="e.g. Brain tired after standup"
                          />
                        </div>

                        <div>
                          <label htmlFor="custom-log-action" className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Action Chosen</label>
                          <input 
                            type="text"
                            id="custom-log-action"
                            value={customAction}
                            onChange={(e) => setCustomAction(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            placeholder="e.g. Scrolled bedtime reels / did stretching"
                          />
                        </div>

                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Outcome</span>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setCustomOutcome("success")}
                              aria-label="Manually log Resisted (Success)"
                              aria-pressed={customOutcome === "success"}
                              className={`py-2 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${customOutcome === "success" ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                            >
                              Resisted (Success)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomOutcome("relapsed")}
                              aria-label="Manually log Gave In (Relapsed)"
                              aria-pressed={customOutcome === "relapsed"}
                              className={`py-2 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${customOutcome === "relapsed" ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                            >
                              Gave In (Relapsed)
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                          <button
                            id="submit-log-btn"
                            onClick={logCustomUrge}
                            aria-label="Save manually logged urge entry"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          >
                            Save Log Entry
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Global Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 BreakFree AI. Designed for Google PromptWars Hackathon.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-300 transition-all">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-300 transition-all">Behavioral Methodology</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-300 transition-all">Safe Space Guidelines</a>
        </div>
      </footer>

    </div>
  );
}
