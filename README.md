# ⚡ PaulwerLift ⚡

**PaulwerLift** is a premium, mobile-first, completely serverless **Progressive Web App (PWA)** strength tracker designed specifically for iPhone Safari standalone mode. 

Engineered for the gym basement, it runs **100% offline**, stores your data strictly in local browser memory, synthesizes its own workout timers, and features a built-in **Gemini Personal AI Gym Coach** that reviews your actual logs and cues to guide your progression!

---

## 🚀 Key Features

### 1. Standalone iOS PWA
* Fullscreen layout with status bar translucent integration (`apple-mobile-web-app-capable`).
* Network-first static offline cache using an integrated Service Worker (`sw.js`).
* Fluid touch targets (minimum 48px size per WCAG safety standards) designed for fat-finger logging during heavy sessions.

### 2. Personal AI Gym Coach (Bring-Your-Own-Key)
* Direct, serverless client-side connection to Google's **Gemini 2.5 Flash** model via secure HTTPS requests.
* **Context Compiler Engine:** The app automatically packages your routine presets and up to 15 completed workouts (weights, reps, form cues, and comments) into the prompts context. The coach has full knowledge of your statistics!
* Premium glassmorphic chat thread with quick-action suggestion chips, animated CSS typing indicators, and clean markdown table/list rendering.
* API connection status validator and diagnostics dashboard in Settings.

### 3. Three-Tier Notes & Journaling Suite
* **Exercise-Specific Notes:** Jot down cues directly on individual lifts during a session (e.g., *"chest up"* or *"wider squat stance"*).
* **Floating Form Cue Prompts:** The app scans your history and automatically displays your previous session note for that exact exercise inside a glowing purple alert box when you start a lift: `“💡 Last Session Cue: Keep heels down!”`.
* **Retroactive Log Editor:** Edit your completed session journal notes directly inline within your History feed (Analytics tab) at any time.
* **Program Guidelines:** Keep track of routine preset rules directly on the cards and custom routine creator modal.

### 4. Progressive Overload Weight Engine
* Pre-seeded with standard **Starting Strength** (Workout A & B) and **Stronglifts 5x5** (Workout A & B) routines.
* Tracks completion history: if you successfully check off all sets, the engine automatically calculates progressive overload increments for your next session (+5 lbs for compound presses/pulls, +10 lbs for Deadlifts, custom trap bar scaling).
* Converts weights and calculations instantly between **lbs** and **kgs**.

### 5. Synthesized Audio Rest Timer
* Circular SVG animated countdown progress ring.
* Quick adjust controls (`+30s`, `-30s`, `Skip`).
* **Web Audio API Synthesizer:** Double-beeps are synthesized directly through the browser's AudioContext completely offline, using zero bandwidth and requiring no external `.mp3` files!

### 6. Interactive plate sleeve calculator
* Calculates plate distribution per side for a standard 45 lb (or 20 kg) barbell.
* **Trap Bar Deadlift override:** Auto-detects Deadlift movements and automatically factors in a **60 lbs Hex Trap Bar** instead of a straight bar.
* Renders a 3D-style color-coded plate sleeve (Red 45s, Blue 35s, Green 25s, Yellow 10s, Slate 5s, Gray 2.5s) to eliminate gym math.

### 7. Ramping Warmups Drawer
* Generates Starting Strength empty-bar ramping warm-ups (2 empty bar sets, 1 set at 40%, 1 set at 70%, 1 set at 90%).
* **Custom Plate Load Hints:** Displays exact plate loading splits per side under each warmup set (e.g. *"Plates per side: 45, 10 lbs"*).

---

## 🛠️ Tech Stack & Architecture

* **Core:** React 19 + TypeScript + Vite
* **Styling:** Modern Vanilla CSS (CSS Variables, OLED dark values `#000000`, glassmorphism backdrop-filters, custom keyframe checkmark pulse checkings)
* **Icons:** Lucide React
* **Offline DB:** Local Storage API

---

## 💻 Local Development Setup

To run the application locally in development mode:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Toggle **Device Toolbar (Mobile View)** in DevTools to enjoy the mobile PWA layout!

3. **Build & Compile Production Bundle:**
   ```bash
   npm run build
   ```

---

## 🚀 How to Deploy Updates to GitHub Pages

Since the live website is hosted on GitHub Pages, pushing a normal commit to `main` backs up your source code but **does not** automatically update your hosted phone app. 

To compile and publish your latest changes to your live site, simply run:

```bash
npm run deploy
```

This single command automatically:
1. Compiles your TypeScript (`tsc -b`).
2. Builds your static Vite assets into the `dist/` folder.
3. Commits and pushes the compiled assets directly to your active `gh-pages` hosting branch on GitHub!

---

---

## 📱 PWA installation on iPhone (Safari Standalone Mode)

1. Open **Safari** on your iPhone and navigate to your deployed hosting URL.
2. Tap the **Share** button (box with an up arrow) in the bottom navigation bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Set the name to **PaulwerLift** and tap **Add**.
5. Launch the app from your home screen—it will render in its own standalone, fullscreen, hardware-accelerated viewport, fully caching static assets offline!

---

## 📊 Database Backup JSON Schema

For migrations, imports, and manual edits, the app imports and exports backup files in this exact schema format:

```json
{
  "version": "1.0",
  "unit": "lbs",
  "routines": [
    {
      "id": "ss-a",
      "name": "Starting Strength A",
      "description": "Focus on primary compound power movements: Squat, Bench Press, and Deadlift.",
      "exercises": [
        {
          "exerciseId": "squat",
          "name": "Squat",
          "sets": [
            { "weight": 135, "reps": 5, "completed": false }
          ]
        }
      ]
    }
  ],
  "history": [
    {
      "id": "x7y8z9a",
      "routineId": "ss-a",
      "routineName": "Starting Strength A",
      "date": "2026-05-28T22:30:00.000Z",
      "durationMinutes": 28,
      "notes": "Felt incredibly strong today. Slept 8 hours. Squat felt light.",
      "exercises": [
        {
          "exerciseId": "squat",
          "name": "Squat",
          "notes": "Widened stance slightly, felt much safer on hip sockets.",
          "sets": [
            { "weight": 225, "reps": 5, "completed": true }
          ]
        }
      ]
    }
  ]
}
```
You can export this JSON file inside settings and upload it back to restore your database on any device instantly.

---

## 🔑 AI Coach Quota & Key Setup

To activate the **Personal AI Gym Coach**:
1. Sign in to [Google AI Studio](https://aistudio.google.com/).
2. Click **"Get API key"** and create a new free developer API key.
3. Open PaulwerLift, go to **Settings**, paste your key, and tap **Test & Save Connection**.
4. Once verified, open the **AI Coach** tab and start training!
