# AI-Powered Software & Client Management Portal — Build Plan

A premium, responsive portal for a software agency/team to manage projects, tasks,
teams, and clients — with a dedicated client-facing dashboard and Google Gemini AI features.

## Stack decision (please confirm)
You asked for a **strict MERN stack (MongoDB, Express.js, React.js, Node.js)** and explicitly
do **not** want Python/FastAPI. This will be built as a **true MERN app**: a Node.js + Express
backend replacing the default backend, with React frontend and MongoDB.

- Risk to accept: this platform is primarily tuned for a Python backend. Running Node/Express
  here is possible but is a non-standard configuration, so setup/hosting may need extra care and
  some platform automation may behave differently. You've indicated you accept this.

## Google Gemini AI — key needed from you
AI features use the **Google Gemini API with your own free API key**.
- You will need to create a free key at **Google AI Studio** (aistudio.google.com → "Get API key").
  The free tier is sufficient for testing.
- Please provide that key when the build starts; it will be stored as an environment variable
  (never hardcoded).

AI features included:
- AI project/task **summaries & status reports**
- AI **task generation from a project brief**
- AI-drafted **client communication / emails**

## Roles
Three roles: **Admin**, **Team member**, and **Client**.
- Admin: full control — manage users, projects, tasks, teams, clients, invoices.
- Team member: work on assigned projects/tasks, message clients.
- Client: view only their own projects, progress, messages, files, and invoices.

## Authentication
**Both** methods:
- Email + password (JWT-based).
- Google social login.

Note to confirm: Google social login in a pure Node/Express app requires **Google OAuth
credentials** (Client ID/Secret from Google Cloud Console). If you can provide those, Google
login goes in from the start. Otherwise the assumption is: **launch with email+password first**
and add Google login once credentials are available.

## Core features

Admin / Team portal:
- Dashboard with key stats (active projects, tasks by status, clients, revenue overview).
- Projects: create/edit, assign team + client, track status and % progress, deadlines.
- Tasks: create/assign, priority, status board (to-do / in-progress / done), due dates.
- Team management: invite/manage team members and their roles.
- Client management: client profiles, linked projects, contact info.
- Invoices: create and track invoices per client (amount, line items, status: draft/sent/paid).

Client dashboard:
- **Project progress & status** for their own projects.
- **Messaging/communication** with the team (per-project threads).
- **Invoices** they can view and mark/track.
- File area for project files (view/download; uploads shared by the team).

Assumption on payments: invoices will be **created and tracked** (statuses like sent/paid)
without a live payment gateway in the first version, to keep it free of paid services.
A real online-payment provider (e.g. Stripe) can be added later on request.

## Design
Premium, modern, professional UI with a distinctive, non-generic look — responsive across
desktop and mobile, with polished dashboards, status boards, and clear role-based navigation.

## Out of scope (first version)
- Live online payment collection / payment gateway.
- Real-time push notifications and video calls.
- Native mobile apps.

## Open questions
1. Google login: can you provide Google OAuth Client ID/Secret now, or start with
   email+password and add Google login later?
2. Confirm invoices as **tracking-only** (no live payment gateway) for v1.
