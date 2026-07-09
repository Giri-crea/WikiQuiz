import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Clock, Award, RotateCcw, ArrowRight, Share2, HelpCircle, AlertCircle, Quote, ChevronRight, BookOpen, Sparkles, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Question, Article } from "../types";
import { updateTopicQuizResult } from "../lib/progress";

interface QuizEngineProps {
  questions: Question[];
  article: Article;
  onReset: () => void;
  onSelectNew: () => void;
  onStateChange?: (state: "playing" | "completed") => void;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export default function QuizEngine({
  questions,
  article,
  onReset,
  onSelectNew,
  onStateChange,
  difficulty
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  // Modal visibility and share copy state
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current question
  const currentQuestion = questions[currentIndex];

  // Set modal open and save progress when completed
  useEffect(() => {
    if (isCompleted && article?.title) {
      setIsModalOpen(true);
      updateTopicQuizResult(article.title, score, questions.length, difficulty);
    }
  }, [isCompleted, article, score, questions.length, difficulty]);

  // Trigger high score celebration confetti
  useEffect(() => {
    if (isCompleted && isModalOpen) {
      const pct = getPercentage();
      if (pct >= 80) {
        // Initial grand burst
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Continuous celebration sprinkles from sides
        const end = Date.now() + 2 * 1000;
        const colors = ["#818cf8", "#34d399", "#60a5fa", "#fbbf24", "#f43f5e"];

        const frame = () => {
          if (Date.now() > end) return;

          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.85 },
            colors: colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.85 },
            colors: colors
          });

          requestAnimationFrame(frame);
        };

        const timer = setTimeout(() => {
          frame();
        }, 150);

        return () => clearTimeout(timer);
      }
    }
  }, [isCompleted, isModalOpen]);

  // Notify parent of state change
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isCompleted ? "completed" : "playing");
    }
  }, [isCompleted, onStateChange]);

  // Start question countdown
  useEffect(() => {
    if (isCompleted || showExplanation) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(30);
    setIsTimeUp(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimeUp(true);
          setShowExplanation(true);
          // Auto fill with empty/incorrect answer
          const updatedAnswers = [...answers];
          updatedAnswers[currentIndex] = "";
          setAnswers(updatedAnswers);
          setStreak(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isCompleted, showExplanation]);

  const handleSelectAnswer = (option: string) => {
    if (selectedAnswer !== null || isTimeUp) return; // Answer already lock-in or time's up

    setSelectedAnswer(option);
    setShowExplanation(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = option === currentQuestion.correctAnswer;
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = option;
    setAnswers(updatedAnswers);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const getPercentage = () => {
    return Math.round((score / questions.length) * 100);
  };

  const getRankDescriptor = () => {
    const pct = getPercentage();
    if (pct === 100) return { title: "Wikipedia Archivist Supreme", desc: "Absolute master of trivia! Your knowledge of Wikipedia records is unrivaled." };
    if (pct >= 80) return { title: "Lead Researcher", desc: "Phenomenal score! You absorbed the article facts like a seasoned scholar." };
    if (pct >= 60) return { title: "Trivia Curator", desc: "Well done! You gathered the essential facts and navigated the challenge well." };
    if (pct >= 40) return { title: "Curious Explorer", desc: "Good effort! A bit more exploration in the wiki pages and you will master it." };
    return { title: "Casual Wiki Reader", desc: "A great starting point! Use our Trivia Master Assistant to study and try again." };
  };

  const getLetterGrade = () => {
    const pct = getPercentage();
    if (pct >= 90) return { grade: "A", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/10", label: "Excellent" };
    if (pct >= 80) return { grade: "B", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10 shadow-indigo-500/10", label: "Very Good" };
    if (pct >= 70) return { grade: "C", color: "text-blue-400 border-blue-500/30 bg-blue-500/10 shadow-blue-500/10", label: "Good" };
    if (pct >= 50) return { grade: "D", color: "text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-amber-500/10", label: "Passing" };
    return { grade: "F", color: "text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-rose-500/10", label: "Needs Study" };
  };

  const getShareSnippet = () => {
    const { grade, label } = getLetterGrade();
    return `🏆 WikiQuiz Master Challenge!
📚 Article: ${article.title}
📝 Score: ${score}/${questions.length} (${getPercentage()}%)
🎓 Grade: ${grade} (${label})
🔥 Max Streak: ${maxStreak} Correct

Test your Wikipedia trivia knowledge with AI: ${window.location.origin}`;
  };

  const handleCopy = () => {
    const text = getShareSnippet();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopyText(text);
        });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key="game-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-xs overflow-hidden"
          >
            {/* Top Indicator / Progress bar */}
            <div className="w-full bg-zinc-800 h-1.5 relative">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              />
            </div>

            {/* Header Status bar */}
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">
                  Q {currentIndex + 1} of {questions.length}
                </span>
                {streak >= 2 && (
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    🔥 {streak} Streak
                  </span>
                )}
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-sm">
                <Clock className={`h-4 w-4 ${timeLeft <= 5 ? "text-red-400 animate-pulse" : ""}`} />
                <span className={timeLeft <= 5 ? "text-red-400 font-bold" : ""}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Question Body */}
            <div className="p-6">
              <div className="flex items-center space-x-2 text-zinc-500 text-xs mb-2.5">
                <span>Category:</span>
                <span className="text-indigo-400 font-medium">Fact Verification</span>
                <span>&bull;</span>
                <span>Source: Wikipedia</span>
              </div>
              <h2 className="text-2xl font-light leading-snug text-white mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.options.map((option, idx) => {
                  const isAnswered = selectedAnswer !== null || isTimeUp;
                  const isCorrectAnswer = option === currentQuestion.correctAnswer;
                  const isUserSelection = option === selectedAnswer;

                  let optionStyle = "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850/60";
                  let prefixStyle = "bg-zinc-950 text-zinc-400 border-zinc-850";

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      // Correct option is highlighted green
                      optionStyle = "border-green-500/50 bg-green-500/10 text-green-200 font-medium";
                      prefixStyle = "bg-green-600 text-white border-green-500";
                    } else if (isUserSelection) {
                      // Incorrect option selected by user is red
                      optionStyle = "border-red-500/50 bg-red-500/10 text-red-200";
                      prefixStyle = "bg-red-600 text-white border-red-500";
                    } else {
                      // Others are grayed out
                      optionStyle = "border-zinc-850 bg-zinc-900/10 text-zinc-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      id={`quiz-option-${idx}`}
                      disabled={isAnswered}
                      onClick={() => handleSelectAnswer(option)}
                      className={`w-full text-left p-5 rounded-xl border flex items-center gap-4 transition-all group cursor-pointer ${optionStyle}`}
                    >
                      <span className={`h-7 w-7 rounded-lg border flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-colors ${prefixStyle}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm">{option}</span>
                      
                      {isAnswered && isCorrectAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-400 ml-auto shrink-0" />
                      )}
                      {isAnswered && isUserSelection && !isCorrectAnswer && (
                        <XCircle className="h-5 w-5 text-red-400 ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation panel */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-zinc-950/80 rounded-xl border border-zinc-850 text-sm mt-2">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-2">
                        <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                        <span>Factual Explanation</span>
                      </div>
                      <p className="text-zinc-300 text-xs leading-relaxed mb-4">
                        {currentQuestion.explanation}
                      </p>

                      {/* Wikipedia Quote Reference */}
                      {currentQuestion.factSource && (
                        <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-850 flex gap-2.5 items-start">
                          <Quote className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px] block mb-1">Wikipedia Source Fact</span>
                            <span className="text-zinc-400 italic">"{currentQuestion.factSource}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            {showExplanation && (
              <div className="p-6 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
                <button
                  onClick={handleNext}
                  id="quiz-next-button"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <span>
                    {currentIndex < questions.length - 1 ? "Next Question" : "View Results"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-xs p-8 text-center"
          >
            {/* Performance Medal */}
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-zinc-950 border border-zinc-800 text-white mb-6">
              <Award className="h-10 w-10 text-indigo-400 animate-pulse" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              Quiz Completed!
            </h1>
            <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase mb-6">
              Based on "{article.title}" Wikipedia Facts
            </p>

            {/* Score and Grade block */}
            <div className="max-w-md mx-auto mb-8 p-6 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row justify-around items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-mono font-black text-white">
                  {score} / {questions.length}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono tracking-wide uppercase mt-1">
                  Correct Facts
                </div>
              </div>
              
              <div className="hidden sm:block h-12 w-[1px] bg-zinc-800" />
              
              <div className="flex flex-col items-center">
                <div className="text-4xl font-mono font-black text-white">
                  {getPercentage()}%
                </div>
                <div className="text-[11px] text-zinc-500 font-mono tracking-wide uppercase mt-1">
                  Accuracy Score
                </div>
              </div>

              <div className="hidden sm:block h-12 w-[1px] bg-zinc-800" />

              <div className="flex flex-col items-center">
                <div className={`text-4xl font-mono font-black px-4 py-0.5 rounded-lg border ${getLetterGrade().color.split(" ").slice(0, 3).join(" ")}`}>
                  {getLetterGrade().grade}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono tracking-wide uppercase mt-1">
                  Letter Grade
                </div>
              </div>
            </div>

            {/* Rank descriptor */}
            <div className="p-5 bg-zinc-950/60 rounded-xl border border-zinc-800 text-left mb-8 max-w-xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-semibold font-mono uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md mb-2 inline-block">
                  Trivia Rank
                </span>
                <h3 className="text-base font-bold text-indigo-300 mb-1">
                  {getRankDescriptor().title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {getRankDescriptor().desc}
                </p>
                {maxStreak > 1 && (
                  <div className="mt-3 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20 inline-flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    Max Consecutive Streak: {maxStreak} Correct
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="shrink-0 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                View Full Scorecard
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={onReset}
                id="results-retry-button"
                className="flex-1 py-3 bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Regenerate Quiz
              </button>
              <button
                onClick={onSelectNew}
                id="results-search-new"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
              >
                <BookOpen className="h-4 w-4" />
                Select New Article
              </button>
            </div>

            {/* Interactive 'Quiz Results' Modal Overlay */}
            <AnimatePresence>
              {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", duration: 0.4 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative text-left"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-400" />
                        Quiz Scorecard
                      </h3>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-zinc-400 hover:text-white transition-colors p-1 bg-zinc-850 hover:bg-zinc-800 rounded-lg cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Body content */}
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                      {/* Large grade letter display with score */}
                      <div className="flex items-center gap-6 p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
                        {/* Circular badge */}
                        <div className={`h-20 w-20 rounded-full border-2 flex flex-col items-center justify-center font-bold shadow-lg shrink-0 ${getLetterGrade().color}`}>
                          <span className="text-3xl tracking-tight leading-none">{getLetterGrade().grade}</span>
                          <span className="text-[10px] uppercase font-mono tracking-wider mt-1 opacity-80">Grade</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold font-mono uppercase bg-zinc-800 text-indigo-400 px-2.5 py-0.5 rounded-md">
                            {getLetterGrade().label}
                          </span>
                          <h4 className="text-xl font-bold text-white leading-tight">
                            You scored {score} / {questions.length}
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Accuracy: <span className="text-white font-mono font-bold">{getPercentage()}%</span> &bull; Max Streak: <span className="text-white font-mono font-bold">{maxStreak}</span>
                          </p>
                        </div>
                      </div>

                      {/* Share snippet panel */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                            Share result
                          </h4>
                          {copied && (
                            <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" /> Copied!
                            </span>
                          )}
                        </div>
                        
                        <div className="relative group bg-zinc-950/85 border border-zinc-850 rounded-xl p-4 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                          {getShareSnippet()}
                        </div>

                        <button
                          onClick={handleCopy}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 animate-scale" />
                              <span>Copied to Clipboard</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy Share Snippet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Footer / actions */}
                    <div className="p-5 border-t border-zinc-800 bg-zinc-950/80 flex gap-3">
                      <button
                        onClick={() => {
                          onReset();
                          setIsModalOpen(false);
                        }}
                        className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-medium rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry Quiz
                      </button>
                      <button
                        onClick={() => {
                          onSelectNew();
                          setIsModalOpen(false);
                        }}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        New Topic
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
