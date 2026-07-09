import React, { useState, useEffect } from "react";
import { 
  BookOpen, Sparkles, Loader2, HelpCircle, Bot, Sliders, ChevronRight, 
  ArrowLeft, Info, HelpCircle as HelpIcon, RotateCcw, Award, GraduationCap, Github, Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import WikipediaSearch from "./components/WikipediaSearch";
import DidYouKnow from "./components/DidYouKnow";
import QuizEngine from "./components/QuizEngine";
import QuizAssistant from "./components/QuizAssistant";
import HomePage from "./components/HomePage";
import SignInPage from "./components/SignInPage";
import EventCreator from "./components/EventCreator";
import DifficultyStats from "./components/DifficultyStats";
import { Article, Question, QuizConfig } from "./types";
import { getTopicProgress } from "./lib/progress";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "signin" | "dashboard" | "event_creator">("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<QuizConfig>({
    count: 5,
    difficulty: "Medium",
    quizType: "Multiple Choice"
  });
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);
  const [quizStatus, setQuizStatus] = useState<"idle" | "playing" | "completed">("idle");
  const [error, setError] = useState<string | null>(null);

  const [topicProgress, setTopicProgress] = useState<any>(null);

  // Synchronize topic progress on article change, quiz status change, or custom events
  useEffect(() => {
    const updateProgress = () => {
      if (selectedArticle) {
        setTopicProgress(getTopicProgress(selectedArticle.title));
      } else {
        setTopicProgress(null);
      }
    };

    updateProgress();

    window.addEventListener("wiki-quiz-progress-update", updateProgress);
    return () => {
      window.removeEventListener("wiki-quiz-progress-update", updateProgress);
    };
  }, [selectedArticle, quizStatus]);

  const handleSelectFeaturedTopic = async (title: string) => {
    setIsLoadingQuiz(true);
    setCurrentView("dashboard");
    setError(null);
    try {
      const res = await fetch(`/api/article?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (res.ok && data.article) {
        setSelectedArticle(data.article);
        setQuizQuestions([]);
        setQuizStatus("idle");
      } else {
        setError("Unable to pre-load featured article.");
      }
    } catch (e) {
      setError("Failed to fetch featured article.");
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setQuizQuestions([]);
    setQuizStatus("idle");
    setError(null);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedArticle) return;

    setIsLoadingQuiz(true);
    setError(null);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedArticle.title,
          extract: selectedArticle.extract,
          count: config.count,
          difficulty: config.difficulty,
          quizType: config.quizType
        })
      });

      const data = await res.ok ? await res.json() : null;
      if (res.ok && data && data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setQuizStatus("playing");
      } else {
        setError(data?.error || "AI was unable to generate a trivia quiz for this article. Please try another topic.");
      }
    } catch (err) {
      setError("Factual quiz compilation failed. Check your network or try again.");
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleResetQuiz = () => {
    handleGenerateQuiz();
  };

  const handleSelectNewArticle = () => {
    setSelectedArticle(null);
    setQuizQuestions([]);
    setQuizStatus("idle");
    setError(null);
  };

  if (currentView === "home") {
    return (
      <HomePage
        onGetStarted={() => setCurrentView(isAuthenticated ? "dashboard" : "signin")}
        onSignInClick={() => setCurrentView("signin")}
        onSelectTopic={handleSelectFeaturedTopic}
        onHostEventClick={() => setCurrentView("event_creator")}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        onSignOut={() => {
          setIsAuthenticated(false);
          setUserEmail(null);
        }}
      />
    );
  }

  if (currentView === "signin") {
    return (
      <SignInPage
        onSignInSuccess={(email) => {
          setIsAuthenticated(true);
          setUserEmail(email);
          setCurrentView("dashboard");
        }}
        onBackToHome={() => setCurrentView("home")}
      />
    );
  }

  if (currentView === "event_creator") {
    return (
      <EventCreator
        onBackToDashboard={() => setCurrentView("dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Top Main Navigation / Brand Bar */}
      <header className="sticky top-0 z-30 bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => {
              handleSelectNewArticle();
              setCurrentView("home");
            }}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left cursor-pointer"
            title="Go to Home Page"
          >
            <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-sans text-lg font-bold">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                Wiki Quiz
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">
                Wikipedia Trivia Powered by Gemini
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              disabled={quizStatus === "playing"}
              onClick={() => setCurrentView("event_creator")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                quizStatus === "playing"
                  ? "bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-900 border-zinc-800 text-emerald-400 hover:text-white cursor-pointer hover:bg-zinc-850 hover:border-emerald-500/30"
              }`}
              title={quizStatus === "playing" ? "Cannot switch during an active quiz" : "Create & Host Live Quiz Events"}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Host Live Event</span>
            </button>

            <button
              disabled={quizStatus === "playing"}
              onClick={() => setShowAssistant(!showAssistant)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                quizStatus === "playing"
                  ? "bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed"
                  : showAssistant 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs cursor-pointer hover:bg-indigo-500 hover:border-indigo-500" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-850"
              }`}
              title={quizStatus === "playing" ? "AI Assistant is disabled during active quiz" : "Toggle AI Assistant"}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{quizStatus === "playing" ? "Assistant (Locked)" : "AI Assistant"}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${quizStatus === "playing" ? "bg-zinc-600" : showAssistant ? "bg-green-400 animate-pulse" : "bg-zinc-500"}`} />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-semibold text-zinc-300 block leading-tight">
                    {userEmail?.split("@")[0] || "Wiki Scholar"}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 block leading-tight">
                    User
                  </span>
                </div>
                <div 
                  className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold uppercase cursor-help"
                  title={userEmail || "Signed In User"}
                >
                  {userEmail?.[0] || "U"}
                </div>
                <button
                  disabled={quizStatus === "playing"}
                  onClick={() => {
                    setIsAuthenticated(false);
                    setUserEmail(null);
                    setCurrentView("home");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    quizStatus === "playing"
                      ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 cursor-pointer"
                  }`}
                  title={quizStatus === "playing" ? "Cannot sign out during active quiz" : "Sign Out"}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                disabled={quizStatus === "playing"}
                onClick={() => setCurrentView("signin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  quizStatus === "playing"
                    ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-indigo-600 border-indigo-600 text-white cursor-pointer hover:bg-indigo-500 shadow-xs"
                }`}
                title={quizStatus === "playing" ? "Cannot sign in during active quiz" : "Sign In"}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Wikipedia Selection and Gameboard */}
          <div className={showAssistant ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
            <AnimatePresence mode="wait">
              {isLoadingQuiz ? (
                // Beautiful animated loading page with custom messages
                <motion.div
                  key="loading-quiz"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-zinc-900/40 border border-zinc-800 p-12 text-center min-h-[400px] flex flex-col justify-center items-center shadow-xs rounded-xl"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Compiling Fact Quiz
                  </h3>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <p className="text-sm text-zinc-400">
                      Gemini is currently analyzing the content of <strong>"{selectedArticle?.title}"</strong> on Wikipedia...
                    </p>
                    <p className="text-xs text-zinc-500 italic mt-3">
                      "Synthesizing accurate quiz questions, formatting options, and retrieving verification quotes directly from historical logs."
                    </p>
                  </div>
                </motion.div>
              ) : quizQuestions.length > 0 && selectedArticle ? (
                // Gameplay screen
                <motion.div
                  key="quiz-engine-active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Currently playing</span>
                        <h2 className="text-sm font-bold text-zinc-100 leading-tight">{selectedArticle.title} Quiz</h2>
                      </div>
                    </div>
                    <button
                      onClick={handleSelectNewArticle}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Search
                    </button>
                  </div>

                  <QuizEngine
                    questions={quizQuestions}
                    article={selectedArticle}
                    onReset={handleResetQuiz}
                    onSelectNew={handleSelectNewArticle}
                    difficulty={config.difficulty}
                    onStateChange={(status) => {
                      setQuizStatus(status);
                      if (status === "completed") {
                        setShowAssistant(true);
                      }
                    }}
                  />
                </motion.div>
              ) : (
                // Landing, Search, Parameters Selection Screen
                <motion.div
                  key="landing-setup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Article select component */}
                  <WikipediaSearch
                    onSelectArticle={handleSelectArticle}
                    selectedArticle={selectedArticle}
                    onStartQuizDirectly={async (title) => {
                      // Fetch first
                      setIsLoadingQuiz(true);
                      try {
                        const res = await fetch(`/api/article?title=${encodeURIComponent(title)}`);
                        const data = await res.json();
                        if (res.ok && data.article) {
                          setSelectedArticle(data.article);
                          // Auto generate
                          const quizRes = await fetch("/api/quiz/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: data.article.title,
                              extract: data.article.extract,
                              count: config.count,
                              difficulty: config.difficulty,
                              quizType: config.quizType
                            })
                          });
                          const quizData = await quizRes.json();
                          if (quizRes.ok && quizData.questions) {
                            setQuizQuestions(quizData.questions);
                            setQuizStatus("playing");
                          } else {
                            setError("Unable to compile custom quiz.");
                          }
                        }
                      } catch (e) {
                        setError("Failed to generate direct quiz.");
                      } finally {
                        setIsLoadingQuiz(false);
                      }
                    }}
                  />

                  {!selectedArticle && <DifficultyStats />}

                  {/* Settings Parameters Panel */}
                  {selectedArticle && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/50 border border-zinc-800 p-6 shadow-xs rounded-xl"
                    >
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-indigo-400" />
                        Configure Fact Quiz
                      </h3>

                      {/* Visual progress bar or step indicator showing how much learned in the topic */}
                      {topicProgress && (
                        <div className="mb-6 p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                <GraduationCap className="h-4 w-4 text-indigo-400" />
                                Topic Learning Progress
                              </h4>
                              <p className="text-[10px] text-zinc-500">
                                Your synthesized knowledge profile on "{selectedArticle.title}"
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                                {topicProgress.progressPercent}% Learned
                              </span>
                            </div>
                          </div>

                          {/* Elegant Progress bar container */}
                          <div className="w-full bg-zinc-950 border border-zinc-850 h-2 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${topicProgress.progressPercent}%` }}
                            />
                          </div>

                          {/* Step Milestones Indicator */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            {/* Step 1: Discover */}
                            <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Step 1: Discover</span>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-medium text-zinc-300">Article summary</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">Loaded</span>
                              </div>
                            </div>

                            {/* Step 2: Study */}
                            <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Step 2: Study</span>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-medium text-zinc-300">Facts & AI Chat</span>
                                <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded-md">
                                  {topicProgress.factsViewedCount > 0 ? `${topicProgress.factsViewedCount} Facts` : "0 Facts"} &bull; {topicProgress.aiQuestionsAsked} Q
                                </span>
                              </div>
                            </div>

                            {/* Step 3: Certify */}
                            <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Step 3: Certify</span>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-medium text-zinc-300">Highest Score</span>
                                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/5 border border-purple-500/10 px-1.5 py-0.5 rounded-md">
                                  {topicProgress.quizzesPlayed > 0 ? `${topicProgress.highestScore}/${topicProgress.totalQuestions} (${topicProgress.highestAccuracy}%)` : "No Attempt"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Config parameters form */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Questions count */}
                        <div>
                          <label htmlFor="questions-count-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Number of Questions
                          </label>
                          <select
                            id="questions-count-select"
                            value={config.count}
                            onChange={(e) => setConfig({ ...config, count: Number(e.target.value) })}
                            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value={5}>5 Questions (Express)</option>
                            <option value={10}>10 Questions (Standard)</option>
                            <option value={15}>15 Questions (Masterclass)</option>
                          </select>
                        </div>

                        {/* Difficulty */}
                        <div>
                          <label htmlFor="difficulty-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Difficulty Level
                          </label>
                          <div className="flex gap-2">
                            {(["Easy", "Medium", "Hard"] as const).map((level) => (
                              <button
                                key={level}
                                type="button"
                                id={`difficulty-btn-${level.toLowerCase()}`}
                                onClick={() => setConfig({ ...config, difficulty: level })}
                                className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                  config.difficulty === level
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quiz type */}
                        <div>
                          <label htmlFor="quiz-type-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Question Styles
                          </label>
                          <select
                            id="quiz-type-select"
                            value={config.quizType}
                            onChange={(e) => setConfig({ ...config, quizType: e.target.value as any })}
                            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Multiple Choice">Multiple Choice (4 Options)</option>
                            <option value="True or False">True / False Trivia</option>
                          </select>
                        </div>
                      </div>

                      {error && (
                        <div className="mb-4 p-3 bg-red-950/40 text-red-400 border border-red-900/50 rounded-lg text-xs font-medium">
                          {error}
                        </div>
                      )}

                      {/* Main Generate Button */}
                      <button
                        onClick={handleGenerateQuiz}
                        id="generate-quiz-submit"
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer group"
                      >
                        <Sparkles className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>Generate Trivia Quiz on "{selectedArticle.title}"</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* Did you know panel */}
                  <DidYouKnow article={selectedArticle} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: AI Trivia Companion Chat Drawer */}
          {showAssistant && (
            <div className="lg:col-span-4 sticky top-24">
              <QuizAssistant
                article={selectedArticle}
                onClose={() => setShowAssistant(false)}
                currentQuestionText={
                  quizQuestions.length > 0 ? quizQuestions[0]?.question : undefined
                }
                disabled={quizStatus === "playing"}
              />
              {selectedArticle && (
                <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-2xs">
                  <h4 className="text-xs font-bold text-zinc-200 mb-1.5 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-indigo-400" />
                    Study Helper Mode
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    You can ask the Trivia Master on the chat to give you hints or summarize paragraphs of the <strong>"{selectedArticle.title}"</strong> article.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 mt-20 py-8 text-center text-zinc-600 text-xs uppercase tracking-[0.2em]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500">
            Wiki Quiz — Connected to Gemini 3.5 Flash API
          </p>
          <div className="flex gap-4">
            <span className="text-zinc-800">|</span>
            <span className="text-zinc-400 font-mono">Build 0.8.2-stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
