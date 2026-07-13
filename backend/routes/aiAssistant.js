const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const { generateText } = require("../utils/aiProvider");

// Local rule-based chatbot query matcher
const fallbackChatSolver = (message, listings) => {
  const query = message.toLowerCase();
  let matchedListings = [];

  // Match keyword constraints
  if (query.includes("goa")) {
    matchedListings = listings.filter(l => l.location?.toLowerCase().includes("goa") || l.title?.toLowerCase().includes("goa"));
  } else if (query.includes("mumbai")) {
    matchedListings = listings.filter(l => l.location?.toLowerCase().includes("mumbai") || l.title?.toLowerCase().includes("mumbai"));
  } else if (query.includes("pool")) {
    matchedListings = listings.filter(l => l.description?.toLowerCase().includes("pool") || l.title?.toLowerCase().includes("pool"));
  } else if (query.includes("budget") || query.includes("cheap") || query.includes("under")) {
    // Find stays under ₹6,000 or the lowest price
    matchedListings = listings.filter(l => l.price <= 6000).sort((a, b) => a.price - b.price);
  } else if (query.includes("luxury") || query.includes("expensive")) {
    matchedListings = listings.sort((a, b) => b.price - a.price).slice(0, 3);
  } else if (query.includes("family") || query.includes("kid")) {
    matchedListings = listings.filter(l => l.description?.toLowerCase().includes("family") || l.description?.toLowerCase().includes("spacious"));
  } else if (query.includes("pet") || query.includes("dog")) {
    matchedListings = listings.filter(l => l.description?.toLowerCase().includes("pet") || l.description?.toLowerCase().includes("garden"));
  } else {
    // Return a random selection of 3 properties
    matchedListings = listings.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  if (matchedListings.length > 0) {
    const listDescriptions = matchedListings.slice(0, 3).map(l => 
      `- **[${l.title}](file:///listings/${l._id})** in *${l.location}* (₹${l.price?.toLocaleString()}/night).`
    ).join("\n");

    return `I found some wonderful stays matching your request:\n\n${listDescriptions}\n\nWould you like me to help compare their amenities or calculate the total booking cost for your travel dates?`;
  }

  return `I'm your personal TravelNest assistant. I can search our catalog, compare prices, or help locate stays near you. Try asking about "stays under ₹6000" or "properties near Goa"!`;
};

// POST /api/ai/assistant/chat
router.post(
  "/chat",
  wrapAsync(async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "User message is empty." });
    }

    // 1. Fetch current listings from database to inject into context
    const listings = await Listing.find().select("title price location country description");
    
    // Create compact listings metadata block for LLM prompt context injection
    const listingsSummary = listings.map(l => ({
      id: l._id,
      title: l.title,
      price: l.price,
      location: `${l.location}, ${l.country}`,
      description: l.description ? l.description.substring(0, 90) + "..." : ""
    }));

    const systemInstruction = `You are a helpful, professional, and friendly travel consultant chatbot for "TravelNest" (a MERN vacation stays platform like Airbnb).
You have real-time access to the listings catalog. Answer traveler queries conversational-style using Markdown.
If they ask for suggestions, stays under a price, or stays in specific cities, suggest options matching this listings inventory array:
${JSON.stringify(listingsSummary.slice(0, 15))}

If a listing matches, refer to it using markdown link format: [Stay Name](file:///listings/STAY_ID) so that travelers can click to open.
Keep chat history context in mind. Keep replies concise, warm, and helpful (max 150 words).`;

    // Format chat history
    const historyBlock = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join("\n");
    const fullPrompt = historyBlock ? `${historyBlock}\nUser: ${message}` : message;

    const botResponse = await generateText(fullPrompt, systemInstruction);

    if (botResponse) {
      console.log(`[CHAT ASSISTANT SUCCESS] Replied to query: "${message.substring(0, 30)}..." via LLM`);
      return res.json({ success: true, reply: botResponse });
    }

    // Solve using rules engine if keys are missing
    console.log(`[CHAT ASSISTANT] Resolving query offline via rules engine`);
    const ruleReply = fallbackChatSolver(message, listings);
    res.json({ success: true, reply: ruleReply });
  })
);

module.exports = router;
