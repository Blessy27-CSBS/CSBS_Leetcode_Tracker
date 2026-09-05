# 🚀 CSBS LeetCode Tracker

<p align="center">
  <img src="public/codex-logo.png" alt="CSBS Codex Logo" width="120" />
</p>

<p align="center">
  <strong>Department of Computer Science & Business Systems (CSBS)</strong><br />
  <em>KGiSL Institute of Technology (Affiliated to Anna University, Approved by AICTE)</em>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Platform-LeetCode%20Tracker-orange?style=for-the-badge&logo=leetcode" alt="LeetCode Tracker" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react" alt="React 19" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/SQLite-WAL%20Mode-003b57?style=for-the-badge&logo=sqlite" alt="SQLite" /></a>
</p>

---

A state-of-the-art, real-time student progress tracking and competitive programming analytics portal built for faculty coordinators and students of the **Department of Computer Science and Business Systems (CSBS)** at KGiSL Institute of Technology.

---

## 🌟 Key Features

### 🔐 Role-Based Portals & Default Credentials
- **🎓 Student Portal**:
  - **Username / Identifier**: Student Email (e.g. `24ucb126mariab@kgkite.ac.in`), Register Number (e.g. `711724UCB126`), or LeetCode handle (`Maria_Blessy`).
  - **Default Password**: Student **Register Number** (e.g., `711724UCB126`).
  - **Features**: Personalized stats, Problem of the Day (POTD) with faculty hints, Curated Practice Tracks, LeetCode Weekly Contests, recent submissions feed, class rank metrics, and account password management.
- **👨‍🏫 Staff / Faculty Coordinator Portal**:
  - **Username**: `Faculty_CSBS` (or `staff` / `admin`).
  - **Default Password**: `Kite@123`.
  - **Features**: Comprehensive department dashboard, batch syncing, student directory, scheduled contest arena, POTD management, intervention queue, 9-sheet Excel exports, and scoring weights setup.

---

### 📊 Live LeetCode Profile Synchronization
- Direct integration with **LeetCode's public GraphQL API**.
- Tracks **Total Solved** (*Easy*, *Medium*, *Hard*), Contest Rating, Global Ranking, Active Streaks, Submission History, Languages, Badges, and Acceptance Rates.

---

### 🏆 Contest Arena & Leaderboard Hub
- **LeetCode Contests**: Schedule and track Weekly, Biweekly, and Department Speed Coding Contests.
- **Dynamic Leaderboards**: Real-time department and section rank standings based on Engagement Score, Total Solved, Contest Rating, and Monthly Improvement.

---

### 🔥 Daily Problem of the Day (POTD) & Curated Tracks
- **POTD Module**: Daily algorithm challenge with difficulty badges, topic tags, direct LeetCode links, and optional Faculty intuition hints.
- **Curated Problem Tracks**: Algorithmic roadmaps including *Blind 75*, *LeetCode Top 150*, and *CSBS Core Placement Track*.

---

### 💾 Resilient Dual-Store Database Architecture
- **Primary Engine**: SQLite via `better-sqlite3` with Write-Ahead Logging (WAL) for local high-throughput operations.
- **JSON Fallback Sync**: Synchronizes all updates to `data/tracker_database.json` for persistent storage and serverless deployment compatibility.

---

### 📑 Multi-Sheet Department Reports & Excel Import
- **One-Click Export**: Download detailed 9-Sheet Excel Reports (*KPI Summary*, *Current Performance*, *Student Details*, *Snapshots*, *Leaderboards*, *Intervention List*, *Audit Logs*).
- **Roster Bulk Import**: Drag-and-drop Excel (`.xlsx`, `.xls`) or CSV roster onboarding with built-in duplicate detection.

---

## 🛠️ Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite, TailwindCSS v4 |
| **Icons & Visuals** | Lucide Icons, Recharts Analytics, Canvas-Confetti |
| **Backend Engine** | Node.js, Express.js, TypeScript (`tsx`) |
| **Database & Cache** | SQLite (`better-sqlite3`), JSON File Store Backup |
| **Spreadsheet Engine** | SheetJS (`xlsx`) |

---

## 📋 Excel Roster Import Format

When importing student rosters in bulk, use `.xlsx` or `.csv` files structured with these column headers:

| Column Header | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| **`Register Number`** | **Yes** | `711724UCB126` | Unique student roll / registration number |
| **`Student Name`** | **Yes** | `Maria Blessy` | Full student name |
| **`LeetCode Username`** | **Yes** | `Maria_Blessy` | Public LeetCode profile handle |
| **`Section`** | No | `A` | Class section (`A` or `B`) |
| **`Year`** | No | `III` | Academic year (`I`, `II`, `III`, `IV`) |
| **`Batch`** | No | `2024-2028` | Batch tenure |
| **`Email`** | No | `24ucb126mariab@kgkite.ac.in` | College email address |

*(Sample import templates can be downloaded directly from the **Students** tab inside the portal).*

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- `npm` (v9.0 or higher)

### 2. Installation & Setup
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
👉 **`http://localhost:3000`**

---

## 📦 Production Build

To test and build the production bundle:

```bash
# Build Vite client and esbuild server
npm run build

# Start the production server
npm run start
```

---

## 📡 Key API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate Student or Faculty credentials |
| `POST` | `/api/auth/change-password` | Update current user account password |
| `GET` | `/api/student/dashboard` | Student portal personalized metrics & tracks |
| `POST` | `/api/student/sync` | Trigger live student LeetCode profile fetch |
| `GET` | `/api/contests` | Retrieve scheduled LeetCode & Department contests |
| `POST` | `/api/contests` | Schedule a new contest (Faculty) |
| `PUT` | `/api/contests/:id` | Update scheduled contest details |
| `DELETE` | `/api/contests/:id` | Remove a contest |
| `GET` | `/api/potd` | Get today's Problem of the Day & solvers |
| `POST` | `/api/potd` | Set/update Problem of the Day |
| `GET` | `/api/tracks` | Curated algorithmic tracks and completion stats |
| `GET` | `/api/students` | Retrieve all student records & latest stats |
| `POST` | `/api/students/import` | Bulk import student roster from Excel/CSV |
| `GET` | `/api/reports/excel` | Download comprehensive 9-Sheet Excel Report |
| `GET` | `/api/reports/csv` | Download CSV student roster |

---

## 👥 Department Information

- **Institution**: KGiSL Institute of Technology (KGiSL Trust)
- **Department**: Computer Science and Business Systems (CSBS)
- **GitHub Repository**: [Blessy27-CSBS/CSBS_Leetcode_Tracker](https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker)

---

<p align="center">
  <sub>Built with ❤️ for CSBS Students and Faculty at KGiSL Institute of Technology.</sub>
</p>
