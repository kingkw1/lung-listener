### **Title**
The Lung Listener

### **Subtitle**
Vibe Coding a Digital Pulmonologist with Gemini 3 Pro

### **Submission Track**
Overall Track

#### **Motivation**
Respiratory disease is the third leading cause of death worldwide, yet primary diagnosis still relies on a 200-year-old technology: the analog stethoscope. In telehealth, this problem is magnified. Doctors cannot "hear" a patient over a standard video call, and even when they have digital audio, the interpretation is incredibly subjective. One doctor's "crackle" is another's "artifact."

Existing AI tools often focus on simple transcription or black-box classification. I wanted to build something different: a **Research Instrument**. I didn't just want an app that says "Pneumonia: Yes/No." I wanted a tool that empowers the clinician to *see* the sound, *understand* the AI's reasoning, and *interact* with the signal directly.

#### **Solution Approach**
"The Lung Listener" is a "Glass Box" diagnostic tool built entirely using the **Gemini 3 Pro Vibe Coding** workflow in Google AI Studio. It leverages Gemini's **Native Multimodality** to bypass text transcription entirely, allowing the model to "hear" the raw texture of the lung sounds directly from the audio buffer.

The app solves three critical problems in the clinical workflow:
1.  **Subjectivity:** It replaces "I think I hear a crackle" with a visual Spectrogram and precise timestamps.
2.  **Precision:** It refines broad, messy human labels (often spanning entire breaths) into precise (<2s) diagnostic events.
3.  **Signal Isolation:** It doesn't just diagnose; it acts. Gemini generates custom Python filters (High-pass/Band-pass) in real-time to scrub artifacts (heartbeats, friction) and isolate the pathology.

#### **Development Process**
This entire application was "Vibe Coded" in Google AI Studio in under 5 days. The process was a radical departure from traditional engineering. Instead of writing boilerplate, I prompted a "Clinical Research Station" into existence.

**Key Challenges & Solutions:**

* **Native Audio Ingestion:**
    The biggest technical hurdle was bypassing the standard "Speech-to-Text" pipeline. Most LLM wrappers assume audio is speech. I had to implement a custom pipeline that feeds the **Raw Audio Buffer** directly to Gemini 3 Pro (`gemini-3-pro-preview`), treating the respiratory sounds as a unique language. This allows the model to differentiate between the "musical" quality of a wheeze and the "percussive" quality of a crackle.

* **The "Messy Label" Problem:**
    The ICBHI dataset (the gold standard for lung sounds) is notorious for having broad, imprecise labels that span multiple breath cycles. Initially, this confused the model.
    * *Solution:* I implemented a "Ground Truth" visualization layer (Red and Yellow Swimlanes) that overlays the human labels on the spectrogram. This reveals the discrepancy instantly, allowing Gemini (Purple Swimlanes) to demonstrate its superior precision by pinpointing the exact millisecond of the anomaly inside the broad human label.

* **Real-Time Signal Filtering:**
    I wanted the AI to do more than just observe. I wanted it to *fix* the audio.
    * *Solution:* I prompted Gemini to act as a "DSP Engineer." When it detects a noisy signal, it doesn't just complain; it writes a custom Python function (using `scipy`) to filter it. The app then visualizes this filter configuration (JSON) and allows the user to toggle between the "Raw" and "Clean" audio instantly.

* **Scientific Visualization:**
    Telehealth tools often look like toys. To build trust with clinicians, I utilized `wavesurfer.js` to render medical-grade Mel-spectrograms. The "Dark Mode" aesthetic wasn't just a style choice; it was prompted to mimic high-end radiology workstations (PACS), reducing eye strain for researchers.

* **The "Zero-Setup" Distribution Challenge:** 
    Since Google AI Studio previews are sandboxed, I couldn't easily bundle large local audio files for the demo. I didn't want judges to have to download/upload files manually. To solve this, I turned my GitHub repository into a CDN. I "vibe coded" a custom loadRemoteCase() fetcher that streams raw .wav buffers directly from GitHub raw.githubusercontent.com. This enabled the "Reference Case Library" feature, allowing judges to test the app instantly with one click, bypassing the sandbox limitations.

#### **Tech Stack**
* **AI Model:** Gemini 3 Pro Preview (`gemini-3-pro-preview`)
* **Platform:** Google AI Studio (Vibe Coding)
* **Frontend:** React, Tailwind CSS, Lucide React
* **Audio Processing:** Web Audio API, WaveSurfer.js
* **Data:** [ICBHI 2017 Respiratory Sound Database](https://www.kaggle.com/datasets/vbookshelf/respiratory-sound-database)

#### **Note to Judges: How to Test**
The app is designed for **zero-setup testing**. You can simply open the AI Studio link and click **"Run"**—it utilizes the platform's free tier for immediate analysis.
* **Backup Plan:** If you encounter a `429 Resource Exhausted` error (due to shared quota limits), please add your own paid API Key using the key shaped button at the top right of AI Studio, or by setting the API_KEY environment variable if running locally.
* **Data:** The built-in "Reference Cases" library allows you to test the app instantly with pre-loaded clinical data, no external downloads required. Reference cases were selected from the ICBHI 2017 Respiratory Sound Database. 

#### **Future Roadmap**
* **Edge Deployment:** Porting the filtering logic to **Gemini Nano** for offline, on-device analysis in remote clinics without internet.
* **Hardware Integration:** Connecting directly to digital stethoscopes (e.g., Littmann Core) via Web Bluetooth API.
* **Longitudinal Tracking:** Building a patient history timeline to track disease progression over weeks rather than single visits.
* **Clinical RLHF Loop:** Implementing a "Human-in-the-Loop" feedback system where pulmonologists can correct Gemini's timestamps, creating a dataset to fine-tune the model for specific rare pathologies.
---

### **Project Links**

* **Public AI Studio App:** https://ai.studio/apps/drive/1mwEeTs57pYeME4xJuWNaXOxVR9NWiQpR
* **Public Code Repository:** https://github.com/kingkw1/lung-listener
* **YouTube Link:** https://www.youtube.com/watch?v=DeplSlKUGN4

---

### **Files**
*(Upload these directly to the "Files" section)*
1.  `PLAN.MD` (Shows your thought process)
2.  `SCRIPT.MD` (Optional, but shows professionalism)
3.  `Project Logo.png` (The one you generated)

### **Card and Thumbnail Image**
* **Image:** Use a high-quality screenshot of the **"Split Screen" view (Shot 8)**.
    * *Why:* It shows the Spectrogram + Yellow Human Label + Purple AI Label. This single image tells the entire story: "AI correcting Human Error."
