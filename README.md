<div align="center">
  <img src="./public/Project Logo.png" alt="The Lung Listener Logo" width="120" />
  <h1>The Lung Listener</h1>
  <h3>Vibe Coding a Digital Pulmonologist with Gemini 3 Pro</h3>

  <p>
    <a href="https://aistudio.google.com/apps/drive/1mwEeTs57pYeME4xJuWNaXOxVR9NWiQpR?fullscreenApplet=true&showPreview=true&showAssistant=true">
      <img src="https://img.shields.io/badge/Try_App-Google_AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Try in AI Studio" />
    </a>
    <a href="https://www.youtube.com/watch?v=DeplSlKUGN4">
      <img src="https://img.shields.io/badge/Watch_Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Video" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Built%20with-Gemini%203%20Pro-8E44AD?style=for-the-badge&logo=google-gemini" alt="Built with Gemini" />
    <img src="https://img.shields.io/badge/License-Apache%202.0-green?style=for-the-badge" alt="License" />
  </p>
</div>

---

## 🫁 Overview

**The Lung Listener** is a bio-acoustic research instrument designed to turn subjective lung sounds into objective, actionable data. 

Respiratory disease is the 3rd leading cause of death worldwide, yet diagnosis often relies on the subjective human ear. This tool uses **Gemini 3 Pro’s native multimodality** to "hear" raw clinical audio buffers, visualize pathologies, and generate custom DSP filters to isolate signals from noise.

> **Note to Judges:** This project was "Vibe Coded" in Google AI Studio in under 5 days, utilizing the Gemini 3 Pro Preview model for native audio reasoning.

---

## 🔬 Key Features

### 1. Native Audio Analysis (No Transcription)
Unlike traditional wrappers that convert audio to text, The Lung Listener pipes the **Raw Audio Buffer** directly into `gemini-3-pro-preview`. This allows the model to detect non-speech textures like the "musicality" of a wheeze or the "percussive" nature of a crackle.

### 2. "Glass Box" Visualization
* **Real-time Mel-Spectrograms:** Powered by `wavesurfer.js` to visualize frequency intensity.
* **Ground Truth Overlay:** Displays human annotations (Yellow) vs. AI Predictions (Purple) to demonstrate precision.
* **Zoom & Isolate:** Users can inspect specific milliseconds of a breath cycle.

### 3. Actionable Filter Generation
The AI doesn't just diagnose; it acts. When noise is detected, Gemini generates **custom Python code** (High-pass/Band-pass filters) to clean the audio. The app visualizes this configuration and allows users to "Solo" the raw vs. filtered signal.

### 4. Reference Case Library
Includes a cloud-fetched library of "Gold Standard" cases (Pneumonia, COPD, Healthy) from the ICBHI dataset, allowing for instant testing without file downloads.

---

## 🛠️ Tech Stack

* **Model:** `gemini-3-pro-preview` (Native Multimodality)
* **Platform:** Google AI Studio (Vibe Coding Workflow)
* **Frontend:** React 18, Vite, TypeScript
* **Styling:** Tailwind CSS ("Clinical Dark Mode" aesthetic)
* **Audio Engine:** Web Audio API, `wavesurfer.js`
* **SDK:** Google Generative AI SDK for Web

---

## 🚀 How to Run (Judge Instructions)

**Prerequisite:** You need a Google Gemini API Key.

1.  **Fork & Clone**
    ```bash
    git clone [https://github.com/kingkw1/lung-listener.git](https://github.com/kingkw1/lung-listener.git)
    cd lung-listener
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    * Create a file named `.env.local` in the root directory.
    * Add your key:
        ```env
        VITE_GEMINI_API_KEY=your_actual_api_key_here
        ```
    * *(Note: The app requires a valid key to perform Deep Analysis)*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    * Open `http://localhost:5173` (or the port shown in terminal).

---

## 📂 Project Structure

```text
├── components/          # Core React UI components
│   ├── AudioPlayer.tsx
│   ├── CenterStage.tsx
│   ├── DebugLog.tsx
│   ├── ...
├── docs/                # Project documentation and planning
├── submission_materials/# Hackathon submission assets
├── App.tsx              # Main application entry point
├── index.html           # HTML entry point
├── index.tsx            # React DOM rendering
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── types.ts             # Shared TypeScript interfaces
└── vite.config.ts       # Vite build configuration
```

## 📚 Data Source
This project utilizes data from the **ICBHI 2017 Respiratory Sound Database** (International Conference on Biomedical and Health Informatics).

## 📄 License
This project is licensed under the **Apache 2.0 License** - see the [LICENSE](LICENSE) file for details.