# PelviCoach Mobile App
**Simple. Guided. Personalized.**

PelviCoach is a rehabilitation and biofeedback mobile application designed particularly with **older women** in mind, built with React Native + Expo, TypeScript, and Supabase.

---

## 🌟 Features

### 👩 Patient Experience (Elderly-Friendly UI)
- **High-Contrast, Large Typography**: Minimum 18px body font, 60px buttons, clear touch targets.
- **Guided Exercises**: Preloaded with *Pelvic Floor Hold*, *Quick Contractions*, and *Deep Pelvic Relax*.
- **Integrated Video Demonstrations**: In-app video player with offline-ready visual guidance.
- **Real-Time Biofeedback Training**:
  - Circular countdown timer.
  - Live muscle activation bar with target indicator line.
  - Abdominal compensation alert (*"Try to relax your stomach muscles"*).
  - Patient-friendly coaching messages (no technical jargon like EMG or RMS).
- **Adaptive Training Engine**: Automatically advances targets after 3 successful contractions, or adjusts targets downward after 2 misses.
- **Session Summary & Progress Tracking**: Clear celebration screen saving reps, duration, and attempts.
- **Patient Link Code**: A clean 6-digit code (e.g. `PELVI-4821`) to connect with clinicians.

### 👨‍⚕️ Clinician Experience
- **Patient Dashboard**: High-level overview of linked patients, success rates, and last session dates.
- **Patient Overview**: Complete breakdown of successful, missed, compensated, and invalid repetitions.
- **Interactive Training Controls**: Live steppers for **Target Intensity (%)**, **Hold Duration (s)**, and **Goal Repetitions**.
- **One-Click Prescription Sync**: Updating targets immediately syncs to the patient's home screen.
- **Patient Linking**: Easily enter a patient's code to link them to your practice.

### 🎮 Hackathon Demo Mode
- **Zero Hardware Requirement**: Built-in biofeedback engine simulates realistic electromyographic waveforms with physiological tremor.
- **Interactive Presenter Controls**: Instantly trigger the 5 demonstration scenarios:
  1. `✓ Correct Exercise` (Pelvic 78%, Abdominal 14% -> OK)
  2. `⚠ Abdominal Compensation` (Pelvic 75%, Abdominal 58% -> COMPENSATED)
  3. `↓ Weak Contraction` (Pelvic 40% -> MISS)
  4. `⚠ Poor Signal` (Poor contact -> INVALID)
  5. `⚡ Electrical Interference` (Noise spikes -> INVALID)

---

## 📂 Project Architecture

```text
PELVICOACH/
│
├── App.tsx                        # App entry point & theme provider
├── app.json                       # Expo configuration (Android & iOS)
├── package.json                   # Dependencies & scripts
├── .env.example                   # Supabase environment variables template
│
├── assets/
│   ├── icon.png                   # App icon
│   ├── splash.png                 # Splash screen
│   └── videos/                    # Drop your MP4 demonstration videos here
│       └── README.txt
│
├── supabase/
│   └── schema.sql                 # Complete SQL schema, RLS policies & triggers
│
├── src/
│   ├── types/                     # TypeScript interfaces
│   ├── theme/                     # High-contrast elderly-friendly color system
│   ├── lib/
│   │   └── supabase.ts            # Live Supabase client + graceful offline fallback
│   ├── services/
│   │   ├── biofeedbackEngine.ts   # Repetition validation & adaptive algorithm
│   │   ├── demoSimulator.ts       # Real-time biofeedback waveform simulator
│   │   └── dbService.ts           # Dual-mode data service (Supabase & local storage)
│   ├── components/
│   │   ├── PrimaryButton.tsx      # Large accessible touch button
│   │   ├── Card.tsx               # High-contrast rounded card
│   │   ├── ExerciseVideoPlayer.tsx# Video player with fallback visualizer
│   │   ├── CircularTimer.tsx      # SVG circular countdown timer
│   │   ├── MuscleActivityGauge.tsx# Live biofeedback gauge with target flag
│   │   ├── BiofeedbackBanner.tsx  # Patient-friendly feedback message banner
│   │   ├── DemoControlPanel.tsx   # Floating hackathon presenter controls
│   │   └── MedicalDisclaimer.tsx  # Compliant medical research disclaimer
│   ├── screens/
│   │   ├── auth/                  # Login & Sign Up (Patient & Clinician)
│   │   ├── patient/               # Home, Exercises, Detail, Training, Summary, Progress, Profile
│   │   └── clinician/             # Dashboard, Patient Details, Prescribe Controls, Profile
│   └── navigation/
│       ├── RootNavigator.tsx      # Role-based root routing
│       ├── PatientNavigator.tsx   # Bottom tabs + Training stack
│       ├── ClinicianNavigator.tsx # Clinician tabs & detail stack
│       └── AuthNavigator.tsx      # Authentication flow
```

---

## 🚀 How to Run the App

### Step 1: Install Dependencies (Already completed!)
```bash
npm install
```

### Step 2: Start the Expo Development Server
```bash
npm start
```

### Step 3: Launch on Your Device
- **Physical Phone**: Install **Expo Go** from the Google Play Store (or iOS App Store), and scan the QR code printed in your terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Web Browser**: Press `w` in the terminal.

---

## ⚡ Quick Demo Accounts (One-Tap Access)

During your presentation, you can sign in instantly using the demo buttons on the login screen or test accounts:

- **Patient Demo**: `lakshmi@example.com` / `password123` (Role: Patient, Code: `PELVI-4821`)
- **Clinician Demo**: `dr.jenkins@clinic.com` / `password123` (Role: Clinician)

---

## ⚖️ Medical Disclaimer
PelviCoach is a prototype developed for demonstration and research purposes. It is not a clinically validated diagnostic or treatment device. Clinical use requires appropriate validation and qualified healthcare supervision.
