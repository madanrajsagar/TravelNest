const groqCall = async (prompt) => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.warn("[GROQ KEY ERROR] Response structure invalid:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Groq invocation failed:", err);
  }
  return null;
};

const geminiCall = async (prompt) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      console.warn("[GEMINI KEY ERROR] Response structure invalid:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Gemini invocation failed:", err);
  }
  return null;
};

const openaiCall = async (prompt) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.warn("[OPENAI KEY ERROR] Response structure invalid:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("OpenAI invocation failed:", err);
  }
  return null;
};

const localLlamaCall = async (prompt) => {
  const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  try {
    const response = await fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3",
        prompt: prompt,
        stream: false
      })
    });
    const data = await response.json();
    if (data.response) {
      return data.response.trim();
    }
  } catch (err) {
    // Slient fail, do not block logs
  }
  return null;
};

// Unified Text generation portal
module.exports.generateText = async (prompt, systemInstruction = "") => {
  const fullPrompt = systemInstruction 
    ? `${systemInstruction}\n\nUser Input: ${prompt}` 
    : prompt;

  // 0. Groq Cloud Provider (Priority 1)
  if (process.env.GROQ_API_KEY) {
    const groqText = await groqCall(fullPrompt);
    if (groqText) return groqText;
  }

  // 1. Google Gemini Provider
  if (process.env.GEMINI_API_KEY) {
    const geminiText = await geminiCall(fullPrompt);
    if (geminiText) return geminiText;
  }

  // 2. OpenAI GPT Provider
  if (process.env.OPENAI_API_KEY) {
    const openaiText = await openaiCall(fullPrompt);
    if (openaiText) return openaiText;
  }

  // 3. Local Ollama LLM Provider (e.g. Ollama/Llama)
  if (process.env.USE_OLLAMA === "true") {
    const ollamaText = await localLlamaCall(fullPrompt);
    if (ollamaText) return ollamaText;
  }

  return null;
};

module.exports.analyzeImage = async (imageBuffer, mimeType) => {
  const base64Data = imageBuffer.toString("base64");
  const systemPrompt = `You are an interior design and architecture AI analyzer.
Analyze the image and respond ONLY with a raw JSON object (no markdown formatting like \`\`\`json):
{
  "style": "Rustic" | "Modern" | "Luxury" | "Minimalist" | "Heritage" | "Coastal",
  "propertyType": "Villa" | "Cabin" | "Apartment" | "Room" | "Castle" | "Hotel",
  "dominantColors": ["color1", "color2"],
  "amenities": ["pool", "kitchen", "wifi", "beach", "fireplace", "mountain view", "balcony"],
  "keywords": ["wood", "glass", "cozy", "bright", "forest", "nature"]
}`;

  // 1. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("Invoking Gemini multimodal API for image search analysis...");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }]
        })
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]) {
        let text = data.candidates[0].content.parts[0].text.trim();
        if (text.includes("```json")) {
          text = text.split("```json")[1].split("```")[0].trim();
        } else if (text.includes("```")) {
          text = text.split("```")[1].split("```")[0].trim();
        }
        return JSON.parse(text);
      }
    } catch (e) {
      console.error("Gemini image analysis failed:", e.message);
    }
  }

  // 2. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("Invoking OpenAI Vision API for image search analysis...");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{
            role: "user",
            content: [
              { type: "text", text: systemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${base64Data}`
                }
              }
            ]
          }]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        let text = data.choices[0].message.content.trim();
        return JSON.parse(text);
      }
    } catch (e) {
      console.error("OpenAI image analysis failed:", e.message);
    }
  }

  // 3. Fallback
  console.log("Using local mock fallback for image search analysis...");
  return {
    style: "Modern",
    propertyType: "Villa",
    dominantColors: ["White", "Brown"],
    amenities: ["kitchen", "wifi", "balcony"],
    keywords: ["modern", "bright", "spacious"]
  };
};
