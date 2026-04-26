I have a complete project with full documentation in a Markdown file. 

Please create a **new route/page** for a voice-powered "Report Problem" feature.

### Feature Requirements:

- The page should be accessible via a new route, e.g. `/report-problem` or `/voice-report` (add it to routing if needed, like Next.js App Router or React Router).

- Main UI element: A **very large, prominent circular button** in the center of the screen, styled exactly like the Shazam app's "Tap to Shazam" button:
  - Big pulsing animation when idle (subtle glow/scale effect).
  - When pressed/activated, it changes to a "listening" state with microphone icon + animated sound waves or pulsing rings.
  - Include a clear logo/icon inside the button (use a microphone 🎤 or a custom SVG if possible; make it bold and centered).

- Below the button: Clear instructions for the user, something like:
  "Press and hold the big button, then speak clearly about the problem.
  Example: 'The login page is broken on mobile. Users see a white screen after entering credentials.'"

- Functionality:
  1. User presses/holds the button → starts recording speech (use browser's Web Speech API with `SpeechRecognition` / `webkitSpeechRecognition` for real-time transcription).
  2. While listening, show visual feedback (e.g., "Listening..." + waveform animation).
  3. On release or stop, get the transcribed text.
  4. Send the raw transcribed text to an AI (prefer **Groq** for speed, or fallback to **OpenRouter**) with this exact prompt:

     "You are a helpful assistant that fills a problem report checkbook.
     Extract from the user's spoken description:
     - problem_type: (short category, e.g. 'Bug', 'UI Issue', 'Performance', 'Feature Request', 'Other')
     - problem: (concise one-sentence summary of the issue)
     - description: (full detailed explanation)

     Return ONLY a valid JSON object with these three keys. Do not add extra text."

  5. Parse the JSON response and **auto-fill** a form/checkbook below or in a modal with the three fields:
     - Problem Type (as a select or badge)
     - Problem (text input, pre-filled)
     - Description (textarea, pre-filled)

- After filling, show a "Save Report" or "Submit" button that saves the data (to local state, your existing backend, or console for now — match your project's data handling).

- Add proper error handling:
  - Browser not supporting SpeechRecognition → show friendly fallback message + text input option.
  - Transcription errors or empty speech → retry button.
  - AI parsing fails → show raw text + manual edit.

- Make it accessible: ARIA labels, keyboard support if possible, clear loading states.

- Use Tailwind CSS if available in the project, or match your existing styling. Keep it clean, modern, and mobile-friendly.

- Add the new route to navigation/sidebar if it makes sense.

- Provide any necessary environment variables (e.g., GROQ_API_KEY or OPENROUTER_API_KEY) and show where to add them.

First, analyze the existing project structure and documentation (use @Files or context as needed). Then implement step-by-step: create the new file(s), update routing, add the component, integrate the AI call (use fetch or your project's HTTP client), and handle state.

Make the button feel satisfying and fun to use, like Shazam.