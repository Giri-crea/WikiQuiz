import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Sparkles, X, CornerDownLeft, Bot, User } from "lucide-react";
import { Article, ChatMessage } from "../types";
import { incrementTopicAiQuestions } from "../lib/progress";

interface QuizAssistantProps {
  article: Article | null;
  onClose?: () => void;
  currentQuestionText?: string; // Optional context: user can ask about current question!
  disabled?: boolean;
}

export default function QuizAssistant({
  article,
  onClose,
  currentQuestionText,
  disabled = false
}: QuizAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (article) {
      setMessages([
        {
          sender: "assistant",
          text: `Hi! I'm your Wikipedia Trivia Assistant. Ask me anything about "${article.title}" or ask for hints and deeper explanations regarding the quiz questions.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } else {
      setMessages([
        {
          sender: "assistant",
          text: "Select a Wikipedia article, and I will be here to help you study the facts and master the quiz!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [article]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !article) return;

    const userMessage: ChatMessage = {
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Append current question context to the query if available to make the chatbot smarter
      let fullQuery = input;
      if (currentQuestionText) {
        fullQuery += `\n(Context - Current Quiz Question: "${currentQuestionText}")`;
      }

      const res = await fetch("/api/quiz/ask-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          extract: article.extract,
          question: fullQuery
        })
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
        if (article?.title) {
          incrementTopicAiQuestions(article.title);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: "My apologies, I ran into an issue finding that fact on Wikipedia. Please try asking again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "A connection error occurred. Make sure your internet is working and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const askPredefined = (question: string) => {
    setInput(question);
    // Submit it next tick
    setTimeout(() => {
      const form = document.getElementById("assistant-chat-form") as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 50);
  };

  return (
    <div className="relative bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-sm flex flex-col h-[520px] overflow-hidden">
      {/* If disabled, show a highly crafted pause overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-4 shadow-lg">
            <Bot className="h-6 w-6 text-indigo-400 animate-pulse" />
          </div>
          <h4 className="font-bold text-sm text-zinc-100 mb-2">
            Trivia Companion Paused
          </h4>
          <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed mb-4">
            To ensure an honest and focused challenge, the AI study companion is disabled while you are actively taking the quiz.
          </p>
          <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono uppercase tracking-widest rounded-full font-medium">
            Unlocks on Completion
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 bg-[#09090B] text-white flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Trivia Master AI</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Wikipedia Companion</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-zinc-800/80 rounded-md transition-colors text-zinc-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#09090B]/30">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 select-none ${
              msg.sender === "user" ? "bg-zinc-800 text-zinc-100" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
            }`}>
              {msg.sender === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div>
              <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/15"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-250 rounded-tl-none"
              }`}>
                {msg.text}
              </div>
              <span className={`text-[9px] text-zinc-500 mt-1 block ${
                msg.sender === "user" ? "text-right mr-1" : "text-left ml-1"
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto">
            <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 select-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none text-xs text-zinc-400 shadow-2xs flex items-center gap-1.5">
              <span>AI is searching Wikipedia...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions if context is available */}
      {article && messages.length <= 1 && (
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 flex gap-1.5 flex-wrap">
          <button
            onClick={() => askPredefined(`Give me a trivia question about ${article.title}`)}
            className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2 py-1 rounded-md transition-all cursor-pointer"
          >
            ❓ Get random trivia
          </button>
          <button
            onClick={() => askPredefined(`What are the most key historical facts about ${article.title}?`)}
            className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2 py-1 rounded-md transition-all cursor-pointer"
          >
            📖 Key summary
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        id="assistant-chat-form"
        className="p-3 border-t border-zinc-800 bg-[#09090B] flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!article || isLoading}
          placeholder={article ? "Ask a trivia/factual question..." : "Select an article first"}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500/40 text-zinc-100 placeholder-zinc-500 disabled:opacity-60"
        />
        <button
          type="submit"
          id="ask-assistant-submit"
          disabled={!input.trim() || isLoading}
          className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/15"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
