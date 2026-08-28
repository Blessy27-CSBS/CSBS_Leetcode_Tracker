# 🚀 CSBS LeetCode Tracker

> **Department of Computer Science & Business Systems (CSBS)**  
> **KGiSL Institute of Technology**

A comprehensive, real-time student progress tracking and analytics portal designed for faculty and department coordinators to monitor, analyze, and boost competitive programming engagement on LeetCode.

---

## 🌟 Key Features

- **🔐 Role-Based Authentication & Separate Student / Staff Portals**:
  - **Student Login**:
    - **Username**: Student's **Email ID** (e.g. `720723115001@kgkite.ac.in`) or Register Number
    - **Password**: Student's **Register Number** (e.g. `720723115001`)
    - Dedicated individual dashboard with personal LeetCode statistics, Problem of the Day challenge, Curated Practice Tracks checklist, live profile sync, recent submissions feed, and class leaderboard standings.
  - **Staff / Faculty Login**:
    - **Username**: `staff` (or `admin`)
    - **Password**: `staff123` (or `admin123`)
    - Complete department control with all 9 analytics and management modules, student directory, batch sync, intervention queue, Excel exports, and POTD configuration.

- **📊 Real-Time LeetCode Profile Synchronization**:
  - Live querying via LeetCode's public GraphQL API.
  - Automatically fetches Total Solved (Easy / Medium / Hard), Contest Rating, Global Rank, Active Streak, Total Active Days, Acceptance Rate, Badges, and Problem-Solving Calendars.

- **📥 Seamless Bulk Import & Data Management**:
  - Bulk roster import via **Excel (`.xlsx`, `.xls`)** or **CSV**.
  - Built-in downloadable pre-formatted import templates.
  - Duplicate detection by College Register Number and LeetCode handle.

- **🗄️ Embedded SQLite Database**:
  - Powered by `better-sqlite3` with Write-Ahead Logging (WAL) for ultra-fast local persistence.
  - Zero-configuration storage located in `data/csbs_tracker.db` with structured relational schema and indexing.

- **🔥 Department Problem of the Day (POTD) & Daily Streak Hub**:
  - Daily curated challenge with countdown timer, topic tags, difficulty badges, and direct LeetCode solve links.
  - Live Department Solver Roster showing real-time student completions and completion percentages.
  - Coordinator tools to set or customize department daily challenges and provide faculty intuition hints.

- **📚 Curated Problem Tracks (Blind 75, Top 150, CSBS Core)**:
  - Structured algorithmic topic roadmaps (Arrays, Two Pointers, Sliding Window, Trees, Graphs, DP).
  - Department and student-level completion statistics and practice links.

- **⏰ Automated Scheduled Background Profile Synchronization**:
  - Background cron-like scheduler (Every 6h, 12h, 24h, or off) with built-in rate-limiting and delay buffer.
  - Live telemetry, last-run records, and next-run countdown timers in Settings.

- **🏆 Dynamic Leaderboards & Benchmarks**:
  - Configurable ranking by Engagement Score, Total Solved, Medium/Hard problems, Contest Rating, or Monthly Improvement.
  - Performance Tier Classification: *Beginner*, *Developing*, *Proficient*, and *Advanced*.

- **⚠️ Inactive Student & Risk Intervention Queue**:
  - Automated detection of students inactive for more than a configurable threshold (e.g. 14 days).
  - Risk categorization (*Low*, *Moderate*, *High*) to assist faculty mentors in timely academic interventions.

- **📑 Multi-Sheet Department Reports**:
  - One-click export of comprehensive **9-Sheet Excel Reports** (Summary KPIs, Current Performance, Student Details, Historical Snapshots, Leaderboards, Section Comparisons, Intervention Lists, Growth, and Audit Logs).
  - Quick CSV export for student lists.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [TailwindCSS v4](https://tailwindcss.com/), [Recharts](https://recharts.org/), [Lucide Icons](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), [tsx](https://github.com/privatenumber/tsx)
- **Database**: [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
- **Spreadsheet Processing**: [`xlsx` (SheetJS)](https://sheetjs.com/)
- **Build Tool**: [Vite](https://vitejs.dev/), [esbuild](https://esbuild.github.io/)

---

## 📋 Excel Roster Import Format

To import students in bulk, prepare an Excel (`.xlsx`) or CSV file with the following column headers:

| Column Header | Mandatory | Example | Description |
| :--- | :---: | :--- | :--- |
| **`Register Number`** | **Yes** | `711724UCB126` | Unique student roll / registration number |
| **`Student Name`** | **Yes** | `Maria Blessy` | Student's full name |
| **`LeetCode Username`** | **Yes** | `Maria_Blessy` | Public LeetCode profile handle |
| **`Section`** | No | `A` | Class section (Default: `A`) |
| **`Year`** | No | `III` | Year of study (`I`, `II`, `III`, `IV`) |
| **`Batch`** | No | `2024-2028` | Admission batch |
| **`Email`** | No | `24ucb126mariab@kgkite.ac.in` | College / personal email |
| **`Mentor`** | No | `Dr. S. Ramesh` | Assigned faculty mentor name |

*(You can download the sample template directly from the **Students** tab inside the web portal).*

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `bun`

### 1. Clone the Repository
```bash
git clone https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker.git
cd CSBS_Leetcode_Tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📦 Building for Production

To create an optimized production build:
```bash
npm run build
```

To start the production server:
```bash
npm run start
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/dashboard` | Aggregated KPIs, difficulty splits, and timeline data |
| `GET` | `/api/potd` | Today's Problem of the Day & verified student solvers |
| `POST` | `/api/potd` | Set / override department Problem of the Day |
| `GET` | `/api/tracks` | Curated tracks list with department completion rates |
| `GET` | `/api/tracks/:id` | Specific track problem roadmap with solver metrics |
| `GET` | `/api/scheduler/status` | Current background auto-sync state and next run time |
| `POST` | `/api/scheduler/config` | Update background auto-sync schedule & enable toggle |
| `GET` | `/api/students` | List filtered student records with latest statistics |
| `POST` | `/api/students` | Add a single student |
| `PUT` | `/api/students/:id` | Update student profile details |
| `DELETE` | `/api/students/:id` | Remove a student and their snapshot history |
| `POST` | `/api/students/import` | Bulk import students from JSON / parsed Excel rows |
| `GET` | `/api/students/template` | Download sample Excel / CSV import template |
| `POST` | `/api/fetch/student/:id` | Sync single student profile from LeetCode |
| `POST` | `/api/fetch/all` | Asynchronous batch synchronization for all students |
| `GET` | `/api/fetch/progress` | Live progress status of active batch fetch |
| `GET` | `/api/leaderboard` | Ranked student standings |
| `GET` | `/api/sections` | Section & batch comparative metrics |
| `GET` | `/api/intervention` | List students exceeding inactivity threshold |
| `GET` | `/api/reports/excel` | Download complete 9-Sheet Excel Department Report |
| `GET` | `/api/reports/csv` | Download filtered student CSV dataset |
| `GET` | `/api/settings` | Retrieve department thresholds & weight parameters |
| `PUT` | `/api/settings` | Update scoring weights and inactivity thresholds |

---

## 👥 Department & Project Information

- **Institution**: KGiSL Institute of Technology (KGiSL Trust)
- **Department**: Computer Science and Business Systems (CSBS)
- **Repository**: [https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker](https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker)
