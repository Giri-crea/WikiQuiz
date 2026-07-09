import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Award, TrendingUp, Activity } from "lucide-react";
import { getAllProgressWithBackwardsCompatibility, TopicProgress } from "../lib/progress";

export default function DifficultyStats() {
  const [progressData, setProgressData] = useState<Record<string, TopicProgress>>({});

  useEffect(() => {
    const loadData = () => {
      setProgressData(getAllProgressWithBackwardsCompatibility());
    };

    loadData();

    window.addEventListener("wiki-quiz-progress-update", loadData);
    return () => {
      window.removeEventListener("wiki-quiz-progress-update", loadData);
    };
  }, []);

  // Compute stats
  const topics = Object.values(progressData) as TopicProgress[];
  
  // Calculate average highest accuracy per difficulty across all topics that have been played
  let easySum = 0, easyCount = 0;
  let mediumSum = 0, mediumCount = 0;
  let hardSum = 0, hardCount = 0;

  topics.forEach((topic) => {
    if (topic.easyQuizzesPlayed && topic.easyQuizzesPlayed > 0) {
      easySum += topic.easyAccuracy ?? 0;
      easyCount++;
    }
    if (topic.mediumQuizzesPlayed && topic.mediumQuizzesPlayed > 0) {
      mediumSum += topic.mediumAccuracy ?? 0;
      mediumCount++;
    }
    if (topic.hardQuizzesPlayed && topic.hardQuizzesPlayed > 0) {
      hardSum += topic.hardAccuracy ?? 0;
      hardCount++;
    }

    // fallback for legacy records or records where quizzes were played but specific difficulty stats are zero
    if (topic.quizzesPlayed > 0 && (!topic.easyQuizzesPlayed && !topic.mediumQuizzesPlayed && !topic.hardQuizzesPlayed)) {
      mediumSum += topic.highestAccuracy;
      mediumCount++;
    }
  });

  const avgEasy = easyCount > 0 ? Math.round(easySum / easyCount) : 0;
  const avgMedium = mediumCount > 0 ? Math.round(mediumSum / mediumCount) : 0;
  const avgHard = hardCount > 0 ? Math.round(hardSum / hardCount) : 0;

  // Let's format data for Recharts BarChart
  const chartData = [
    {
      name: "Easy",
      Accuracy: avgEasy,
      color: "#10b981", // Emerald 500
      count: topics.reduce((acc, t) => acc + (t.easyQuizzesPlayed ?? 0), 0)
    },
    {
      name: "Medium",
      Accuracy: avgMedium,
      color: "#6366f1", // Indigo 500
      count: topics.reduce((acc, t) => acc + (t.mediumQuizzesPlayed ?? (t.quizzesPlayed > 0 && !t.easyQuizzesPlayed && !t.hardQuizzesPlayed ? t.quizzesPlayed : 0)), 0)
    },
    {
      name: "Hard",
      Accuracy: avgHard,
      color: "#f43f5e", // Rose 500
      count: topics.reduce((acc, t) => acc + (t.hardQuizzesPlayed ?? 0), 0)
    }
  ];

  const totalPlayed = chartData.reduce((acc, item) => acc + item.count, 0);

  if (totalPlayed === 0) {
    // Return empty state or placeholder if they haven't played anything yet
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-500" />
          Performance Analytics
        </h3>
        <div className="py-8 text-center space-y-2">
          <div className="h-10 w-10 bg-zinc-950 border border-zinc-850 rounded-full flex items-center justify-center mx-auto text-zinc-600">
            <Award className="h-5 w-5" />
          </div>
          <p className="text-xs text-zinc-400 font-medium">No performance data yet</p>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
            Complete your first trivia quiz on any Wikipedia article to unlock accuracy analytics per difficulty level.
          </p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl text-xs font-sans space-y-1">
          <p className="font-semibold text-white">{data.name} Difficulty</p>
          <p className="text-indigo-400">Avg Accuracy: <span className="font-mono font-bold text-white">{data.Accuracy}%</span></p>
          <p className="text-zinc-500">Quizzes played: <span className="font-mono">{data.count}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-5 shadow-xs">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Performance Analytics
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Average accuracy achieved across different quiz difficulty tiers
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-400 block font-medium">Total Quizzes</span>
          <span className="text-sm font-bold text-white font-mono">{totalPlayed}</span>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="#71717a" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#71717a" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(39, 39, 42, 0.3)" }} />
            <Bar dataKey="Accuracy" radius={[6, 6, 0, 0]} barSize={44}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-zinc-800/60">
        {chartData.map((data) => (
          <div key={data.name} className="p-2.5 bg-zinc-950/40 border border-zinc-850/60 rounded-lg text-center space-y-0.5">
            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider block">{data.name}</span>
            <span className="text-sm font-extrabold font-mono text-zinc-100 block">
              {data.Accuracy}%
            </span>
            <span className="text-[8px] text-zinc-500 font-mono block">
              {data.count} {data.count === 1 ? "quiz" : "quizzes"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
