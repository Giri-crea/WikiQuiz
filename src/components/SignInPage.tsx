import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LogIn, UserPlus, Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowLeft, Chrome, AlertCircle, CheckCircle2 
} from "lucide-react";

interface SignInPageProps {
  onSignInSuccess: (email: string) => void;
  onBackToHome: () => void;
}

export default function SignInPage({
  onSignInSuccess,
  onBackToHome
}: SignInPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    setError(null);
    if (!email) {
      setError("Please fill in your email address.");
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Please fill in your password.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (isSignUp && !name.trim()) {
      setError("Please fill in your name.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulate API authorization delay
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        onSignInSuccess(email);
      }, 1000);
    }, 1200);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSignInSuccess("google.scholar@gmail.com");
      }, 1000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-zinc-800">
      
      {/* Background soft ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-semibold px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-750 rounded-lg transition-all cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </button>

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Branding header */}
        <div className="text-center space-y-3">
          <button 
            onClick={onBackToHome}
            className="inline-flex h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl items-center justify-center text-white font-sans text-2xl font-bold shadow-xl shadow-indigo-600/25 mb-2 hover:scale-105 transition-transform cursor-pointer"
          >
            W
          </button>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isSignUp ? "Create your Scholar account" : "Sign in to Wiki Quiz"}
          </h2>
          <p className="text-xs text-zinc-400">
            {isSignUp 
              ? "Access dynamic trivia custom quizzes and save score logs" 
              : "Enter your credentials or use guest mode to get started"}
          </p>
        </div>

        {/* Auth form card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          
          {success && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-20"
            >
              <div className="h-14 w-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Authentication Successful
              </h3>
              <p className="text-xs text-zinc-400">
                Opening your Wikipedia Trivia Dashboard...
              </p>
            </motion.div>
          )}

          {/* Toggle Tab header */}
          <div className="flex border-b border-zinc-800 pb-5 mb-6">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                !isSignUp ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign In
              {!isSignUp && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" 
                />
              )}
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                isSignUp ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Create Account
              {isSignUp && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" 
                />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2 font-medium"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Input (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label htmlFor="sign-in-name" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                    <UserPlus className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    id="sign-in-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Carl Sagan"
                    disabled={isLoading}
                    className="w-full bg-zinc-950/85 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600 disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="sign-in-email" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="sign-in-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isLoading}
                  className="w-full bg-zinc-950/85 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="sign-in-password" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setError("Password reset is currently offline. Enter any dummy password above 6 characters.")}
                    className="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="sign-in-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-zinc-950/85 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / T&C */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded-md bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 text-[11px] text-zinc-400 select-none cursor-pointer">
                {isSignUp ? "I accept the Terms of Service & Privacy Policy" : "Keep me signed in for 30 days"}
              </label>
            </div>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/15 cursor-pointer disabled:opacity-50 hover:translate-y-[-1px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connecting to servers...</span>
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Register Account</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
              <span className="bg-[#0f0f12] px-3 text-zinc-500">Or Continue With</span>
            </div>
          </div>

          {/* Social Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Chrome className="h-4 w-4 text-indigo-400" />
            <span>Single Sign-On with Google</span>
          </button>
        </div>

        {/* Guest Mode helper link */}
        <div className="text-center">
          <button
            onClick={() => onSignInSuccess("guest.scholar@wikiquiz.io")}
            className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors font-medium cursor-pointer"
          >
            Skip for now &bull; Enter Dashboard in Guest Mode &rarr;
          </button>
        </div>

        {/* Bottom micro security indicator */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-emerald-500/60" />
          <span>SSL Secure 256-Bit Encryption</span>
        </div>
      </div>
    </div>
  );
}
