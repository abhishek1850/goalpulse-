# 🚀 GoalPulse - Performance Management Portal

![GoalPulse Demo](https://img.shields.io/badge/Status-Live-success) ![Tech Stack](https://img.shields.io/badge/MERN-Stack-blue) ![License](https://img.shields.io/badge/License-MIT-green)

**GoalPulse** is an intelligent, full-stack performance management and goal-tracking platform designed to empower teams to align, track, and excel. Built with the MERN stack for a hackathon submission, it provides real-time visibility into organizational objectives.

---

## 🔗 Deployment Links

- **Live Demo (Vercel)**: [https://goalpulse-five.vercel.app](https://goalpulse-five.vercel.app)
- **Backend API (Render)**: [https://goalpulse-backend-vmbf.onrender.com/api/health](https://goalpulse-backend-vmbf.onrender.com/api/health)
- **GitHub Repository**: [https://github.com/abhishek1850/goalpulse-](https://github.com/abhishek1850/goalpulse-)

---

## 🚨 Problem Statement

Modern organizations often struggle with fragmented goal tracking. Employees lack clear visibility into how their daily tasks align with company objectives, managers find it difficult to track progress without micromanaging, and HR executives spend countless hours manually compiling performance reports. Relying on spreadsheets and disparate tools leads to a loss of accountability and misalignment.

## 💡 Proposed Solution

GoalPulse centralizes the entire objective and key results (OKR) workflow into a single, intuitive platform. It introduces a structured, role-based ecosystem where goals can be drafted, submitted for managerial approval, tracked via weekly check-ins, and audited by HR. By automating the approval loop and providing real-time data visualizations, GoalPulse ensures that everyone in the organization remains aligned and accountable.

---

## ✨ Key Features

- **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Employees, Managers, and Admins.
- **Goal Lifecycle Management:** Draft, submit, approve, or request rework on organizational goals.
- **Progress Tracking & Check-ins:** Log weekly progress updates that automatically recalculate goal completion percentages.
- **Real-Time Analytics:** Interactive charts and KPI metrics to view company-wide performance at a glance.
- **Immutable Audit Logs:** Secure tracking of all critical system actions for HR compliance.
- **Responsive Design:** A mobile-first, highly aesthetic UI that looks perfect on both desktop and 375px mobile screens.

---

## 🛠️ Tech Stack

**Frontend**
- React.js (Vite)
- Tailwind CSS
- Lucide React (Icons)
- Recharts (Data Visualization)
- Axios

**Backend**
- Node.js & Express.js
- MongoDB (Atlas) & Mongoose
- JSON Web Tokens (JWT) & bcryptjs
- CORS & Morgan

---

## 🏗️ Architecture Overview

GoalPulse utilizes a decoupled Client-Server architecture:
1. **Presentation Layer (Client):** A Single Page Application (SPA) built with React. It uses Context API for global state management (Authentication) and communicates asynchronously with the backend via Axios interceptors.
2. **Business Logic Layer (Server):** An Express.js REST API running on Node.js. It handles routing, middleware authentication (JWT), role-based guarding, and business logic execution.
3. **Data Layer (Database):** A MongoDB Atlas NoSQL cluster. It stores schemas for Users, Goals, CheckIns, and AuditLogs, ensuring high availability and flexible document structures.

---

## 👥 User Roles & Demo Credentials

You can test the live application using the following pre-configured demo accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin / HR** | `admin@goalpulse.com` | `admin123` | System oversight, user management, audit logs, and global reporting. |
| **Manager** | `manager@goalpulse.com` | `manager123` | Team oversight, goal approvals, rework requests, and team analytics. |
| **Employee** | `employee@goalpulse.com` | `employee123` | Personal goal drafting, check-ins, and individual progress tracking. |

---

## ⚙️ Installation Steps

To run the project locally, ensure you have **Node.js** (v18+) and **Git** installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhishek1850/goalpulse-.git
   cd goalpulse-
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

4. **Seed the Database (Optional but recommended):**
   ```bash
   cd ../server
   npm run seed
   ```

5. **Start the Development Servers:**
   - In the `server` directory: `npm run dev` (Runs on port 5000)
   - In the `client` directory: `npm run dev` (Runs on port 5173)

---

## 🔐 Environment Variables

You must create a `.env` file in both the `server` and `client` directories based on the provided `.env.example` files. **Never commit real secrets to version control.**

### `server/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Overview

The backend exposes a comprehensive RESTful API. Key endpoints include:

- **Auth:** `POST /api/auth/login`, `GET /api/auth/me`
- **Goals:** `POST /api/goals`, `GET /api/goals`, `PUT /api/goals/:id/status`
- **Check-ins:** `POST /api/checkins`, `GET /api/checkins/goal/:id`
- **Admin:** `GET /api/admin/dashboard`, `GET /api/admin/audit-logs`

*All protected routes require a valid Bearer Token passed in the `Authorization` header.*

---

## 🚀 Future Scope

- **AI-Powered Insights:** Implement an AI integration to analyze check-in text and suggest goal trajectory corrections.
- **Slack/Teams Integration:** Send automated webhooks to messaging platforms when goals are approved or require rework.
- **Gamification:** Introduce a badge and leaderboard system for teams hitting key milestones early.
- **Advanced Exporting:** Allow HR executives to export audit logs and quarterly performance reviews directly to PDF or CSV.

---
*Developed with ❤️ for Hackathon 2026*
