# Smart Stray Rescue - Demo Data & Credentials

This document outlines the pre-seeded data for demonstration and testing purposes.

## Admin Access
- **Email**: `admin@rescue.org`
- **Password**: `admin123`
- **Role**: Admin (Full access to User Management, Report Management, Analytics)

## Rescuer Units (Personnel)
- **Emails**: 
    - `unit_alpha@rescue.org`
    - `unit_beta@rescue.org`
    - `unit_gamma@rescue.org`
- **Password**: `rescuer123`
- **Role**: Rescuer (Access to assigned missions and status updates)

## Citizen Users
- **Emails**:
    - `jane@example.com`
    - `mark@example.com`
- **Password**: `citizen123`
- **Role**: Citizen (Access to personal reporting dashboard)

## Seeded Incident Reports
15 random incident reports have been seeded across **Parañaque City** including:
- **Locations**: BF Homes, Moonwalk, Don Bosco, Sun Valley, San Antonio, Sucat.
- **Statuses**: Pending, Verified, Assigned, In-Progress, Resolved.
- **Priorities**: High, Medium, Low.
- **AI Analysis**: Mocked data for Dog/Cat classification and facial expressions (Stressed, Happy, Scared, etc.).

## How to Reset/Re-seed
Run the following command in the terminal to reset the database to its demo state:
```bash
npx tsx server/seed.ts
```
