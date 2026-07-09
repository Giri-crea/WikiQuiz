import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, BookOpen, Bot, Share2, ArrowRight, LogIn, Globe, Shield, HelpCircle, Users
} from "lucide-react";

interface HomePageProps {
  onGetStarted: () => void;
  onSignInClick: () => void;
  onSelectTopic: (topicTitle: string) => void;
  onHostEventClick: () => void;
  isAuthenticated: boolean;
  userEmail: string | null;
  onSignOut: () => void;
}

const TRENDING_TOPICS = [
  { title: "Ancient Rome", category: "History", icon: "🏛️" },
  { title: "Artificial Intelligence", category: "Technology", icon: "🤖" },
  { title: "Deep Sea", category: "Nature", icon: "🐋" },
  { title: "Apollo Program", category: "Space", icon: "🚀" }
];

export default function HomePage({
  onGetStarted,
  onSignInClick,
  onSelectTopic,
  onHostEventClick,
  isAuthenticated,
  userEmail,
  onSignOut
}: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      {/* Navbar inside Home Page for independent navigation */}
      <header className="sticky top-0 z-30 bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-sans text-lg font-bold shadow-lg shadow-indigo-600/20">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                Wiki Quiz
              </h1>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mt-0.5">
                Wikipedia Trivia Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onHostEventClick}
              className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Host Live Event</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-zinc-300">
                    {userEmail?.split("@")[0] || "Wiki Scholar"}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">
                    Authenticated
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold uppercase">
                  {userEmail?.[0] || "U"}
                </div>
                <button
                  onClick={onSignOut}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/15 flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        <div className="text-center max-w-3xl space-y-6">
          {/* Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full"
          >
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
            <span>AI-Driven Trivia Synthesis</span>
          </motion.div>

          {/* Majestic Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-sans"
          >
            Turn the Sum of Human Wisdom into Your <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Trivia Challenge</span>
          </motion.h1>

          {/* Narrative Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            Search any Wikipedia article, customize your parameters, and instantly play immersive trivia quizzes compiled dynamically by Gemini 3.5. Study with an interactive AI companion as you play!
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer hover:translate-y-[-1px]"
            >
              <span>{isAuthenticated ? "Enter Dashboard" : "Start Playing (Free)"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onHostEventClick}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:translate-y-[-1px]"
            >
              <Users className="h-4 w-4" />
              <span>Host Live Trivia Event</span>
            </button>
            
            {!isAuthenticated && (
              <button
                onClick={onSignInClick}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Your Account</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Feature Highlights - Bento-Style Grid */}
        <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center mb-4">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Live Wikipedia search</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Query any live encyclopedia topic. Our crawler downloads verified Wikipedia summaries to extract questions securely.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Gemini AI synthesis</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Formulates rich multiple-choice or true/false formats, with correct verification quotes appended from official logs.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center mb-4">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Interactive Study Guard</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Stumped by a complex answer? Talk to the interactive AI companion. Unlocks automatically on quiz completion.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Shareable scorecards</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Earn official scorecards, letter grades (A-F), correct stats, and copy-ready markdown text snippets to challenge peers.
            </p>
          </motion.div>
        </div>

        {/* Trending Quick Start Carousel */}
        <div className="mt-20 w-full max-w-4xl bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                Featured Study Topics
              </h3>
              <p className="text-xs text-zinc-400">
                Click any of these verified, high-yield historical events to begin a trivia generator setup instantly.
              </p>
            </div>
            <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20 uppercase tracking-wider font-semibold">
              Highly Rated
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRENDING_TOPICS.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectTopic(topic.title);
                  onGetStarted();
                }}
                className="p-4 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 rounded-xl text-left transition-all cursor-pointer group hover:translate-y-[-1px] shadow-sm"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {topic.title}
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  {topic.category}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-8 text-center text-zinc-600 text-xs uppercase tracking-[0.2em] w-full mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500">
            Wiki Quiz — Connected to Gemini 3.5 Flash API
          </p>
          <div className="flex gap-4">
            <span className="text-zinc-800">|</span>
            <span className="text-zinc-400 font-mono">Build 1.0.0-PRO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
