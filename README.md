# CSBS LeetCode Tracker

<p align="center">
  <img src="public/codex-logo.png" alt="Codex Coding Club Logo" width="130" />
</p>

<h2 align="center">Department of Computer Science & Business Systems (CSBS)</h2>
<h3 align="center">Nexora Association</h3>
<p align="center"><em>Presents</em></p>
<h1 align="center">🏆 Codex Coding Club</h1>

<p align="center">
  <strong>KGiSL Institute of Technology</strong><br />
  <em>(Affiliated to Anna University | Approved by AICTE | Accredited by NAAC)</em>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Platform-LeetCode%20Tracker-orange?style=for-the-badge&logo=leetcode" alt="LeetCode Tracker" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react" alt="React 19" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/SQLite-WAL%20Mode-003b57?style=for-the-badge&logo=sqlite" alt="SQLite" /></a>
</p>

---

## Overview

**CSBS LeetCode Tracker** is a state-of-the-art competitive programming analytics and student progress tracking platform designed and presented by **Codex Coding Club** under the **Nexora Association**, **Department of Computer Science & Business Systems (CSBS)** at **KGiSL Institute of Technology**.

The application provides faculty coordinators and students with real-time profile analytics, automated ranking, daily coding challenge workflows, curated problem-solving tracks, speed contests, and comprehensive academic reporting.

---

## Key Features

### Dual-Role Access Control
- ** Student Portal**: Individual student dashboard featuring personal statistics, Problem of the Day challenges, curated topic roadmaps, contest schedules, submission timelines, section leaderboards, and profile security settings.
- **Faculty Coordinator Portal**: Complete department control center equipped with batch profile synchronization, student roster administration, contest scheduling, daily problem curation, intervention queues, scoring weights setup, and multi-sheet report generation.

---

### Live LeetCode Profile Synchronization
- Direct integration with **LeetCode's public GraphQL API**.
- Real-time tracking of **Total Solved** (*Easy*, *Medium*, *Hard*), Contest Rating, Global Rank, Active Streaks, Submission Calendars, Earned Badges, and Acceptance Rates.

---

### Speed Contest Arena & Leaderboard Rankings
- **Contest Arena**: Schedule and participate in Weekly, Biweekly, and Department Speed Coding Contests.
- **Dynamic Leaderboards**: Real-time department and section rank standings calculated using weighted engagement scoring algorithms.

---

### Problem of the Day (POTD) & Curated Tracks
- **Daily POTD Module**: Featured daily problem with difficulty badges, topic tags, direct LeetCode solve links, and faculty intuition hints.
- **Curated Problem Tracks**: Algorithmic roadmaps including *Blind 75*, *LeetCode Top 150*, and *CSBS Core Placement Track*.

---

### 💾 Dual-Store Database Architecture
- **Primary Engine**: SQLite powered by `better-sqlite3` with Write-Ahead Logging (WAL) for high-performance concurrent local operations.
- **JSON Fallback Sync**: Synchronizes updates to `data/tracker_database.json` for cloud deployment compatibility and serverless persistence.

---

### Multi-Sheet Department Reports & Excel Import
- **One-Click Export**: Download comprehensive 9-Sheet Excel Department Reports (*KPI Summary*, *Current Performance*, *Student Details*, *Snapshots*, *Leaderboards*, *Intervention List*, *Audit Logs*).
- **Roster Bulk Import**: Onboard students in bulk via Excel (`.xlsx`, `.xls`) or CSV with automatic duplicate checking.

---

## Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite, TailwindCSS v4 |
| **User Interface & Icons** | Lucide Icons, Recharts Analytics, Canvas-Confetti |
| **Backend Engine** | Node.js, Express.js, TypeScript (`tsx`) |
| **Database & Persistence** | SQLite (`better-sqlite3`), Dual-Store JSON Backup |
| **Spreadsheet Engine** | SheetJS (`xlsx`) |

---

## Excel Roster Import Format

To import student rosters in bulk, prepare `.xlsx` or `.csv` files structured with these column headers:

| Column Header | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| **`Register Number`** | **Yes** | `711724UCB126` | Unique student registration / roll number |
| **`Student Name`** | **Yes** | `Maria Blessy` | Full student name |
| **`LeetCode Username`** | **Yes** | `Maria_Blessy` | Public LeetCode profile handle |
| **`Section`** | No | `A` | Class section (`A` or `B`) |
| **`Year`** | No | `III` | Academic year (`I`, `II`, `III`, `IV`) |
| **`Batch`** | No | `2024-2028` | Batch tenure |
| **`Email`** | No | `24ucb126mariab@kgkite.ac.in` | College email address |

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- `npm` (v9.0 or higher)

### 2. Installation & Running Locally
```bash
# Clone the repository
git clone https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker.git

# Navigate into project directory
cd CSBS_Leetcode_Tracker

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and navigate to:  
 **`http://localhost:3000`**

---

## Production Build

To build the application for production deployment:

```bash
# Build client and server bundles
npm run build

# Start production server
npm run start
```

---

## API Endpoints Reference

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate Student or Faculty session |
| `POST` | `/api/auth/change-password` | Update account password |
| `GET` | `/api/student/dashboard` | Retrieve personalized student metrics & tracks |
| `POST` | `/api/student/sync` | Trigger live student LeetCode profile fetch |
| `GET` | `/api/contests` | Retrieve scheduled LeetCode & Department contests |
| `POST` | `/api/contests` | Schedule a new contest |
| `PUT` | `/api/contests/:id` | Update contest details |
| `DELETE` | `/api/contests/:id` | Remove a contest |
| `GET` | `/api/potd` | Retrieve today's Problem of the Day & solvers |
| `POST` | `/api/potd` | Set / update Problem of the Day |
| `GET` | `/api/tracks` | Retrieve curated algorithmic tracks and completion stats |
| `GET` | `/api/students` | Retrieve all student records and statistics |
| `POST` | `/api/students/import` | Bulk import student roster from Excel/CSV |
| `GET` | `/api/reports/excel` | Download comprehensive 9-Sheet Excel Department Report |
| `GET` | `/api/reports/csv` | Download CSV student roster |

---

## Organization & Credits

- **Presented by**: **Codex Coding Club**
- **Association**: **Nexora Association**
- **Department**: **Computer Science & Business Systems (CSBS)**
- **Institution**: **KGiSL Institute of Technology**
- **Repository**: [Blessy27-CSBS/CSBS_Leetcode_Tracker](https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker)

---

<p align="center">
  <sub>Developed & Maintained by Codex Coding Club | Department of CSBS, KGiSL Institute of Technology.</sub>
</p>
