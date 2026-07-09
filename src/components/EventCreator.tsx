import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Trash, Edit, Save, Play, Search, Loader2, Sparkles, BookOpen, ChevronRight, 
  ChevronDown, Copy, Check, Users, Shield, Award, Trophy, ArrowLeft, Volume2, 
  Settings, HelpCircle, FileText, Download, Share2, Info, RefreshCw, Eye, EyeOff, LayoutTemplate, X
} from "lucide-react";
import { Article, Question } from "../types";

interface EventCreatorProps {
  onBackToDashboard: () => void;
}

interface SavedEvent {
  id: string;
  name: string;
  topic: string;
  questions: Question[];
  createdAt: string;
}

interface TeamScore {
  name: string;
  score: number;
}

export default function EventCreator({ onBackToDashboard }: EventCreatorProps) {
  // Views: "setup" (create/manage events), "host" (live presentation mode)
  const [view, setView] = useState<"setup" | "host">("setup");
  
  // Custom Events Storage
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Event details being edited
  const [eventName, setEventName] = useState("My Live Trivia Night");
  const [eventTopic, setEventTopic] = useState("");
  const [eventQuestions, setEventQuestions] = useState<Question[]>([]);
  
  // Generator Parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  const [qCount, setQCount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [quizType, setQuizType] = useState("Multiple Choice");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Manual Question Adding State
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualQuestionText, setManualQuestionText] = useState("");
  const [manualOptions, setManualOptions] = useState<string[]>(["", "", "", ""]);
  const [manualCorrect, setManualCorrect] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");
  
  // Host Presentation State
  const [currentHostIndex, setCurrentHostIndex] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [hideOptions, setHideOptions] = useState(false);
  const [teams, setTeams] = useState<TeamScore[]>([
    { name: "Team Cosmos", score: 0 },
    { name: "Team Quasars", score: 0 }
  ]);
  const [newTeamName, setNewTeamName] = useState("");
  
  // Success toast/state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Saved Events from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wiki_quiz_hosted_events");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedEvents(parsed);
        if (parsed.length > 0) {
          loadEvent(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Error loading events", e);
    }
  }, []);

  // Show auto-dismissing toast messages
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Wikipedia search handler
  const handleWikiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoadingSearch(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results || []);
      } else {
        setGenError(data.error || "Failed to search Wikipedia");
      }
    } catch (err) {
      setGenError("Network error. Please try again.");
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Select wikipedia search result and retrieve content
  const selectArticle = async (title: string) => {
    setIsLoadingSearch(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/article?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (res.ok && data.article) {
        setSelectedArticle(data.article);
        setEventTopic(data.article.title);
        setSearchResults([]);
      } else {
        setGenError(data.error || `Failed to fetch page for "${title}"`);
      }
    } catch (err) {
      setGenError("Failed to fetch page.");
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Generate Questions via backend API using Gemini
  const generateQuestions = async () => {
    if (!selectedArticle) {
      setGenError("Please select a Wikipedia topic first before generating.");
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedArticle.title,
          extract: selectedArticle.extract,
          count: qCount,
          difficulty: difficulty,
          quizType: quizType
        })
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        // Append or replace? Let's append to let them customize!
        setEventQuestions((prev) => [...prev, ...data.questions]);
        triggerToast(`Successfully generated & appended ${data.questions.length} questions!`);
      } else {
        setGenError(data.error || "Unable to generate trivia questions.");
      }
    } catch (err) {
      setGenError("Network error occurred during question generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Add Manual Custom Question
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestionText.trim()) {
      setGenError("Question text cannot be empty.");
      return;
    }
    if (manualOptions.some(o => !o.trim())) {
      setGenError("Please fill in all 4 multiple-choice options.");
      return;
    }
    if (!manualCorrect.trim()) {
      setGenError("Please specify which option is the correct answer.");
      return;
    }
    if (!manualOptions.includes(manualCorrect)) {
      setGenError("The correct answer must match one of your 4 options exactly.");
      return;
    }

    const newQ: Question = {
      question: manualQuestionText,
      options: [...manualOptions],
      correctAnswer: manualCorrect,
      explanation: manualExplanation || "Custom icebreaker/fact added by Host.",
      factSource: "User Created Manual Question"
    };

    setEventQuestions((prev) => [...prev, newQ]);
    
    // Clear Form
    setManualQuestionText("");
    setManualOptions(["", "", "", ""]);
    setManualCorrect("");
    setManualExplanation("");
    setShowAddManual(false);
    setGenError(null);
    triggerToast("Custom question successfully added!");
  };

  // Save Event to LocalStorage
  const saveEvent = () => {
    if (!eventName.trim()) {
      triggerToast("Event name cannot be empty.");
      return;
    }

    const all = [...savedEvents];
    const existingIdx = all.findIndex(e => e.id === selectedEventId);

    const eventToSave: SavedEvent = {
      id: selectedEventId || `evt-${Date.now()}`,
      name: eventName,
      topic: eventTopic || "General Mix",
      questions: eventQuestions,
      createdAt: new Date().toLocaleDateString()
    };

    if (existingIdx > -1) {
      all[existingIdx] = eventToSave;
    } else {
      all.push(eventToSave);
      setSelectedEventId(eventToSave.id);
    }

    setSavedEvents(all);
    localStorage.setItem("wiki_quiz_hosted_events", JSON.stringify(all));
    triggerToast("Trivia Event successfully saved!");
  };

  // Load an existing event
  const loadEvent = (evt: SavedEvent) => {
    setSelectedEventId(evt.id);
    setEventName(evt.name);
    setEventTopic(evt.topic);
    setEventQuestions(evt.questions);
    setGenError(null);
  };

  // Delete saved event
  const deleteSavedEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedEvents.filter(e => e.id !== id);
    setSavedEvents(filtered);
    localStorage.setItem("wiki_quiz_hosted_events", JSON.stringify(filtered));
    if (selectedEventId === id) {
      setSelectedEventId(null);
      setEventName("My Live Trivia Night");
      setEventTopic("");
      setEventQuestions([]);
    }
    triggerToast("Event deleted successfully.");
  };

  // Clear current questions workspace
  const clearCurrentWorkspace = () => {
    setSelectedEventId(null);
    setEventName("My Live Trivia Night");
    setEventTopic("");
    setEventQuestions([]);
    setSelectedArticle(null);
    setGenError(null);
  };

  // Remove single question from workspace
  const removeQuestion = (idx: number) => {
    setEventQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Copy Entire Quiz in Markdown format
  const exportToMarkdown = () => {
    if (eventQuestions.length === 0) return;
    
    let text = `# ${eventName}\n*Topic: ${eventTopic} | Generated with Wiki Quiz*\n\n`;
    eventQuestions.forEach((q, idx) => {
      text += `## Q${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        const prefix = String.fromCharCode(65 + oIdx); // A, B, C, D
        text += `  [ ] ${prefix}. ${opt}\n`;
      });
      text += `\n**Correct Answer:** ${q.correctAnswer}\n`;
      text += `**Fact Source (Wikipedia):** "${q.factSource}"\n`;
      text += `**Explanation:** ${q.explanation}\n\n---\n\n`;
    });

    navigator.clipboard.writeText(text);
    triggerToast("Markdown text copied to clipboard!");
  };

  // Sort and display teams
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  // Score controller
  const adjustScore = (idx: number, delta: number) => {
    setTeams((prev) => {
      const next = [...prev];
      next[idx].score = Math.max(0, next[idx].score + delta);
      return next;
    });
  };

  // Add new scoreboard team
  const addTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeams((prev) => [...prev, { name: newTeamName.trim(), score: 0 }]);
    setNewTeamName("");
  };

  // Delete a team
  const deleteTeam = (nameToDelete: string) => {
    setTeams((prev) => prev.filter(t => t.name !== nameToDelete));
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between select-none">
      
      {/* Toast Alert popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-indigo-500 text-white text-xs px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 font-medium"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {/* Back navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Return to Solo Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                  Host & Event Mode
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Trivia Event Creator & Presentation Panel
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {eventQuestions.length > 0 && view === "setup" && (
              <button
                onClick={() => {
                  setCurrentHostIndex(0);
                  setRevealAnswer(false);
                  setView("host");
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer transition-all hover:translate-y-[-1px]"
              >
                <Play className="h-4 w-4 fill-white" />
                Launch Presenter Screen
              </button>
            )}
            {view === "host" && (
              <button
                onClick={() => setView("setup")}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Settings className="h-4 w-4" />
                Exit Presentation Mode
              </button>
            )}
          </div>
        </div>

        {/* SETUP VIEW: DESIGN & MANAGE EVENT QUESTIONS */}
        {view === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: SAVED LOBBIES & GENERATOR FORM (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* SAVED EVENTS LIST */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Saved Live Events
                  </h3>
                  {selectedEventId && (
                    <button
                      onClick={clearCurrentWorkspace}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Create New Event
                    </button>
                  )}
                </div>

                {savedEvents.length === 0 ? (
                  <p className="text-xs text-zinc-500 leading-relaxed py-4 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    No custom event files saved yet. Configure one below to save.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {savedEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => loadEvent(evt)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center group ${
                          selectedEventId === evt.id
                            ? "border-indigo-500/60 bg-indigo-500/5 text-white"
                            : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <div className="truncate pr-4">
                          <h4 className="text-xs font-bold truncate">
                            {evt.name}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
                            Topic: {evt.topic} &bull; {evt.questions.length} Qs
                          </span>
                        </div>
                        <button
                          onClick={(e) => deleteSavedEvent(evt.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-md transition-all shrink-0"
                          title="Delete Saved Event"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* EVENT CONFIG & NAME */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-indigo-400" />
                  Event Metadata
                </h3>

                <div className="space-y-4">
                  {/* Event Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Event Presentation Name
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g., Friday Night Trivia Showdown"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Topic Label */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Event Main Topic Label
                    </label>
                    <input
                      type="text"
                      value={eventTopic}
                      onChange={(e) => setEventTopic(e.target.value)}
                      placeholder="e.g., General Mix / Ancient Rome"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* QUESTIONS GENERATOR SEARCH */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Generate Event Questions
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Search any live Wikipedia page to construct high-yield questions for your audience dynamically.
                </p>

                {/* Wiki Search */}
                <form onSubmit={handleWikiSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Alexander the Great, Bitcoin..."
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingSearch}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isLoadingSearch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Find
                  </button>
                </form>

                {/* Wiki search results list */}
                {searchResults.length > 0 && (
                  <div className="p-2.5 bg-zinc-950/80 border border-zinc-850 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-mono text-zinc-500">Wikipedia Pages Found</span>
                      <button onClick={() => setSearchResults([])} className="text-[9px] text-zinc-400 hover:text-white underline">Dismiss</button>
                    </div>
                    {searchResults.map((res) => (
                      <button
                        key={res.pageid}
                        type="button"
                        onClick={() => selectArticle(res.title)}
                        className="w-full text-left p-2 hover:bg-zinc-900 rounded-lg text-xs flex flex-col gap-1 transition-colors border border-transparent hover:border-zinc-800"
                      >
                        <span className="font-bold text-zinc-200">{res.title}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1" dangerouslySetInnerHTML={{ __html: res.snippet }} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Article Banner */}
                {selectedArticle && (
                  <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold block">Selected Encyclopedia Source</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{selectedArticle.title}</h4>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedArticle(null);
                        setEventTopic("");
                      }}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Configuration parameters & Generate */}
                {selectedArticle && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Q-Count</label>
                        <select
                          value={qCount}
                          onChange={(e) => setQCount(Number(e.target.value))}
                          className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-hidden"
                        >
                          <option value={3}>3 Questions</option>
                          <option value={5}>5 Questions</option>
                          <option value={10}>10 Questions</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-hidden"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={generateQuestions}
                      disabled={isGenerating}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/15"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Gemini is generating event questions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                          <span>Generate & Append Question Set</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {genError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                    {genError}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: EVENT WORKSPACE PREVIEW & SAVE OPTIONS (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[500px]">
                
                <div className="space-y-4">
                  
                  {/* Workspace Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Draft Questions Workspace
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Edit, delete, or rearrange questions prior to hosting.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowAddManual(!showAddManual)}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-indigo-400" />
                        Add Custom Question
                      </button>

                      {eventQuestions.length > 0 && (
                        <button
                          onClick={exportToMarkdown}
                          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy Quiz as Printable Document"
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-400" />
                          Copy MD
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual Add Form Overlay (Dropdown accordion style) */}
                  <AnimatePresence>
                    {showAddManual && (
                      <motion.form
                        onSubmit={handleAddManualQuestion}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-zinc-950/80 border border-zinc-850 rounded-xl space-y-3 overflow-hidden"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Plus className="h-4 w-4 text-indigo-400" />
                            Compose Custom Question
                          </span>
                          <button type="button" onClick={() => setShowAddManual(false)} className="text-[10px] text-zinc-500 hover:text-white font-mono">
                            Cancel
                          </button>
                        </div>

                        {/* Question Text */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase block">Question Text</label>
                          <input
                            type="text"
                            required
                            value={manualQuestionText}
                            onChange={(e) => setManualQuestionText(e.target.value)}
                            placeholder="e.g., Which team won the UEFA Champions League in 2005?"
                            className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Options A-D */}
                        <div className="grid grid-cols-2 gap-2">
                          {manualOptions.map((opt, oIdx) => (
                            <div key={oIdx} className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-500 uppercase block">Option {String.fromCharCode(65 + oIdx)}</label>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => {
                                  const next = [...manualOptions];
                                  next[oIdx] = e.target.value;
                                  setManualOptions(next);
                                }}
                                placeholder={`Answer option ${oIdx + 1}`}
                                className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-hidden"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Correct Option Specifier */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase block">Correct Option (Must Match Exactly)</label>
                            <select
                              value={manualCorrect}
                              onChange={(e) => setManualCorrect(e.target.value)}
                              required
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-hidden"
                            >
                              <option value="">-- Choose Correct Option --</option>
                              {manualOptions.filter(o => o.trim()).map((o, idx) => (
                                <option key={idx} value={o}>{o}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase block">Fun Explanation</label>
                            <input
                              type="text"
                              value={manualExplanation}
                              onChange={(e) => setManualExplanation(e.target.value)}
                              placeholder="e.g., Liverpool defeated AC Milan on penalties."
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Insert to Draft Set
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Empty state or list */}
                  {eventQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/10 space-y-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-300">Draft Area is Empty</h4>
                      <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                        Generate questions using the AI search panel on the left, or add custom manual icebreakers to build your curated live lobby!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {eventQuestions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-2 relative group"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 h-5 px-1.5 rounded-md flex items-center justify-center shrink-0">
                              Q{qIdx + 1}
                            </span>
                            <p className="text-xs font-bold text-white flex-1 pr-6 leading-relaxed">
                              {q.question}
                            </p>
                            <button
                              onClick={() => removeQuestion(qIdx)}
                              className="p-1.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-md transition-all shrink-0 cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pl-7">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-lg text-[11px] truncate flex items-center gap-1.5 border ${
                                  opt === q.correctAnswer
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-bold"
                                    : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                                }`}
                              >
                                <span className="font-mono text-[9px] text-zinc-500">{String.fromCharCode(65 + oIdx)}.</span>
                                <span className="truncate">{opt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer options */}
                {eventQuestions.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80 pt-5 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">
                        Total: {eventQuestions.length} Trivia Questions Drafted
                      </span>
                    </div>

                    <button
                      onClick={saveEvent}
                      className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Event File
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* HOST PRESENTER LOBBY: TV & SCREEN PRESENTATION MODE */}
        {view === "host" && eventQuestions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LOBBY PRESENTATION BOARD (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Giant Presentation Card */}
              <div className="bg-[#0c0c0e] border-2 border-zinc-850 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
                
                {/* Visual grid accent background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  
                  {/* Top presentation status line */}
                  <div className="flex justify-between items-center border-b border-zinc-800/60 pb-4">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">
                      {eventName}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 border border-indigo-500/25 rounded-full">
                      Question {currentHostIndex + 1} of {eventQuestions.length}
                    </span>
                  </div>

                  {/* Giant Legible Question */}
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-extrabold text-white leading-relaxed tracking-tight text-center sm:text-left">
                      {eventQuestions[currentHostIndex].question}
                    </h3>
                  </div>

                  {/* Multiple Choice Answers Container */}
                  {!hideOptions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {eventQuestions[currentHostIndex].options.map((opt, oIdx) => {
                        const isCorrect = opt === eventQuestions[currentHostIndex].correctAnswer;
                        return (
                          <div
                            key={oIdx}
                            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                              revealAnswer
                                ? isCorrect
                                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-300"
                                  : "border-zinc-850 bg-zinc-950/20 opacity-40 text-zinc-500"
                                : "border-zinc-800 bg-zinc-950/40 text-zinc-300"
                            }`}
                          >
                            {/* A, B, C, D letter badges */}
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              revealAnswer && isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-900 border border-zinc-850 text-zinc-400"
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="text-sm font-semibold truncate-3-lines leading-snug">
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Expanded Wikipedia Dispute Resolver */}
                  <AnimatePresence>
                    {revealAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2 pt-4 mt-4"
                      >
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          Wikipedia Fact Verification Summary
                        </span>
                        <blockquote className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-indigo-500 pl-3">
                          "{eventQuestions[currentHostIndex].factSource || "Information verified via official encyclopedia logs."}"
                        </blockquote>
                        <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                          {eventQuestions[currentHostIndex].explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Question Controls bar */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/60 pt-6 mt-8">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setHideOptions(!hideOptions)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Hide choices to allow full recall, open choices for trivia format"
                    >
                      {hideOptions ? <Eye className="h-3.5 w-3.5 text-indigo-400" /> : <EyeOff className="h-3.5 w-3.5 text-indigo-400" />}
                      <span>{hideOptions ? "Show Choices" : "Hide Choices"}</span>
                    </button>

                    <button
                      onClick={() => setRevealAnswer(!revealAnswer)}
                      className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{revealAnswer ? "Conceal Answer" : "Reveal Answer"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentHostIndex === 0}
                      onClick={() => {
                        setCurrentHostIndex(prev => prev - 1);
                        setRevealAnswer(false);
                      }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Previous Question
                    </button>

                    <button
                      disabled={currentHostIndex === eventQuestions.length - 1}
                      onClick={() => {
                        setCurrentHostIndex(prev => prev + 1);
                        setRevealAnswer(false);
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Next Question &rarr;
                    </button>
                  </div>
                </div>

              </div>

              {/* Grid indices shortcut */}
              <div className="flex flex-wrap items-center justify-center gap-2 py-2">
                {eventQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentHostIndex(idx);
                      setRevealAnswer(false);
                    }}
                    className={`h-9 w-9 text-xs font-mono font-bold rounded-lg transition-all border flex items-center justify-center cursor-pointer ${
                      currentHostIndex === idx
                        ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

            </div>

            {/* SIDEBAR: INTERACTIVE LOBBY TEAM SCOREBOARD (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 space-y-4 h-full flex flex-col justify-between">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Lobby Scoreboard
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono">Real-time Tracker</span>
                  </div>

                  {/* Score adjustment cards */}
                  {teams.length === 0 ? (
                    <p className="text-xs text-zinc-500 leading-relaxed text-center py-6">
                      No teams registered. Register some below to keep scores!
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {sortedTeams.map((team, idx) => {
                        // find real index to update score correctly
                        const realIdx = teams.findIndex(t => t.name === team.name);
                        const isLeader = idx === 0 && team.score > 0;
                        return (
                          <div
                            key={team.name}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors bg-zinc-950/40 ${
                              isLeader ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-zinc-850"
                            }`}
                          >
                            <div className="truncate pr-3">
                              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                {isLeader && <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                                {team.name}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                Rank #{idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => adjustScore(realIdx, -10)}
                                  className="h-7 w-7 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-lg flex items-center justify-center text-xs text-zinc-400 font-mono"
                                  title="Deduct 10 points"
                                >
                                  -
                                </button>
                                <span className="text-sm font-mono font-bold text-white w-10 text-center">
                                  {team.score}
                                </span>
                                <button
                                  onClick={() => adjustScore(realIdx, 10)}
                                  className="h-7 w-7 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                                  title="Add 10 points"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => deleteTeam(team.name)}
                                className="p-1 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-md transition-colors"
                                title="Remove Team"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Team form */}
                <form onSubmit={addTeam} className="border-t border-zinc-800/85 pt-4 mt-4 space-y-2">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase">
                    Register New Live Team
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g., Einstein's Heirs"
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-indigo-400 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                </form>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-6 text-center text-zinc-600 text-[10px] uppercase tracking-widest w-full">
        Wiki Quiz Event Master &bull; Fully Projector Compliant
      </footer>

    </div>
  );
}
