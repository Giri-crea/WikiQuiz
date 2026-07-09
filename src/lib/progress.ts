export interface TopicProgress {
  title: string;
  quizzesPlayed: number;
  highestScore: number;
  totalQuestions: number;
  highestAccuracy: number; // 0 to 100
  factsViewedCount: number;
  aiQuestionsAsked: number;
  progressPercent: number; // 0 to 100
  easyAccuracy?: number;
  mediumAccuracy?: number;
  hardAccuracy?: number;
  easyQuizzesPlayed?: number;
  mediumQuizzesPlayed?: number;
  hardQuizzesPlayed?: number;
}

const STORAGE_KEY = "wiki_quiz_topic_progress";

function getAllProgress(): Record<string, TopicProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Error reading progress from localStorage:", e);
    return {};
  }
}

function saveAllProgress(allProgress: Record<string, TopicProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    // Dispatch a custom event to notify listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("wiki-quiz-progress-update"));
    }
  } catch (e) {
    console.error("Error saving progress to localStorage:", e);
  }
}

export function getAllProgressWithBackwardsCompatibility(): Record<string, TopicProgress> {
  const all = getAllProgress();
  let updated = false;
  Object.keys(all).forEach((key) => {
    const p = all[key];
    let changed = false;
    
    if (p.easyAccuracy === undefined) { p.easyAccuracy = 0; changed = true; }
    if (p.mediumAccuracy === undefined) { 
      p.mediumAccuracy = p.quizzesPlayed > 0 ? p.highestAccuracy : 0; 
      changed = true; 
    }
    if (p.hardAccuracy === undefined) { p.hardAccuracy = 0; changed = true; }
    
    if (p.easyQuizzesPlayed === undefined) { p.easyQuizzesPlayed = 0; changed = true; }
    if (p.mediumQuizzesPlayed === undefined) { 
      p.mediumQuizzesPlayed = p.quizzesPlayed > 0 ? p.quizzesPlayed : 0; 
      changed = true; 
    }
    if (p.hardQuizzesPlayed === undefined) { p.hardQuizzesPlayed = 0; changed = true; }

    if (changed) {
      all[key] = p;
      updated = true;
    }
  });

  if (updated) {
    saveAllProgress(all);
  }
  return all;
}

export function getTopicProgress(title: string): TopicProgress {
  const all = getAllProgress();
  if (all[title]) {
    const p = all[title];
    return {
      ...p,
      easyAccuracy: p.easyAccuracy ?? 0,
      mediumAccuracy: p.mediumAccuracy ?? 0,
      hardAccuracy: p.hardAccuracy ?? 0,
      easyQuizzesPlayed: p.easyQuizzesPlayed ?? 0,
      mediumQuizzesPlayed: p.mediumQuizzesPlayed ?? 0,
      hardQuizzesPlayed: p.hardQuizzesPlayed ?? 0,
    };
  }
  return {
    title,
    quizzesPlayed: 0,
    highestScore: 0,
    totalQuestions: 0,
    highestAccuracy: 0,
    factsViewedCount: 0,
    aiQuestionsAsked: 0,
    progressPercent: 0,
    easyAccuracy: 0,
    mediumAccuracy: 0,
    hardAccuracy: 0,
    easyQuizzesPlayed: 0,
    mediumQuizzesPlayed: 0,
    hardQuizzesPlayed: 0,
  };
}

export function calculateProgressPercent(progress: Omit<TopicProgress, "progressPercent">): number {
  const accuracyWeight = 0.8; // 80% weight from quiz performance
  const interactionWeight = 0.2; // 20% weight from studying facts & AI companion

  const accuracyContribution = progress.highestAccuracy * accuracyWeight;
  
  // Interactions give up to 20% total (e.g., 5% per fact viewed, 5% per AI question)
  const interactionPoints = Math.min(20, (progress.factsViewedCount * 5) + (progress.aiQuestionsAsked * 5));

  // If they have played at least one quiz, their progress is accuracy contribution + interaction points.
  // If they haven't played, they can still gain up to 15% progress by studying beforehand!
  const hasPlayed = progress.quizzesPlayed > 0;
  
  if (hasPlayed) {
    return Math.min(100, Math.round(accuracyContribution + interactionPoints));
  } else {
    // Reward pre-study with up to 15% progress
    return Math.min(15, Math.round(interactionPoints));
  }
}

export function updateTopicQuizResult(
  title: string,
  score: number,
  total: number,
  difficulty?: "Easy" | "Medium" | "Hard"
): TopicProgress {
  const all = getAllProgress();
  const current = getTopicProgress(title);

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  
  current.quizzesPlayed += 1;
  if (accuracy > current.highestAccuracy) {
    current.highestAccuracy = accuracy;
    current.highestScore = score;
    current.totalQuestions = total;
  }

  if (difficulty === "Easy") {
    current.easyQuizzesPlayed = (current.easyQuizzesPlayed ?? 0) + 1;
    current.easyAccuracy = Math.max(current.easyAccuracy ?? 0, accuracy);
  } else if (difficulty === "Medium") {
    current.mediumQuizzesPlayed = (current.mediumQuizzesPlayed ?? 0) + 1;
    current.mediumAccuracy = Math.max(current.mediumAccuracy ?? 0, accuracy);
  } else if (difficulty === "Hard") {
    current.hardQuizzesPlayed = (current.hardQuizzesPlayed ?? 0) + 1;
    current.hardAccuracy = Math.max(current.hardAccuracy ?? 0, accuracy);
  } else {
    current.mediumQuizzesPlayed = (current.mediumQuizzesPlayed ?? 0) + 1;
    current.mediumAccuracy = Math.max(current.mediumAccuracy ?? 0, accuracy);
  }

  current.progressPercent = calculateProgressPercent(current);
  
  all[title] = current;
  saveAllProgress(all);
  return current;
}

export function incrementTopicFactsViewed(title: string, count: number = 1): TopicProgress {
  const all = getAllProgress();
  const current = getTopicProgress(title);

  // Avoid resetting if we already have viewing counts, but can increment
  current.factsViewedCount = Math.max(current.factsViewedCount, count);
  current.progressPercent = calculateProgressPercent(current);

  all[title] = current;
  saveAllProgress(all);
  return current;
}

export function incrementTopicAiQuestions(title: string): TopicProgress {
  const all = getAllProgress();
  const current = getTopicProgress(title);

  current.aiQuestionsAsked += 1;
  current.progressPercent = calculateProgressPercent(current);

  all[title] = current;
  saveAllProgress(all);
  return current;
}
