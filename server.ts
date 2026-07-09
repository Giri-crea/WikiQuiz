import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY?.trim();
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'local-dev-build',
        }
      }
    })
  : null;

// Cache or helper for Wikipedia APIs
// Wikipedia API documentation: https://www.mediawiki.org/wiki/API:Main_page
async function searchWikipedia(query: string) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Wikipedia search failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.query?.search || [];
}

async function getWikipediaPageContent(title: string) {
  // We fetch both extract (plain text summary) and full content extracts
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Wikipedia page retrieval failed with status ${response.status}`);
  }
  const data = await response.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  if (pageId === "-1" || !pageId) {
    return null;
  }
  
  const page = pages[pageId];
  return {
    pageid: page.pageid,
    title: page.title,
    extract: page.extract || ""
  };
}

// Get more comprehensive content (sections/full extract)
async function getFullWikipediaPage(title: string) {
  // To keep it clean and avoid fetching huge HTML, we fetch a larger intro extract (up to 10 paragraphs)
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=&exsentences=15&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) {
    return await getWikipediaPageContent(title);
  }
  const data = await response.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  if (pageId === "-1" || !pageId) {
    return await getWikipediaPageContent(title);
  }
  const page = pages[pageId];
  return {
    pageid: page.pageid,
    title: page.title,
    extract: page.extract || ""
  };
}

// Get random popular articles list (highly curated list to start with)
const PRESET_TOPICS = [
  { title: "Albert Einstein", description: "The theoretical physicist who developed the theory of relativity." },
  { title: "Great Wall of China", description: "One of the greatest wonders of the world, built across historical northern borders." },
  { title: "Internet", description: "The global system of interconnected computer networks." },
  { title: "Dinosaur", description: "A diverse group of reptiles of the clade Dinosauria that first appeared during the Triassic period." },
  { title: "Apollo 11", description: "The spaceflight that first landed humans on the Moon." },
  { title: "Ancient Egypt", description: "A civilization of ancient Northeast Africa, concentrated along the lower reaches of the Nile River." },
  { title: "Renaissance", description: "A period in European history marking the transition from the Middle Ages to modernity." },
  { title: "Great Barrier Reef", description: "The world's largest coral reef system, located off the coast of Queensland, Australia." },
  { title: "Artificial intelligence", description: "Intelligence demonstrated by machines, in contrast to the natural intelligence of humans." },
  { title: "Himalayas", description: "A mountain range in Asia separating the plains of the Indian subcontinent from the Tibetan Plateau." }
];

// API Endpoints

// Get preset trending articles
app.get("/api/preset-topics", (req, res) => {
  res.json({ topics: PRESET_TOPICS });
});

// Search Wikipedia
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const results = await searchWikipedia(query);
    res.json({ results });
  } catch (error: any) {
    console.error("Wikipedia search error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get article details
app.get("/api/article", async (req, res) => {
  try {
    const title = req.query.title as string;
    if (!title) {
      return res.status(400).json({ error: "Title parameter is required" });
    }
    const article = await getFullWikipediaPage(title);
    if (!article) {
      return res.status(404).json({ error: "Article not found on Wikipedia" });
    }
    res.json({ article });
  } catch (error: any) {
    console.error("Wikipedia article fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Quiz from Article using Gemini 3.5-flash with Response Schema
app.post("/api/quiz/generate", async (req, res) => {
  try {
    const { title, extract, count = 5, difficulty = "Medium", quizType = "Multiple Choice" } = req.body;
    
    if (!title || !extract) {
      return res.status(400).json({ error: "Article title and content (extract) are required" });
    }

    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert quiz master.
Analyze the following Wikipedia article text about "${title}" and generate a high-quality, engaging quiz based on it.

Article content:
${extract}

Quiz parameters:
- Generate exactly ${count} questions.
- Difficulty level: ${difficulty}. (Make sure questions truly reflect this difficulty, avoiding overly obvious trivia if hard, and keeping it accessible if easy).
- Question type format: ${quizType}. (All questions must be multiple-choice style with exactly 4 options).

Ensure:
- Questions are direct and interesting.
- All correct answers must be 100% accurate according to the provided article text.
- Options must be plausible, but only one is correct.
- Correct answer option must be included exactly in the options array.
- For each question, provide a detailed explanation of the fact and mention the exact fact source from the text to help the user learn.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "The list of quiz questions generated from the article.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "The text of the quiz question."
                  },
                  options: {
                    type: Type.ARRAY,
                    description: "Exactly four plausible options for the multiple-choice question.",
                    items: {
                      type: Type.STRING
                    }
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "The correct answer, which must match one of the options exactly."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A detailed educational explanation of why this answer is correct."
                  },
                  factSource: {
                    type: Type.STRING,
                    description: "A short quote or summary of the specific fact in the Wikipedia text that verifies this answer."
                  }
                },
                required: ["question", "options", "correctAnswer", "explanation", "factSource"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response returned from Gemini API");
    }

    // Parse output
    const quizData = JSON.parse(text);
    res.json(quizData);
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// Generate Did You Know trivia cards
app.post("/api/quiz/did-you-know", async (req, res) => {
  try {
    const { title, extract } = req.body;
    
    if (!title || !extract) {
      return res.status(400).json({ error: "Article title and content (extract) are required" });
    }

    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate 4 surprising, engaging, and educational "Did You Know?" fun facts from the Wikipedia article titled "${title}".
Keep each fact concise (1-2 sentences) and highly informative.

Article content:
${extract}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            facts: {
              type: Type.ARRAY,
              description: "Four engaging 'Did You Know?' statements.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ["facts"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response returned from Gemini API");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Did You Know error:", error);
    res.status(500).json({ error: error.message || "Failed to generate trivia" });
  }
});

// Chat support / Trivia Master assistant for follow-up questions about the quiz or article!
app.post("/api/quiz/ask-assistant", async (req, res) => {
  try {
    const { title, extract, question, history } = req.body;
    
    if (!title || !extract || !question) {
      return res.status(400).json({ error: "Title, extract, and question are required" });
    }

    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
    }

    const systemInstruction = `You are a friendly, witty, and highly knowledgeable Wikipedia Quiz Assistant.
The user is playing a quiz about the Wikipedia article "${title}".
Your job is to answer their questions about the article content, clarify facts, provide deeper historical/scientific context, or gently explain any quiz questions they got wrong.
Keep your answers brief, engaging, educational, and accurate to the Wikipedia article provided below.
Wikipedia Article Context:
${extract}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const text = response.text;
    res.json({ answer: text });
  } catch (error: any) {
    console.error("Assistant chat error:", error);
    res.status(500).json({ error: error.message || "Failed to answer question" });
  }
});

// Vite Middleware & Static Serving setup
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 on port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Wiki Quiz server running on http://0.0.0.0:${PORT} in ${isProd ? "production" : "development"} mode`);
  });
}

startServer();
