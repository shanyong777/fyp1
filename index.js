const path = require("path");
// Load .env from backend directory so it works regardless of current working directory
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Import necessary modules
const express = require("express");
const { OpenAI } = require("openai"); // Use the latest version of OpenAI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

// Initialize the express app
const app = express();
const port = 5000;

// Use CORS to allow requests from the frontend
app.use(cors());

// Enable JSON parsing for request bodies
app.use(express.json());

// Set up OpenAI API conditionally (only if key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("OPENAI_API_KEY not set; /generate-content endpoint will be disabled.");
}

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Define a health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Proxy external images to avoid CORS tainting canvas
app.get("/proxy-image", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
    }
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e) {
    console.error("Proxy error:", e);
    res.status(500).json({ error: "proxy_failed", message: e.message });
  }
});

// Define a route for content generation
app.get("/generate-content", async (req, res) => {
  const prompt =
    req.query.prompt || "Write an 'About Us' page for a tech company.";

  try {
    if (!openai) {
      return res.status(503).json({ error: "OpenAI is not configured" });
    }
    // Call OpenAI's API to generate content
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    // Send the generated content as a response
    res.json({ content: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Error generating content",
      type: error.type || "unknown_error"
    });
  }
});

// Define a route for Gemini content generation
app.post("/generate-gemini", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ content: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Error generating content with Gemini",
    });
  }
});

// Define a route for AI Editor actions (returning JSON commands)
app.post("/generate-editor-action", async (req, res) => {
  const { prompt, currentComponents, activeComponentId, globalStyles } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // simplify context to reduce token usage
  const componentContext = currentComponents.map(c => ({
    id: c.id,
    type: c.type,
    content: c.content
  }));

  const systemPrompt = `
  You are an AI web design assistant. Your goal is to help the user modify their website by generating a structured JSON command.
  
  The user will provide a request and the current state of the components.
  You must return ONLY a JSON object (no markdown formatting) representing the action to take.
  
  Available Actions:
  
  1. Add Component:
  {
    "action": "add_component",
    "type": "hero" | "features" | "about" | "contact" | "gallery" | "testimonials" | "heading" | "text" | "image" | "button",
    "reason": "Explanation of why you added this."
  }
  
  2. Update Component Content/Style:
  {
    "action": "update_component",
    "targetId": "component_id" (use the actual ID from context, or "active" if user refers to selected item),
    "updates": { ...properties to merge into content... },
    "reason": "Explanation."
  }
  
  3. Remove Component:
  {
    "action": "remove_component",
    "targetId": "component_id" (or "active"),
    "reason": "Explanation."
  }
  
  4. Update Global Style (for background color, font, etc.):
  {
    "action": "update_global_style",
    "updates": { "backgroundColor": "#hex", "fontFamily": "font_name" },
    "reason": "Explanation."
  }

  5. General Advice/Chat (if no action is needed or possible):
  {
    "action": "chat",
    "message": "Your response to the user."
  }
  
  Current Components: ${JSON.stringify(componentContext)}
  Current Global Styles: ${JSON.stringify(globalStyles || {})}
  Active Component ID: ${activeComponentId || "none"}
  
  User Request: "${prompt}"
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown code blocks if present
    text = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    const command = JSON.parse(text);

    res.json(command);
  } catch (error) {
    console.error("Gemini Editor Action Error:", error);
    res.status(500).json({
      error: error.message || "Error generating editor action",
      details: error.toString()
    });
  }
});

// Define a route for AI Icon Generation (Freepik)
app.post("/api/generate-icon", async (req, res) => {
  const prompt = req.body && typeof req.body === "object" ? req.body.prompt : undefined;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const apiKey = String(process.env.FREEPIK_API_KEY || "").trim();
  if (!apiKey || apiKey === "YOUR_FREEPIK_API_KEY_HERE") {
    console.warn("FREEPIK_API_KEY not set; /api/generate-icon is disabled.");
    return res.status(503).json({
      error: "FREEPIK_API_KEY_missing",
      message:
        "FREEPIK_API_KEY is not configured. Add a valid Freepik API key to backend/.env and restart the backend.",
    });
  }

  try {
    const response = await fetch("https://api.freepik.com/v1/ai/text-to-icon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        webhook_url: "https://example.com/webhook",
        style: "color",
        format: "png",
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let errorData = null;
      try {
        errorData = JSON.parse(bodyText);
      } catch {
        errorData = null;
      }
      console.error(
        "Freepik API Error Details:",
        errorData ? JSON.stringify(errorData, null, 2) : bodyText,
      );
      const message =
        errorData?.message ||
        errorData?.error?.message ||
        `Freepik request failed (${response.status})`;
      return res.status(502).json({
        error: "freepik_request_failed",
        message,
        status: response.status,
      });
    }

    const initData = await response.json();

    // If we get a direct image (unlikely given the webhook req), return it.
    if (initData.data && initData.data.generated && initData.data.generated.length > 0) {
      return res.json(initData);
    }

    // Otherwise, handle async task polling
    const taskId = initData.data && initData.data.task_id;
    if (!taskId) {
      console.error("Unexpected Freepik Response:", initData);
      // Fallback: maybe it returned what we wanted in a different format?
      if (initData.data && initData.data[0] && initData.data[0].url) return res.json(initData);
      throw new Error("No task_id received from Freepik API");
    }

    // Polling loop
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s timeout
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      await delay(2000);
      attempts++;

      const statusResponse = await fetch(`https://api.freepik.com/v1/ai/text-to-icon/${taskId}`, {
        method: "GET",
        headers: { "x-freepik-api-key": apiKey }
      });

      if (!statusResponse.ok) {
        const err = await statusResponse.json();
        throw new Error(`Polling failed (${statusResponse.status}): ` + (err.message || JSON.stringify(err)));
      }

      const statusData = await statusResponse.json();
      // Check status. Freepik usually returns { data: { status: "COMPLETED", generated: [...] } }
      const status = statusData.data ? statusData.data.status : statusData.status;

      if (status === "COMPLETED") {
        return res.json(statusData);
      } else if (status === "FAILED") {
        throw new Error("Icon generation task failed.");
      }
      // If IN_PROGRESS or PENDING, continue loop
    }

    throw new Error("Icon generation timed out.");

  } catch (error) {
    console.error("Freepik API Error:", error);
    res.status(500).json({ error: "icon_generation_failed", message: error.message || String(error) });
  }
});

function envHealthCheck() {
  const required = [
    { name: "GEMINI_API_KEY", disallow: ["YOUR_GEMINI_API_KEY_HERE"] },
    { name: "FREEPIK_API_KEY", disallow: ["YOUR_FREEPIK_API_KEY_HERE"] },
  ];

  const missing = [];
  for (const r of required) {
    const value = String(process.env[r.name] || "").trim();
    if (!value) {
      missing.push(r.name);
      continue;
    }
    if (r.disallow && r.disallow.includes(value)) {
      missing.push(r.name);
    }
  }

  if (missing.length > 0) {
    const red = "\x1b[31m";
    const reset = "\x1b[0m";
    for (const key of missing) {
      console.error(
        `${red}[ENV] Missing required environment variable: ${key}${reset}`,
      );
    }
    process.exit(1);
  }
}

// Start the server
envHealthCheck();
app.listen(port, () => {
  const freepikSet = Boolean(String(process.env.FREEPIK_API_KEY || "").trim() && process.env.FREEPIK_API_KEY !== "YOUR_FREEPIK_API_KEY_HERE");
  console.log(`Server is running on http://localhost:${port}`);
  if (!freepikSet) console.warn("FREEPIK_API_KEY is missing or placeholder; /api/generate-icon will return 503.");
});
