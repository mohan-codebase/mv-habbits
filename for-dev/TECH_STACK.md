# Technology Stack: MV Habits

This document outlines the libraries, tools, and technologies powering the MV Habits application.

---

## Core Framework & Language

* **Framework:** Next.js 16 (App Router)
* **Library:** React 19 (leveraging Server Components, Canary features, and client cache APIs)
* **Language:** TypeScript
* **Package Manager:** npm

---

## Database, Auth & Backend

* **Database & Auth Provider:** **Supabase** (utilizing PostgreSQL database, Row-Level Security (RLS) policies, and Realtime Sync for multi-device sync)
* **Auth Integration:** `@supabase/ssr` (for seamless Server-Side Rendering Auth Integration)
* **Passcode-less / Biometric Auth:** **SimpleWebAuthn** (`@simplewebauthn/browser` & `@simplewebauthn/server`) for password-free biometric login

---

## Styling & Animations

* **Styling Framework:** **Tailwind CSS v4** + native CSS variables
* **Animations:** **Framer Motion v12** (used for smooth, high-fidelity UI transitions)
* **Icons:** **Lucide React**

---

## Client-Side Logic & State

* **Forms:** **React Hook Form**
* **Validation:** **Zod** (schema validation for forms and inputs)
* **Data Visualization (Charts):** **Recharts v3** (rendering weekly habits, streaks, and category breakdowns)
* **Date Utilities:** **date-fns** & **date-fns-tz** (for timezone-aware date calculations and push reminders)
* **Drag and Drop:** **@hello-pangea/dnd** (for habits sorting and reordering)

---

## Reminders, AI & Cron Jobs

* **Push Reminders:** **Web Push** (using `web-push` library with VAPID keys)
* **AI Coach:** **Anthropic AI SDK** (interfacing with Claude for AI habit insights and coaching)
* **Cron Jobs:** Vercel Cron endpoints (configured via `/api/cron/reminders` and scheduled in `vercel.json`)
* **Analytics/Performance Tracking:** **Vercel Speed Insights**

---

## Document Generation & Exports

* **PDF Exports:** **jsPDF** and **jspdf-autotable** (to export data to PDFs)
* **Spreadsheet Exports:** **SheetJS (xlsx)** (to export history/streaks to Excel or CSV formats)
