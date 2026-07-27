# 🍳 Receipt-to-Plate: Zero-Waste AI Smart Pantry

An intelligent, full-stack Next.js web application designed to reduce household food waste. **Receipt-to-Plate** allows users to scan paper grocery receipts or manually input items into a virtual pantry equipped with shelf-life tracking, color-coded freshness badges, and an AI-powered zero-waste recipe generator.

---

## ✨ Features

- 📸 **AI Receipt Scanning (OCR):** Upload image receipts (JPG/PNG). Powered by Google Gemini Vision AI to instantly parse item names and estimate expiration shelf life.
- ✍️ **Manual Pantry Input:** Type in bulk items (comma-separated or single entry) with fallback parsing logic.
- 🥗 **Interactive Virtual Pantry:**
  - Real-time search and expiration urgency filtering (*Expiring Soon* vs. *Fresh*).
  - Color-coded badges indicating estimated days remaining.
  - Client-side persistence via `localStorage`.
- 🤖 **Zero-Waste Recipe Engine:** Generates custom recipes based exclusively on available pantry ingredients to minimize waste.
- 📋 **One-Click Recipe Export:** Copy full recipe steps and ingredients formatted for text messages or notes.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI Integration:** Google Gemini API (`gemini-2.5-flash` / Gemini Vision)
- **Deployment:** Vercel

---

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- Google Gemini API Key ([Get an API key here](https://aistudio.google.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/mahnoory41-dotcom/receipt-to-plate.git](https://github.com/mahnoory41-dotcom/receipt-to-plate.git)
   cd receipt-to-plate
   Install dependencies:

Bash
npm install
Set up Environment Variables:
Create a .env.local file in the root directory and add your Gemini API key:

Code snippet
GEMINI_API_KEY=your_actual_gemini_api_key_here
Run the development server:

Bash
npm run dev
Open in browser:
Navigate to http://localhost:3000 to view the app.

📁 Project Structure
Plaintext
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/    # Gemini Receipt OCR & Text Parsing Route
│   │   │   └── recipes/    # Gemini AI Recipe Generation Route
│   │   ├── layout.tsx     # Application Root Layout
│   │   └── page.tsx       # Main Entry Page
│   └── components/
│       └── Dashboard.tsx  # Core Pantry & Recipe UI Component
├── public/                # Static assets
├── .env.local             # API keys (Git-ignored)
├── package.json           # Project dependencies
└── README.md              # Documentation
🔒 Security & Privacy
This project strictly ignores .env.local via .gitignore to prevent secret API key exposure. When deploying to production platforms like Vercel, store the API key as an Environment Variable (GEMINI_API_KEY).

📄 License
This project is created for educational purposes as part of an assignment submission.
