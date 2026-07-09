import React, { useState, useEffect } from "react";
import { HelpCircle, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Article } from "../types";
import { incrementTopicFactsViewed } from "../lib/progress";

interface DidYouKnowProps {
  article: Article | null;
}

export default function DidYouKnow({ article }: DidYouKnowProps) {
  const [facts, setFacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!article) {
      setFacts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch("/api/quiz/did-you-know", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: article.title,
        extract: article.extract
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Did You Know facts");
        return res.json();
      })
      .then((data) => {
        if (data.facts) {
          setFacts(data.facts);
          if (article?.title) {
            incrementTopicFactsViewed(article.title, data.facts.length);
          }
        }
      })
      .catch((err) => {
        console.error("Did you know error:", err);
        setError("Unable to generate custom trivia facts.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [article]);

  if (!article) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 mt-6">
      <h3 className="text-lg text-amber-400 font-semibold mb-3 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-amber-400" />
        Did You Know?
      </h3>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-amber-400/60 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <span>Curating fun trivia facts from Wikipedia...</span>
        </div>
      ) : error ? (
        <div className="text-xs text-amber-400/70 italic flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      ) : facts.length > 0 ? (
        <ul className="space-y-3">
          {facts.map((fact, idx) => (
            <li key={idx} className="text-sm text-zinc-300 flex gap-2 leading-relaxed">
              <span className="text-amber-400 font-serif font-bold text-base leading-none select-none">•</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500 italic">No trivia facts loaded yet.</p>
      )}
    </div>
  );
}
