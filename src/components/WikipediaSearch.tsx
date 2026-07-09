import React, { useState, useEffect } from "react";
import { Search, Loader2, BookOpen, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import { Topic, Article } from "../types";

interface WikipediaSearchProps {
  onSelectArticle: (article: Article) => void;
  selectedArticle: Article | null;
  onStartQuizDirectly: (customTitle: string) => void;
}

export default function WikipediaSearch({
  onSelectArticle,
  selectedArticle,
  onStartQuizDirectly
}: WikipediaSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [presets, setPresets] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preset popular articles
  useEffect(() => {
    fetch("/api/preset-topics")
      .then((res) => res.json())
      .then((data) => {
        if (data.topics) {
          setPresets(data.topics);
        }
      })
      .catch((err) => {
        console.error("Error loading presets:", err);
      });
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results || []);
      } else {
        setError(data.error || "Failed to search Wikipedia");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectPreset = async (title: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/article?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (res.ok && data.article) {
        onSelectArticle(data.article);
      } else {
        setError(data.error || `Failed to fetch Wikipedia page for "${title}"`);
      }
    } catch (err) {
      setError("Failed to fetch page. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 shadow-xs overflow-hidden rounded-xl">
      {/* Search Header */}
      <div className="p-6 border-b border-zinc-800 bg-gradient-to-b from-zinc-900/40 to-transparent">
        <h2 className="text-2xl text-white font-semibold mb-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-400" />
          Choose Wikipedia Article
        </h2>
        <p className="text-sm text-zinc-400">
          Enter any topic or historic event, and our AI Quiz Master will generate a custom quiz based on the actual Wikipedia page.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              id="wiki-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Isaac Newton, Space Race, Renaissance..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            id="wiki-search-button"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
          >
            {isLoading && !isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-950/40 text-red-400 rounded-lg text-xs font-medium border border-red-900/50">
            {error}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
            <p className="text-xs">Fetching article extracts and parsing Wikipedia facts...</p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchResults.length > 0 && isSearching && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>Search Results</span>
              <button 
                onClick={() => {
                  setSearchResults([]);
                  setIsSearching(false);
                }} 
                className="text-zinc-400 hover:text-white normal-case font-normal text-[11px] underline ml-auto"
              >
                Clear Search
              </button>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {searchResults.map((result) => {
                const isSelected = selectedArticle?.title === result.title;
                return (
                  <button
                    key={result.pageid}
                    id={`search-result-${result.pageid}`}
                    onClick={() => selectPreset(result.title)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex justify-between items-center ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 font-medium text-white"
                        : "border-zinc-800 hover:border-zinc-750 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-300"
                    }`}
                  >
                    <div>
                      <div className={`font-semibold ${isSelected ? "text-indigo-300" : "text-zinc-100"} flex items-center gap-1.5`}>
                        {result.title}
                      </div>
                      <div 
                        className="text-xs text-zinc-400 mt-1 line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: result.snippet + "..." }}
                      />
                    </div>
                    <Sparkles className={`h-4 w-4 shrink-0 ml-2 ${isSelected ? "text-indigo-400" : "text-zinc-500"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Popular Presets */}
        {!isLoading && (!isSearching || searchResults.length === 0) && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              Popular Articles to Quiz
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isSelected = selectedArticle?.title === preset.title;
                return (
                  <button
                    key={preset.title}
                    id={`preset-${preset.title.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => selectPreset(preset.title)}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-xs group ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                        : "border-zinc-800 hover:border-zinc-750 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-300"
                    }`}
                  >
                    <h4 className={`font-semibold group-hover:text-white transition-colors flex items-center gap-2 ${isSelected ? "text-indigo-300 font-bold" : "text-zinc-100"}`}>
                      {preset.title}
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
