### 🗓️ The 5-Day "Vibe Code" Roadmap (4-Hour Sprints)

This roadmap assumes a "high-velocity" schedule to leave Day 5 purely for the video (which is 50% of the grade).

#### **Day 1: The Research Station (Foundation)**

  * **Sprint 1 (08:00 - 12:00): UI Scaffold.**
      * **Goal:** A clean, "Clinical Dark Mode" React dashboard.
      * **Tech:** React, Tailwind CSS, Lucide Icons.
      * **Deliverable:** Sidebar, Main Viz Area, Upload Zone, Audio Player.
  * **Sprint 2 (13:00 - 17:00): Signal Processing Pipeline.**
      * **Goal:** Client-side spectrogram generation (crucial for "Scientific" credibility).
      * **Tech:** Web Audio API or `wavesurfer.js` + `spectrogram.js`.
      * **Deliverable:** User drops `.wav`; App renders waveform and Mel-spectrogram instantly.

#### **Day 2: The Gemini Core (Native Multimodality)**

  * **Sprint 3 (08:00 - 12:00): Audio-Visual Ingestion.**
      * **Goal:** Connect the AI Studio API.
      * **Task:** Pass the *raw audio buffer* (for sound) and the *spectrogram screenshot* (for vision) to Gemini.
      * **Judge Alignment (Amit):** This proves you are using Gemini 3's native multimodal capabilities, not just text.
  * **Sprint 4 (13:00 - 17:00): The "Deep Think" Prompt Architecture.**
      * **Goal:** Develop the System Instruction.
      * **Task:** Create the prompt that forces Gemini to act as a Pulmonologist. Implement "Timestamp Mapping" (e.g., "Crackles detected at 0:04").

#### **Day 3: The Research Agent (Logic & Action)**

  * **Sprint 5 (08:00 - 12:00): Anomaly Detection & Highlighting.**
      * **Goal:** Visualizing the AI's thoughts.
      * **Task:** When Gemini detects a "Wheeze," draw a bounding box or region on the waveform player.
      * **Judge Alignment (Paige):** This is "Explainable AI"—showing *where* the model is looking.
  * **Sprint 6 (13:00 - 17:00): The "Actionable Code" Module.**
      * **Goal:** The "Research Scientist" feature.
      * **Task:** Have Gemini generate a Python snippet to *filter* the specific noise it detected (e.g., "Generate a bandpass filter code block to isolate this 400Hz wheeze").

#### **Day 4: Polish & "The Story"**

  * **Sprint 7 (08:00 - 12:00): The Diagnostic Report.**
      * **Goal:** A downloadable PDF/Markdown report for clinicians.
      * **Judge Alignment (Joana):** Adoption story—this artifact is what a doctor would actually use.
  * **Sprint 8 (13:00 - 17:00): UX Refinement.**
      * **Task:** Add tooltips, loading states ("Analyzing frequency domain..."), and sample data (preload 3 distinct cases from the Kaggle dataset).

#### **Day 5: The Winning Pitch**

  * **Sprint 9 (08:00 - 12:00): Video Production.**
      * **Task:** Screen record the "Happy Path." Script the voiceover to hit the judge keywords: "Native Audio," "Clinical Workflow," "Explainability."
  * **Sprint 10 (13:00 - 17:00): Submission & Writeup.**
      * **Task:** Final testing and Kaggle submission.
