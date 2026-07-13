# 🌍 TravelNest: Premium AI-Powered MERN Travel & Accommodation Platform

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node%20%7C%20Express-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![AI Search](https://img.shields.io/badge/AI%20Assistant-Gemini%20%7C%20Groq%20%7C%20OpenAI-purple?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-ISC-orange.svg)](https://opensource.org/licenses/ISC)

TravelNest is a mature, production-grade, full-stack MERN application inspired by platforms like Airbnb and Booking.com. It is packed with advanced features such as real-time chat, AI assistant, speech-to-text voice filtering, visual property similarity search, interactive vector maps, internationalization (i18n), statistics dashboard analytics, and an automated Super Host rating program.

---

## 🌟 Key Features

### 1. AI-Powered Smart Discovery
*   📷 **Multimodal AI Image Search**: Users can drag-and-drop or upload a listing photo. The backend converts the image and calls Gemini/OpenAI Vision APIs to analyze architecture, style tags, dominant colors, and amenities, matching it against properties in MongoDB ranked by similarity.
*   🎙️ **NLP Voice Search**: Uses browser speech-to-text API (SpeechRecognition) matching English, Hindi, and Marathi inputs to automatically extract cities/filters and redirect to stays.
*   💬 **Listing AI Assistant**: Interactive chat widget next to properties where users can ask questions about amenities, local weather, and check-in details.

### 2. Live Interaction & Real-time Operations
*   💬 **Socket.io Live Chats**: Direct chat channel between travelers and hosts to coordinate check-in times and parking inquiries.
*   🔔 **Real-time Notifications**: Instantly alerts users and hosts about booking confirmations, cancellations, reviews, and admin actions.
*   ⚠️ **Admin Warnings Broadcaster**: Emits warnings and warning toasts to logged-in administrators when listings are reported for violations.

### 3. Location & Maps Explorer
*   🗺️ **Interactive Vector Maps**: Rendered using MapTiler, showing details pins, image popups, and directions buttons.
*   ☕ **Nearby Places Explorer**: Tabbed POI explorer computing cafes, restaurants, ATMs, transit stops, and hospitals using the Haversine formula on properties' geo-coordinates. Calculates travel times (walk/drive) and ratings.

### 4. Advanced Analytics & Dashboards
*   📊 **Custom SVG Analytics**: High-performance, React 19-compatible SVG bar, line, and gauge charts rendering revenue trends, occupancy rate, and reviews without heavy libraries.
*   📈 **Host & Admin Consoles**: Hosts manage calendars (block custom dates), evaluate stays, and view guest details. Admins can moderate reviews, search/filter user lists, ban accounts, and process cascaded deletions.
*   📥 **CSV/PDF Statements**: Download CSV sheets of reservation ledgers or print-friendly PDF Performance Statements.

### 5. Accessibility & Commerce
*   🌐 **Multi-language (i18n)**: One-click language switcher supporting English, हिन्दी (Hindi), and मराठी (Marathi) throughout the entire checkout and search funnel, caching selection in `localStorage`.
*   💳 **Mock Payment Gateway & Billing**: Integrates Razorpay checkout workflow in mock mode, calculating dynamic platform fees, taxes, invoicing, and refund requests.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Lucide React, Tailwind CSS | Single-page responsive layout and icons. |
| **Backend** | Node.js, Express.js, Socket.io, Multer | API endpoints, web sockets, and multipart file handling. |
| **Database** | MongoDB, Mongoose | Cloud Atlas database document modeling and indexes. |
| **Integrations** | Cloudinary | Cloud file repository for property and user avatars. |
| **API services** | Gemini (Flash), OpenAI, Groq, MapTiler | LLM integrations, NLP voice/image analysis, and map assets. |

---

## 📂 Architecture Layout

```
TravelNest/
├── seed/                       # Automated demo database seeding suite
│   ├── images/                 # High-res raw property folders
│   ├── uploadImages.js         # Cloudinary automated batch uploader
│   ├── reset.js                # Database mock data cleaner
│   └── seed.js                 # Master seeder populating ~1400 bookings
│
├── backend/                    # Express + Node Server
│   ├── controllers/            # Logic controllers
│   ├── models/                 # Mongoose database schemas
│   ├── routes/                 # API endpoint routers
│   ├── utils/                  # Mail, DNS, and AI providers
│   └── app.js                  # Main server entrypoint
│
└── frontend/                   # React SPA Client
    ├── src/
    │   ├── components/         # Reusable widgets (Map, Calendars, Chat)
    │   ├── context/            # Auth, Theme, and i18n Context Providers
    │   ├── pages/              # Dashboards, indexes, and forms
    │   └── utils/              # Translations dictionary
```

---

## ⚙️ Installation & Running

### 1. Clone the repository
```bash
git clone https://github.com/madanrajsagar/TravelNest.git
cd TravelNest
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend` directory:
```env
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret

MAPTILER_API_KEY=your_maptiler_key
ATLASDB_URL=mongodb+srv://...your_atlas_connection_string
SECRET=your_session_secret

# Optional API Keys for AI & Weather (defaults active if empty)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
OPENWEATHERMAP_API_KEY=your_weather_key
```

### 3. Install dependencies
```bash
# Install backend modules
cd backend
npm install

# Install frontend modules
cd ../frontend
npm install
```

### 4. Setup professional seed data (Root Directory)
From the workspace root directory, run these commands to set up the data:

```bash
# Upload high-res images to Cloudinary (only runs once)
npm run upload-images

# Reset mock tables (preserves existing permanent profiles)
npm run reset

# Seed the master dataset (120 users, 95 listings, 1400 bookings)
npm run seed
```

### 5. Launch the application
```bash
# From backend directory
npm run dev     # Starts nodemon backend server on port 8080

# From frontend directory
npm run dev     # Starts Vite dev client on http://localhost:5173/
```

---

## 🤝 Contributing
Contributions, suggestions, and feature expansions are welcome! Feel free to open issues or submit PRs.

---

## 📄 License
Licensed under the [ISC License](LICENSE). Developed by [Madanraj Sagar](https://github.com/madanrajsagar).
