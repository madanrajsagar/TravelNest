const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");

// Smart local coordinates-based weather generator (fallback when key is missing)
const generateMockWeather = (lat, lng) => {
  const currentMonth = new Date().getMonth(); // 0 - 11
  
  // Basic temperature model: closer to equator (lat near 0) is hotter.
  // India is roughly between 8 and 37 degrees latitude.
  const absLat = Math.abs(parseFloat(lat) || 15);
  let baseTemp = 32 - (absLat * 0.3); // warmer closer to south

  // Monthly temperature curves
  const seasonalOffset = Math.sin((currentMonth / 11) * Math.PI * 2) * 5;
  const temp = Math.round(baseTemp + seasonalOffset);
  const feelsLike = Math.round(temp + (Math.random() * 2));
  const humidity = Math.round(50 + (Math.random() * 30));
  const windSpeed = (4 + Math.random() * 6).toFixed(1);

  // Weather conditions based on month (monsoon months: June-Sept)
  let condition = "Sunny";
  let description = "clear sky";
  
  if (currentMonth >= 5 && currentMonth <= 8) {
    condition = "Rainy";
    description = "moderate tropical rain shower";
  } else if (currentMonth === 10 || currentMonth === 11 || currentMonth === 0) {
    condition = "Cool";
    description = "misty cool morning";
  } else {
    condition = "Partly Cloudy";
    description = "scattered light clouds";
  }

  // Generate 5-day forecast
  const forecast = [];
  for (let i = 1; i <= 5; i++) {
    const dayTemp = temp + Math.round((Math.random() - 0.5) * 4);
    forecast.push({
      day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short' }),
      temp: dayTemp,
      condition: Math.random() > 0.45 ? condition : "Clear"
    });
  }

  const bestTimeToVisit = absLat < 15 ? "October to March" : "November to February";

  return {
    temp,
    condition,
    description,
    feelsLike,
    humidity,
    windSpeed,
    sunrise: "06:12 AM",
    sunset: "06:48 PM",
    forecast,
    bestTimeToVisit
  };
};

// Smart coordinates-shifted places generator
const generateMockNearby = (lat, lng) => {
  const categories = [
    { type: "Restaurant", icon: "🍽️", names: ["Taverna Grill", "Spicy Local Bites", "Coconut Tree Restaurant", "Royal Mughal Dine"] },
    { type: "Cafe", icon: "☕", names: ["Traveler's Corner Cafe", "Coffee Day Bistro", "Organic Roast Cafe", "Sunset Espresso Cafe"] },
    { type: "Hospital", icon: "🏥", names: ["City Lifeline Hospital", "Primary Health Clinic", "Care & Cure Clinic"] },
    { type: "Pharmacy", icon: "💊", names: ["Apollo Medicine Desk", "National Drug Pharmacy", "Wellness Medicals"] },
    { type: "ATM", icon: "🏧", names: ["State Bank ATM", "HDFC Cash Point", "ICICI Cash Box"] },
    { type: "Fuel Station", icon: "⛽", names: ["Indian Petrol Pump", "HP Fuel Depot", "Reliance Gas Outlet"] },
    { type: "Grocery Store", icon: "🛒", names: ["SuperMart Grocery", "Fresh Farm Veggies", "Daily Convenience Store"] },
    { type: "Entertainment", icon: "🎬", names: ["Cinemax Multiplex", "Sunset Beach Club", "Central Arcade Park"] },
    { type: "Tourist Attraction", icon: "🏖️", names: ["Scenic View Point", "Historic Fort Ruins", "Sandy Beach Bay", "Heritage Lake Garden"] },
    { type: "Railway Station", icon: "🚉", names: ["Central Terminal Station", "Junction Railway Hub"] },
    { type: "Airport", icon: "✈️", names: ["International Airport Hub", "Domestic Air Strip"] },
    { type: "Bus Stop", icon: "🚌", names: ["City Central Bus Stop", "Highway Junction Stand"] }
  ];

  const places = [];

  categories.forEach((cat) => {
    // Generate 1-2 places per category
    const count = Math.random() > 0.3 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const name = cat.names[Math.floor(Math.random() * cat.names.length)];
      // Random shift coordinates slightly to get real relative distances
      const dLat = (Math.random() - 0.5) * 0.015;
      const dLng = (Math.random() - 0.5) * 0.015;
      const distanceVal = parseFloat((0.2 + Math.random() * 2.8).toFixed(1)); // 0.2 to 3 km
      const rating = (4.0 + Math.random() * 0.9).toFixed(1);

      places.push({
        name: `${name} ${count > 1 && i === 1 ? 'II' : ''}`.trim(),
        category: cat.type,
        icon: cat.icon,
        lat: parseFloat(lat) + dLat,
        lng: parseFloat(lng) + dLng,
        distance: `${distanceVal} km`,
        travelTime: `${Math.round(distanceVal * 4 + 2)} mins`,
        rating,
        isOpen: Math.random() > 0.15
      });
    }
  });

  return places;
};

// GET /api/services/weather/:lat/:lng
router.get(
  "/weather/:lat/:lng",
  wrapAsync(async (req, res) => {
    const { lat, lng } = req.params;
    const key = process.env.OPENWEATHERMAP_API_KEY;

    if (key) {
      try {
        console.log(`[WEATHER SERVICE] Fetching live weather data from OpenWeather for: [${lat}, ${lng}]`);
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${key}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.main) {
          // Fetch forecast as well
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${key}`;
          const forecastRes = await fetch(forecastUrl);
          const forecastData = await forecastRes.json();

          const forecastList = [];
          if (forecastData.list) {
            // Group by day to get 5 forecasts
            const processedDays = new Set();
            forecastData.list.forEach((item) => {
              const dayName = new Date(item.dt * 1000).toLocaleDateString('en-IN', { weekday: 'short' });
              const today = new Date().toLocaleDateString('en-IN', { weekday: 'short' });
              if (dayName !== today && !processedDays.has(dayName) && processedDays.size < 5) {
                processedDays.add(dayName);
                forecastList.push({
                  day: dayName,
                  temp: Math.round(item.main.temp),
                  condition: item.weather[0].main
                });
              }
            });
          }

          return res.json({
            success: true,
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            forecast: forecastList.length > 0 ? forecastList : generateMockWeather(lat, lng).forecast,
            bestTimeToVisit: "November to March"
          });
        }
      } catch (err) {
        console.error("[WEATHER SERVICE ERROR] Live weather query failed. Using fallback.", err);
      }
    }

    // Fallback generator response
    const mockWeather = generateMockWeather(lat, lng);
    res.json({ success: true, ...mockWeather });
  })
);

// GET /api/services/nearby/:lat/:lng
router.get(
  "/nearby/:lat/:lng",
  wrapAsync(async (req, res) => {
    const { lat, lng } = req.params;
    console.log(`[TRAVEL SERVICE] Generating nearby places for coordinate: [${lat}, ${lng}]`);
    const nearbyPlaces = generateMockNearby(lat, lng);
    res.json({ success: true, places: nearbyPlaces });
  })
);

module.exports = router;
