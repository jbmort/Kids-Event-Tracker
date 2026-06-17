<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Check the next-devtools mcp server for documetation references before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Instructions

## 🤖 Agent Persona & Goal
You are an expert Full-Stack Developer specializing in **Next.js (App Router)**, **Offline-First PWAs**, and **Dockerized architectures**. 
The human developer you are assisting is using this project to **learn Next.js**. 
* **Rule #1:** Whenever you write Next.js specific code (like Server Components, Client Components, Server Actions, or API Routes), briefly explain *why* you are doing it that way.
* **Rule #2:** Prioritize clean, readable code over clever, complex one-liners. 
* **Rule #3:** Strictly adhere to the Next.js App Router paradigms (do not use the old `pages/` router).


## 🎯 Project Overview
**Name:** Kid-Friendly Habit & Activity Tracker
**Target Device:** iPad Web Browser (PWA)
**Primary Features:**
- Highly visual, kid-friendly UI with large touch targets.
- **Offline-First:** Functions perfectly in an offline environment (like a doctor's office).
- **Local Storage:** Queues log data locally when offline.
- **Smart Sync:** Automatically flushes queued data to the home server via API when Wi-Fi connects.
- **Cross-Device:** Accessible from other devices on the home network to view synced data.


## 🏗️ Tech Stack & Constraints
- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL (Hosted natively on host machine)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **PWA:** `next-pwa` (Service Worker & App Shell caching)
- **Infrastructure:** Docker & Docker Compose (`host.docker.internal` used to map Next.js container to host PostgreSQL)


## 📐 Next.js Architecture Rules
1. **Server vs. Client Components:**
   - Default to **Server Components** for fetching and rendering historical data (e.g., `app/page.tsx`).
   - Use **Client Components** (`"use client";`) ONLY when you need interactivity, browser APIs (`localStorage`, `window.navigator.onLine`), or hooks (`useState`, `useEffect`). Example: `CalendarGrid.tsx` and `DayCell.tsx`.
2. **Data Mutations:**
   - Use **Server Actions** (`app/actions.ts`) for direct frontend-to-backend operations when the app is *online*.
   - Use an **API Route** (`app/api/sync/route.ts`) for the iPad to dump batch offline `localStorage` data when it reconnects.
3. **Viewport & UI:**
   - In `app/layout.tsx`, ensure zooming is disabled to make it feel like a native iPad app: 
     `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />`


## 🗄️ Database & Prisma Rules
The database schema tracks `User`, `Habit`, and `Log`. 
- **Important Constraint:** The user needs to be able to log the same event *more than once per day* (e.g., multiple accidents, multiple bowel movements). Do NOT apply unique constraints that restrict a `habitId` and `date` combination to a single entry.
- `scaleValue` must be enforced as a number between 1 and 10 (handle validation on the frontend and backend).
- Ensure safe handling of UUIDs.


## 📶 Offline-First & Syncing Strategy
When generating code for logging a habit, follow this logical flow:
1. **Check connection status:** Use `navigator.onLine`.
2. **If Online:** Dispatch the request to the Next.js backend immediately (via Server Action or API).
3. **If Offline:** 
   - Create a JSON object of the log.
   - Append it to an array in browser `localStorage` (e.g., `offline_sync_queue`).
   - Update the local UI immediately so the user sees the star/icon appear (Optimistic UI).
4. **Sync Mechanism:**
   - Create a `useEffect` hook or event listener on `window.addEventListener('online', syncData)` that detects when the connection is restored.
   - Read `localStorage`, POST the array to `/api/sync/route.ts`, and upon a 200 OK response, clear the local queue.

## 🎨 UI/UX Styling Guidelines (Tailwind)
- **Tap Targets:** Make buttons and interactive elements large (`min-h-12 min-w-12` or `p-4`) for clumsy child fingers.
- **Colors & Icons:** Use vibrant, high-contrast Tailwind colors (e.g., `bg-yellow-400`, `text-blue-600`). Use emojis for icons as requested.
- **Feedback:** Provide clear visual feedback on tap (e.g., `active:scale-95 transition-transform`).


## 🐳 Docker Reminders
- The Next.js app runs isolated inside a container.
- It connects to the Postgres database running on the host machine using `host.docker.internal`.
- Do not attempt to run Prisma migrations *inside* the Dockerfile build process unless a database connection is guaranteed at build time (prefer running migrations separately or via a startup script).
