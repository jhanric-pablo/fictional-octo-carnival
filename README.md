# Smart Stray Rescue System

The Smart Stray Rescue System is a real-time dispatch and reporting platform designed to coordinate stray animal rescue operations across Parañaque City. The system enables community members to report incidents and allows administrators and rescue operatives to manage dispatches, track field teams, and analyze operations.

## System Architecture

The application is split into three main components:

1. **Frontend**: A React application built with Vite and Tailwind CSS. It uses Leaflet Maps for spatial tracking and Framer Motion for interface animations.
2. **Backend**: An Express server built with TypeScript and Node.js, using better-sqlite3 for local persistent data storage.
3. **AI Service**: A local Flask-based python service integrating AI model templates to analyze stray animal reports.

---

## Technical Specifications

### Service Port Allocation
- **Frontend Development Server**: Port 3000
- **Backend Express Server**: Port 3001
- **AI Prediction Service**: Port 5000

### Page Directory
- **Home (`/`)**: Main landing page presenting the program mission and summary statistics.
- **Citizen Portal (`/auth`)**: Citizen login and registration interface. Restricts staff members from logging in through this endpoint.
- **Staff Portal (`/staff-portal`)**: Command center login interface for administrators and rescuers. It has no signup capabilities and restricts citizens from authenticating.
- **Incident Reporting (`/report-portal`)**: Form allowing citizens to submit animal sightings, coordinate geolocations, and upload photos. Submissions trigger background AI facial expression analysis.
- **Active Operations (`/track`)**: Spatial tracking interface. Uses Leaflet to display ongoing dispatches on a map, refreshed via 5-second backend polling.
- **Tactical Dashboard (`/dashboard`)**: Role-based access router. Automatically directs authenticated users to either the `AdminDashboard` or `CitizenDashboard` view.
- **Historical Impact (`/impact`)**: Narrative view featuring 3D flip card components themed using the natural tones color palette.

---

## Authentication & Portal Security

The system isolates standard citizens from administrative operations:
- **Authentication Isolation**: Citizens must register and log in via `/auth`. Administrators and rescuers must authenticate via `/staff-portal`. Logins to incorrect portals are blocked by the backend API.
- **Session Tracking**: Active sessions are cached in browser storage. If a token expires or a user logs out, they are redirected automatically to their respective portal.
- **Session Cleansing**: When a user selects logout, their authentication state is cleared, and they are redirected to the homepage to secure the terminal.

---

## Startup Instructions

To launch the backend, frontend, and AI services simultaneously, execute the following script from the project root:

```bash
chmod +x run_all.sh
./run_all.sh
```

The startup script will:
1. Verify and clear port conflicts.
2. Load cached Colab configurations from the environment.
3. Seed the local SQLite database with core schemas and demo records.
4. Launch the Flask AI service in the background.
5. Initialize the Express server.
6. Launch the Vite hot-reloading development server on host port 3000.