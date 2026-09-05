# 🚀 CSBS LeetCode Tracker

## Project title and overview
**CSBS LeetCode Tracker** is a comprehensive, real-time student progress tracking and analytics portal. It is designed for faculty and department coordinators to monitor, analyze, and boost competitive programming engagement on LeetCode among students.

## Problem statement / purpose
Tracking student engagement in competitive programming platforms manually is tedious and scales poorly. The purpose of this system is to automate the retrieval of LeetCode metrics, provide actionable insights to faculty regarding student performance, and motivate students through leaderboards, curated practice tracks, and daily challenges. 

## Key features
- **Role-Based Portals**: Distinct dashboards for students and staff.
- **Automated LeetCode Synchronization**: Real-time stats retrieval via LeetCode's public GraphQL API.
- **Background Auto-Sync**: Built-in scheduler for fetching student profiles at configurable intervals.
- **Problem of the Day (POTD)**: Daily challenges tailored for the department.
- **Curated Practice Tracks**: Built-in tracking for Blind 75, Top 150, and CSBS Core problem sets.
- **Dynamic Leaderboards**: Ranking students by Engagement Score, Total Solved, and Contest Rating.
- **Intervention System**: Automated detection of inactive or at-risk students for academic intervention.
- **Data Import & Export**: Bulk import via Excel/CSV and comprehensive 9-sheet Excel department reports.

## System architecture
The application utilizes a monolithic architecture where a Node.js/Express backend serves both the API endpoints and the React frontend.
- **Frontend**: A Single Page Application (SPA) built with React 19 and Vite. It consumes the REST API provided by the backend.
- **Backend**: An Express.js server that handles routing, authentication, external API calls to LeetCode, and data persistence.
- **Database**: A local SQLite database utilizing Write-Ahead Logging (WAL) for fast, zero-configuration data storage.

## Application workflow
1. **Onboarding**: Staff import a roster of students using a CSV or Excel template.
2. **Synchronization**: The backend scheduler periodically pulls the latest problem-solving metrics from LeetCode for all active students.
3. **Student View**: Students log in using their email and register number to view their personal dashboard, standing, and daily tasks.
4. **Staff View**: Faculty log in to access department-wide analytics, monitor batch progress, download reports, and identify students requiring intervention.

## Student and staff capabilities
- **Student Capabilities**:
  - View individual LeetCode statistics and progress graphs.
  - See their rank on the department leaderboard.
  - Access the Problem of the Day and Curated Tracks.
  - View recent LeetCode submissions.
- **Staff Capabilities**:
  - Full CRUD operations on student records.
  - Trigger manual batch synchronization.
  - Access the Intervention Queue to track inactive students.
  - Configure the Problem of the Day and auto-sync settings.
  - Export data to CSV and comprehensive Excel reports.

## Analytics and performance metrics
The system calculates and tracks several key metrics:
- **Total Solved**: Breakdown by Easy, Medium, and Hard difficulties.
- **Engagement Score**: A composite metric based on problems solved, streak, and contest participation.
- **Performance Tier**: Categorization into *Beginner*, *Developing*, *Proficient*, or *Advanced*.
- **Days Inactive**: Tracks the number of days since the last LeetCode submission.
- **Activity Status / Risk Level**: Identifies students as Active, At Risk, or Inactive.

## Technology stack
- **Frontend**: React 19, TypeScript, TailwindCSS v4, Recharts, Lucide Icons, Motion, Vite.
- **Backend**: Node.js, Express, TypeScript, tsx, esbuild.
- **Database**: SQLite (via `better-sqlite3`).
- **Data Processing**: `xlsx` (SheetJS) for report generation.

## Project structure
```
CSBS_Leetcode_Tracker/
├── api/             # Auxiliary API functions
├── data/            # Local SQLite database storage
├── public/          # Static assets
├── server/          # Backend Express logic (db, leetcode api, analytics, reports)
├── src/             # Frontend React source code
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page views (Dashboard, Leaderboard, etc.)
│   └── services/    # Frontend API client
├── server.ts        # Main application entry point
├── package.json     # Project metadata and scripts
└── vite.config.ts   # Vite configuration
```

## API overview
The backend exposes RESTful endpoints under `/api`:
- **Auth**: Token-based authentication.
- **Dashboard**: `/api/dashboard` (Aggregated KPIs and stats).
- **Students**: `/api/students` (CRUD operations, import/export).
- **Sync**: `/api/fetch/student/:id`, `/api/fetch/all` (LeetCode API integration).
- **Analytics**: `/api/leaderboard`, `/api/sections`, `/api/intervention`.
- **Content**: `/api/potd`, `/api/tracks`.
- **System**: `/api/settings`, `/api/scheduler/status`.

## Database / data management
Data is stored locally in `data/csbs_tracker.db` using SQLite. The schema includes:
- `students`: Core student profiles and credentials.
- `snapshots`: Historical records of student LeetCode metrics, allowing for progress tracking over time.
- `submissions`: Recent LeetCode submissions for feed rendering.
- `settings`: Department configuration (thresholds, weights, scheduler config).

## Installation and setup
### Prerequisites
- Node.js (version 18 or higher recommended)
- `npm`

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker.git
   cd CSBS_Leetcode_Tracker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the portal at `http://localhost:3000`.

## Available scripts
- `npm run dev`: Starts the application in development mode using `tsx`.
- `npm run build`: Bundles the React frontend with Vite and the Express backend with esbuild.
- `npm run start`: Runs the production bundle from `dist/server.js`.
- `npm run preview`: Previews the Vite production build.
- `npm run clean`: Removes the `dist` directory and built artifacts.
- `npm run lint`: Runs TypeScript type checking.

## Environment variables, if applicable
A `.env.example` file is provided. Create a `.env` file in the root directory for configuration:
```env
GEMINI_API_KEY="your_api_key_here"
APP_URL="http://localhost:3000"
PORT=3000
```
*(Note: Ensure sensitive keys are kept secret and never committed to version control.)*

## Build and production instructions
To deploy the application:
1. Generate the optimized build:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

## Screenshots or assets section, if available
*(Add screenshots of the Dashboard, Leaderboard, and Intervention Queue here.)*

## Future enhancements
- Integration with Single Sign-On (SSO) systems.
- Email or SMS notifications for at-risk students.
- Support for other competitive programming platforms (e.g., HackerRank, Codeforces).
- More granular permissions and roles (e.g., Read-only Faculty view).

## Contributors / project information
- **Institution**: KGiSL Institute of Technology
- **Department**: Computer Science and Business Systems (CSBS)
- **Repository**: [Blessy27-CSBS/CSBS_Leetcode_Tracker](https://github.com/Blessy27-CSBS/CSBS_Leetcode_Tracker)
