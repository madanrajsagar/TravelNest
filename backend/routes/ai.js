const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const { generateText } = require("../utils/aiProvider");

// Local rules-based style description builder
const fallbackGenerate = (title, type, location, amenities, price, style) => {
  const introMap = {
    Luxury: `Indulge in a premium holiday experience at ${title}, an exquisite luxury ${type || 'stay'} situated in the highly exclusive coordinates of ${location}.`,
    Budget: `Enjoy a cozy, pocket-friendly stay at ${title}, an affordable and comfortable ${type || 'stay'} located in the practical heart of ${location}.`,
    Family: `Create unforgettable holiday memories at ${title}, a spacious family-friendly ${type || 'stay'} in the welcoming neighborhood of ${location}.`,
    Romantic: `Escape for a dreamy getaway at ${title}, an intimate romantic ${type || 'nest'} nestled in the scenic, peaceful area of ${location}.`,
    Adventure: `Gear up for an exciting trip at ${title}, an adventure-ready ${type || 'base'} situated near hiking routes and local trails in ${location}.`,
    Business: `Stay productive and relaxed at ${title}, a fully-connected business ${type || 'suite'} located in the corporate center of ${location}.`,
    Professional: `Welcome to ${title}, a beautifully designed ${type || 'stay'} offering the perfect balance of local styling and convenience in ${location}.`
  };

  const selectedIntro = introMap[style] || introMap.Professional;

  const amenitiesText = amenities && amenities.length > 0
    ? `Fully equipped with convenient amenities like ${amenities.slice(0, 3).join(", ")}, we have taken care of every detail to ensure absolute convenience.`
    : `Designed with high ceilings, spacious room planning, and abundant lighting, this space guarantees absolute relaxation.`;

  const highlightsMap = {
    Luxury: [`Infinity Pool Views`, `Fine Dining Proximity`, `High-end Fittings`],
    Budget: [`Excellent Location Value`, `Free Fast WiFi`, `Cozy Private Space`],
    Family: [`Child-safe Play Area`, `Spacious Family Kitchen`, `Walkable Gardens`],
    Romantic: [`Sunset Balcony Deck`, `Intimate Candlelight Dining`, `Secluded Privacy`],
    Adventure: [`Gear Storage Available`, `Trail Guides Included`, `Outdoor Firepit`],
    Business: [`Ergonomic Desk Setup`, `Ultra-fast fiber WiFi`, `Keyless Digital Checkin`],
    Professional: [`Modern Workspaces`, `Clean Minimalist Design`, `Quiet Cozy Bedroom`]
  };

  const highlights = highlightsMap[style] || highlightsMap.Professional;

  const description = `${selectedIntro}\n\n${amenitiesText} Offerd at an exceptional rate of ₹${price?.toLocaleString('en-IN') || 'reasonable rates'} per night, this stay is highly rated by travelers worldwide.\n\nEnjoy proximity to key local landmarks, cafes, and transportation coordinates. We look forward to hosting you in this premium TravelNest stay!`;

  return {
    title: `Premium ${style} ${type || 'Stay'} at ${location} - ${title}`,
    description,
    keywords: [style.toLowerCase(), type?.toLowerCase() || 'stay', location?.toLowerCase(), 'travelnest'],
    highlights
  };
};

// POST /api/ai/generate-description
router.post(
  "/generate-description",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { title, type, location, amenities, price, style = "Professional" } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: "Nest title is required for AI generation" });
    }

    const systemPrompt = `You are a professional copywriting AI for TravelNest (a premium stay booking platform like Airbnb). Your task is to generate listing copy. You must respond ONLY with a raw JSON object containing the exact structure below. Do not wrap in markdown boxes (like \`\`\`json). The keys must be:
{
  "title": "SEO-friendly listing title",
  "description": "Engaging Airbnb-style description matching the requested style",
  "keywords": ["array", "of", "4", "keywords"],
  "highlights": ["3", "unique", "selling", "points"]
}`;

    const prompt = `Generate a stay listing copy for:
Nest Name: "${title}"
Property Type: "${type || 'Stay'}"
Location: "${location || 'premium area'}"
Price per night: ₹${price || 'reasonable prices'}
Amenities available: ${amenities && amenities.length > 0 ? amenities.join(", ") : "spacious planning"}
Requested Style: "${style}"

Ensure nearby attractions are mentioned naturally, and unique selling points matching "${style}" are highlighted. Keep the description length under 130 words. Output JSON only.`;

    const aiResponse = await generateText(prompt, systemPrompt);

    if (aiResponse) {
      try {
        // Clean JSON format in case LLM wraps it in markdown blocks
        let cleanJson = aiResponse;
        if (cleanJson.includes("```json")) {
          cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
        } else if (cleanJson.includes("```")) {
          cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
        }

        const data = JSON.parse(cleanJson);
        if (data.title && data.description) {
          console.log(`[AI GENERATOR SUCCESS] Successfully generated styling: "${style}" from LLM`);
          return res.json({
            success: true,
            title: data.title,
            description: data.description,
            keywords: data.keywords || [style.toLowerCase(), 'stay'],
            highlights: data.highlights || ['Premium Stay']
          });
        }
      } catch (err) {
        console.warn("[AI GENERATOR WARNING] Failed to parse generated JSON. Using local fallback.");
      }
    }

    // Rules-based engine fallback
    console.log(`[AI GENERATOR] Invoking offline rules generator for style: "${style}"`);
    const fallbackCopy = fallbackGenerate(title, type, location, amenities, price, style);
    res.json({
      success: true,
      ...fallbackCopy
    });
  })
);

module.exports = router;
