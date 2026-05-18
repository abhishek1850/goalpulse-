# 🎯 GoalPulse: Enterprise Performance Management Portal

![GoalPulse Banner](https://via.placeholder.com/1200x300?text=GoalPulse+-+Performance+Management+Made+Simple)

## 📌 Problem Statement
In many organizations, performance management and goal tracking are still handled using fragmented spreadsheets or rigid legacy systems. This leads to:
- Lack of alignment between individual goals and company objectives.
- Tedious, manual, and inconsistent quarterly review processes.
- Poor visibility for management regarding team health and progress.
- Difficulty in maintaining a secure, auditable trail of performance changes.

## 💡 Proposed Solution
**GoalPulse** is a dynamic, fully-featured MERN stack web application that transforms the performance management lifecycle. It provides a centralized, transparent, and auditable platform for employees to set goals, managers to review them, and administrators to oversee organizational health.

## ✨ Key Features
- **Smart Goal Setting:** Create performance goals with flexible Units of Measurement (Minimize, Maximize, Timeline, Zero).
- **Automated Workflows:** End-to-end lifecycle tracking (Draft → Submitted → Reviewed → Approved → Checked-in).
- **Intelligent Scoring:** Automated progress score calculation algorithms based on target values and actual achievements.
- **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Employees, Managers, and Admins.
- **Live Health Scores:** Real-time goal health indicators (Healthy, At Risk, Delayed, Needs Attention).
- **Rule-based Escalations:** Automated detection of stalled performance processes with internal notification triggers.
- **Immutable Audit Trail:** Comprehensive tracking of all system actions for HR compliance.
- **Reporting & Exports:** Detailed CSV exports for organizational achievements and progress.

## 🛠 Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, React Router DOM, Recharts, Lucide React, Axios.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs.
- **Utilities:** json2csv (Reporting).

## 🏗 Architecture Overview
GoalPulse uses a standard Client-Server RESTful architecture. 
The React frontend handles the UI, routing, and client-side validation. It communicates securely via JWT-authenticated HTTP requests to the Node.js/Express backend. The backend processes the complex business logic (weightage constraints, progress algorithms, workflow validation) and interacts with the MongoDB database. The system also includes an event-driven Audit Logger that records state mutations into a protected collection.

## 👥 User Roles
1. **Employee:** Can draft goals, submit goal sheets (must equal exactly 100% weightage), and log quarterly achievements against approved goals.
2. **Manager:** Can view their team's goals, approve goal sheets, request reworks, and provide feedback on employee achievements.
3. **Admin (HR):** Has global visibility. Can manage users, oversee organizational health via the dashboard, export CSV reports, view system audit logs, and trigger escalations.

## 🔑 Demo Credentials
Access the live demo using the following quick credentials:
- **Admin / HR:** `admin@goalpulse.com` / `admin123`
- **Manager:** `manager@goalpulse.com` / `manager123`
- **Employee:** `employee@goalpulse.com` / `employee123`

## 🚀 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd goalpulse
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

4. **Seed the Database (Optional but Recommended):**
   ```bash
   cd ../server
   npm run seed
   ```

5. **Run the Application:**
   Open two terminals:
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev

   # Terminal 2: Frontend
   cd client
   npm run dev
   ```

## ⚙️ Environment Variables

**Server (`server/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

**Client (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔌 API Overview
The backend exposes modular RESTful endpoints:
- `/api/auth`: Login, Registration, and context validation.
- `/api/goals`: CRUD operations for goals, sheet submission, and progress updates.
- `/api/manager`: Specialized endpoints for team oversight and sheet approvals/reworks.
- `/api/achievements`: Check-in logging and progress score computations.
- `/api/admin`: User management, global oversight, dashboard stats, and audit log retrieval.
- `/api/reports`: Aggregation pipelines and CSV generation.
- `/api/escalations` & `/api/notifications`: Internal messaging and workflow blockage detection.

## 📸 Screenshots
*(Placeholder: Add screenshots of the Employee Dashboard, Manager Review Screen, and Admin Audit Trail here)*

## 🌍 Deployment Links
- **Live Demo:** `[Insert Vercel URL]`
- **Backend API:** `[Insert Render URL]`

## 🔭 Future Scope
- **AI-Assisted Goal Generation:** Integrating LLMs to suggest SMART goals based on job titles and thrust areas.
- **360-Degree Feedback:** Expanding the portal to include peer-to-peer reviews.
- **Slack/Teams Integration:** Pushing system notifications and escalation alerts directly to corporate messaging tools.
