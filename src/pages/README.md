# Page Component Directory

This directory contains the primary page components of the Smart Stray Rescue web application. Each file defines a distinct route view within the system structure.

---

## Page Mapping and Access Levels

| Page Component | Route Path | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **`Home.tsx`** | `/` | Public | The landing page of the platform. Features mission statements, summary statistics, and general actions. |
| **`Auth.tsx`** | `/auth` | Public (Citizens) | Citizen registration and login portal. Rejects staff and admin logins, directing them to the secure Staff Portal. |
| **`StaffAuth.tsx`** | `/staff-portal` | Public (Hidden) | Authentication portal for Command and Rescue Personnel. Restricts citizen logins and lacks signup capabilities to maintain security. |
| **`Track.tsx`** | `/track` | Public | Active Operations tracking board. Renders Leaflet maps with live markers showing coordinates of active dispatches, updating via 5-second polling. |
| **`Impact.tsx`** | `/impact` | Public | Program narrative view. Uses 3D flipping card splits themed using the natural tones color palette. |
| **`ReportPortal.tsx`** | `/report-portal` | Public | Incident reporting interface. Citizens submit stray animal coordinates, descriptions, and upload photos. Integrates a background AI model to analyze the animal status. |
| **`Dashboard.tsx`** | `/dashboard` | Protected (All) | Role-based router. Directs authenticated users to either the AdminDashboard or CitizenDashboard. |
| **`CitizenDashboard.tsx`** | Rendered in `/dashboard` | Protected (Citizen) | Portal for citizens to review their historical incident filings. |
| **`AdminDashboard.tsx`** | Rendered in `/dashboard` | Protected (Staff) | Command center dashboard. Features tactical dispatch queues, incident approval actions, user permissions management, KPIs, and logs. |

---

## Security and Portal Isolation

To secure administrative credentials and operations, the authentication flow is split:

1. **Citizen Portal (`/auth`)**:
   - Manages citizen signup (sets user role to "citizen" by default).
   - Rejects admin or rescuer log in attempts, instructing them to use the Staff Portal.

2. **Staff Portal (`/staff-portal`)**:
   - Accepts admin and rescuer logins.
   - Rejects citizen logins.
   - Signup is disabled; all staff accounts must be created by administrators within the Admin Dashboard.

3. **Session Redirects**:
   - User roles are cached in localStorage upon successful authentication.
   - Session expirations or logouts trigger automated redirects to the correct portal based on the cached role flag.
   - Selecting logout clears the session token and redirects the browser to the homepage.
