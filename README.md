# MultiRag - Intelligence Across All Your Documents 🚀

MultiRag is a powerful RAG (Retrieval-Augmented Generation) platform that allows users to upload diverse content types—YouTube videos, PDFs, Web articles, and raw text—and have intelligent, context-aware conversations with them.

Featuring a modern, premium interface and a robust dual-backend architecture, MultiRag utilizes state-of-the-art LLMs and vector search to provide accurate answers based on your specific data.

---

## ✨ Key Features

-   **Multi-Source Ingestion**:
    *   **YouTube**: Extract transcripts and metadata from any video.
    *   **PDF**: Intelligent parsing and chunking of document files.
    *   **Web**: Scrape content directly from any URL.
    *   **Text**: Paste raw notes or logs directly.
-   **AI Chat Interface**: Interactive chat with memory, providing streaming responses and source citations.
-   **Hybrid Search**: Combines Dense (Vector) and Sparse (BM25) search for maximum retrieval accuracy.
-   **Audio-to-Text**: Voice-enabled querying using Sarvam AI.
-   **Security & Auth**: Secure user management with Clerk.
-   **Cloud-Native**: Integrated with Qdrant Cloud for vector storage and MongoDB for metadata.

---

## 🛠 Tech Stack

### Frontend
-   **Framework**: React + Vite
-   **Styling**: Tailwind CSS + Shadcn UI
-   **Animations**: Framer Motion + Magic UI
-   **Auth**: Clerk

### Backend (Node.js)
-   **Server**: Express.js
-   **LLM Integration**: Google Gemini (via LangChain)
-   **Vector Database**: Qdrant
-   **Database**: MongoDB (Mongoose)
-   **Voice**: Sarvam AI

### Backend (Python)
-   **Server**: FastAPI
-   **Tools**: YouTube Transcript API, PyTube, Uvicorn

---

## 📁 Project Structure

```text
MultiRag/
├── client/              # React Vite frontend
│   ├── src/
│   │   ├── Pages/       # Dashboard, Chat, and Landings
│   │   ├── components/  # UI components & Magic UI
│   │   └── hooks/       # Custom React hooks
├── Backend/             # Main Node.js API
│   ├── controllers/     # Business logic for Chat, Upload, Delete
│   ├── services/        # Gemini & Retrieval service layers
│   ├── utils/           # Shared utility functions (validation, processing)
│   ├── routes/          # API endpoint definitions
│   └── middleware/      # Auth & Upload (Memory-based)
└── Backend-1/           # Python Microservice
    └── main.py          # YouTube & Transcript processing logic
```

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Python (3.10+)
-   API Keys: Gemini, Clerk, Qdrant Cloud, MongoDB URI, Sarvam AI

### 1. Setup Main Backend (Node.js)
```bash
cd Backend
npm install
# Configure your .env
npm run dev
```

### 2. Setup Python Microservice
```bash
cd Backend-1
# Create and activate venv
python -m venv venv
./venv/Scripts/activate # Windows
pip install -r requirements.txt
# Run the server
uvicorn main:app --reload --port 8000
```

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
SARVAMAI_API_KEY=your_sarvam_key
YT_API_KEY=your_google_youtube_api_key
CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
```

### Client (.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
VITE_API_URL=http://localhost:5000
```

---

## 📝 Deployment Note

The audio-to-text conversion has been optimized for deployment by using **memory storage (RAM)** instead of the local filesystem. This allows the application to run seamlessly on read-only or ephemeral environments like Vercel, AWS Lambda, or Render.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
ISC License
