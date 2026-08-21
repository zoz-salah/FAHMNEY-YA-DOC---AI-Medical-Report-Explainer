# 🩺 AI Medical Report Explainer

An AI-powered full-stack web application that helps users understand complex medical reports by transforming medical PDFs into clear, structured, plain-language explanations.

The project combines document processing, OCR, and GPT-powered analysis to make medical information easier to understand while maintaining a clean and user-friendly experience.

> **Note:** This project was developed independently with a little assistance from **Replit AI** IN FRONTEND &  BACKEND during the development process.

## 🎥 Project Demo
<img width="1572" height="1573" alt="image" src="https://github.com/user-attachments/assets/ec8553b5-68a7-4ca3-8dae-c2e63499a2f6" />
[![Watch the video](https://drive.google.com/file/d/1jRxc1YdpxhlU3vls0WtHvRHb7bo7swHQ/view?usp=sharing))


## 🚀 Features

* 📄 Upload and process medical PDF reports
* 🔍 OCR-based text extraction from medical documents
* 🤖 AI-powered analysis using OpenAI GPT-4o
* 🧠 Converts complex medical terminology into easy-to-understand explanations
* 📋 Returns structured medical report guides
* ⚡ Fast end-to-end processing pipeline
* 📥 Export generated explanations as PDF files
* ✨ Smooth animations and modern UI
* 📱 Responsive interface for different screen sizes

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Framer Motion
* Radix UI

### Backend

* Node.js
* Express.js

### AI & Document Processing

* OpenAI GPT-4o
* OCR
* Medical PDF processing

### Utilities

* jsPDF

## 🧩 How It Works

The application follows a full-stack processing pipeline:

```text
Medical PDF
    ↓
PDF Upload
    ↓
OCR / Text Extraction
    ↓
Backend Processing
    ↓
OpenAI GPT-4o
    ↓
Structured Plain-Language Explanation
    ↓
User Interface
    ↓
PDF Export
```

The extracted content is processed by the backend and sent to GPT-4o with structured instructions. The model then transforms the report into an easier-to-understand guide that is presented through the React interface.

## ⚡ Performance

The application is designed to provide a fast user experience, with the processing pipeline targeting responses in **under 3 seconds**, depending on document size, OCR processing, and API response time.

## 🎨 User Experience

The interface focuses on simplicity and accessibility, allowing users to:

1. Upload a medical PDF.
2. Process the document automatically.
3. Receive an AI-generated explanation.
4. Read the information through a structured interface.
5. Export the explanation as a PDF.

## ⚠️ Medical Disclaimer

This application is designed for **educational and informational purposes only**.

It does not provide medical diagnoses, replace professional medical advice, or recommend treatments. Users should always consult a qualified healthcare professional when interpreting medical reports or making medical decisions.

## 🤝 Development

This project was primarily developed independently, with a **little assistance from Replit AI** for development support, debugging, and implementation guidance.

The project demonstrates my experience with:

* Full-stack web development
* AI/LLM integration
* OCR and document processing
* API development
* React and TypeScript
* Modern UI development
* AI-powered product development
 ## TO RUN
Prerequisites

* Node.js (v20 or later)
* pnpm — install with npm install -g pnpm
* PostgreSQL running locally

Steps

Download the code — click the three-dot menu choose "Download as zip"

Install dependencies — open a terminal in the project folder and run:

pnpm install

Set up environment variables — create a .env file in the root with:

DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/fahmney
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-key-here
SESSION_SECRET=any-random-string

You'll need your own OpenAI API key from OpenAI's website.

Push the database schema:

pnpm --filter @workspace/db run push

Run the backend (in one terminal):

pnpm --filter @workspace/api-server run dev

Run the frontend (in a second terminal):

pnpm --filter @workspace/fahmney-ya-doctor run dev

Open your browser at http://localhost:20008


## 👨‍💻 Author

**Zoz Salah**

Computer Science Student | AI & Machine Learning | Content Creator

---

⭐ If you find this project interesting, feel free to explore the code and share your feedback.
