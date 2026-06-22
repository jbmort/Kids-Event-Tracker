# Body Journal 🌟

A tactile, patient-centric, offline-first Progressive Web App (PWA) designed to help pediatric patients track chronic health symptoms (migraines, urinary, gastrointestinal, or other health related habits) on a tablet interface. The application generates reliable, timeline-based data representations that families can share directly with healthcare providers during clinical appointments.

<p align='center'>
<img src="./public/screenshots/Screenshot 2026-06-22 at 7.34.16 AM.png" alt="Body Journal Main Dashboard" width="30%" style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
  <img src="./public/screenshots/Screenshot 2026-06-22 at 7.40.09 AM.png" alt="Body Journal Main Dashboard" width="30%" style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
</p>
---

## 📖 Project Context & Problem Statement
In managing chronic pediatric health issues, accurate data is critical for clinical decision-making. Standard handwritten logs are easily lost or inconsistently kept, leading to recall bias during consultations. 

**Body Journal** solves this by providing a highly visual, low-friction tracking interface optimized for tablet browsers. Because tracking must happen continuously—whether traveling, at school, or in clinics with poor connectivity—the application was engineered with a strict **offline-first architecture** to guarantee reliable data capture under any network condition.

---

## 🛠️ Tech Stack & Architecture

This project was built to master modern React, TypeScript, and Next.js full-stack paradigms.

* **Frontend:** Next.js (App Router) utilizing Client Components for rich client-side interactivity and Server Components for initial static layout rendering.
* **Styling:** Tailwind CSS, featuring a responsive, fluid layout designed to scale to iPad dimensions without browser scrollbars.
* **Database & ORM:** PostgreSQL modeled via Prisma ORM for safe, declarative schema migrations and type-safe backend queries.
* **PWA Engine:** `@ducanh2912/next-pwa` with custom Workbox service worker caching, enabling standalone installation and full offline startup capabilities on iPadOS/iOS.
* **Infrastructure:** Docker & Docker Compose for isolated container orchestration, bridging the containerized Node runtime with host-level PostgreSQL instances.

---

## 📐 Deep Dives: Technical Architecture

### Resilient Offline-First Synchronization Architecture
To guarantee that tracking never fails due to network dropouts, the application decouples data entry from database connectivity.

```
[ User Action ] ──> [ Update Local UI Cache (Instant) ]
                                 │
                                 ├──> [ Append to Local Sync Queue ]
                                 │
                      [ Online Event Triggered? ]
                                 │
                                 └───> [ Bulk Sync POST /api/sync ] ──> [ Database Write ]
```

* **Optimistic UI:** When a user logs an event, the application immediately writes the transaction to `localStorage` and updates the React state. The UI updates instantly (latency is near 0ms).
* **Sync Queueing:** Simultaneously, the action is appended to an array in `localStorage`.
* **Event-Driven Flushing:** A background sync manager in Next.js listens to browser state. The moment the native browser `online` event fires (or on initial application boot), the app attempts a bulk POST request to `/api/sync` sending the entire local queue. Once the server responds with `200 OK`, the queue is cleared. 
* **Safe Fallback Generation:** Because modern mobile browsers disable `crypto.randomUUID()` in non-HTTPS local IP connections, I engineered a mathematical UUID fallback utility. This prevents runtime execution crashes when testing or running the app over a local HTTP home network.

---

## 💾 Database Schema

The database relies on three relational tables designed with strict referential integrity. To handle the realities of chronic symptom tracking (where multiple logs may be recorded in a single day), no restrictive unique constraints were placed on the log timestamps.

```prisma
model User {
  id        String   @id 
  name      String
  logs      Log[]
  createdAt DateTime @default(now())
}

model Habit {
  id          String   @id @default(uuid())
  name        String
  color       String
  scaleValues String[] @default([])
  logs        Log[]
  createdAt   DateTime @default(now())
}

model Log {
  id          String   @id @default(uuid())
  timestamp   DateTime @default(now())
  description String?
  scaleValue  Int?     @default(5)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  habitId     String
  habit       Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
}
```

---

## 🚀 Getting Started

### Prerequisites
* **Docker Desktop** installed on your machine.
* **Node.js** (v18 or higher) for local development.
* A running **PostgreSQL** instance on your host machine.

### Local Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/calendar-tracker.git
   cd calendar-tracker
   ```
2. Install local dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/Body_Journal"
   ```
4. Push the schema to your local database:
   ```bash
   npx prisma db push
   ```
5. Launch the local development server:
   ```bash
   npm run dev
   ```

### Running inside Docker
To simulate a production deployment and test the offline features on physical mobile/tablet devices over your local Wi-Fi:

1. Build and run the containers:
   ```bash
   docker-compose up --build
   ```
2. Find your host computer's local IP address (e.g., `192.168.1.1`).
3. Open Safari on your tablet or phone and navigate to: `http://192.168.1.1:3000`.
4. Tap **Share** -> **Add to Home Screen** to install the standalone application.

