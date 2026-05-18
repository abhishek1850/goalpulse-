# Hackathon Submission: GoalPulse

## 1. Project Title
**GoalPulse: Enterprise Performance Management Portal**

## 2. Problem Statement
Many organizations struggle with fragmented, manual performance management systems. Relying on spreadsheets or rigid legacy software causes a disconnect between company objectives and individual execution. Managers lack visibility into team progress, performance reviews become tedious quarterly chores, and HR teams struggle to maintain a reliable, auditable trail of employee performance and compliance.

## 3. Solution Overview
GoalPulse is a comprehensive, MERN-stack performance management platform designed to automate and streamline the goal-setting and check-in lifecycle. It brings employees, managers, and HR administrators into a unified, transparent portal. With built-in rules (e.g., maximum 8 goals, 100% total weightage), automated progress scoring, and workflow locking, GoalPulse guarantees structured alignment. The platform is backed by an immutable audit trail and an intelligent escalation engine to ensure compliance and active participation.

## 4. Key Modules
- **Smart Goal Configuration:** Employees define goals using distinct Measurement Types (Minimize, Maximize, Timeline, Zero) that dictate how future progress is algorithmically scored.
- **Workflow & Locking Engine:** A strict transition lifecycle: Draft → Submitted → Rework/Approved. Once approved, goals are locked to preserve integrity for quarterly check-ins.
- **Automated Progress Scoring:** During check-ins, the system evaluates the employee's 'Actual Value' against the 'Planned Target' and UoM type to automatically generate a progress score (0-100%).
- **Rule-Based Escalation System:** An admin feature that scans the database for stalled processes (e.g., unsubmitted goals, pending approvals, missed check-ins) and triggers internal notifications.
- **Immutable Audit Trail:** A silent observer module that logs every critical mutation (goal creation, approval, score update, role change) for absolute accountability.

## 5. Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Recharts (Analytics), Lucide React (Iconography).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas with Mongoose ODM.
- **Security & Utilities:** JSON Web Tokens (JWT), bcryptjs, json2csv.

## 6. Architecture Diagram Explanation
GoalPulse operates on a **Client-Server REST architecture**.
1. **Presentation Layer (React):** Manages Role-Based Access Control (RBAC) at the route level. It prevents UI access to unauthorized pages and dynamically renders dashboards based on the JWT payload.
2. **Application Layer (Express/Node):** Houses distinct controllers for different domains (`goalController`, `achievementController`, `adminController`). It enforces strict business logic before allowing database writes (e.g., validating that total goal weightage equals exactly 100% before allowing a sheet submission).
3. **Data Layer (MongoDB):** Utilizes relational references (e.g., Goals reference Users, Achievements reference Goals). The `AuditLog` collection operates independently, acting as an append-only ledger triggered by the Application Layer.
4. **Escalation Engine:** A specialized controller that queries aggregate data to identify bottlenecks and dispatches payloads to the `Notifications` collection.

## 7. Project Links
- **Live Demo URL:** `[Insert Vercel or Netlify URL here]`
- **GitHub Repository:** `[Insert GitHub Repo URL here]`

## 8. Login Credentials for Demo
The live demo is pre-seeded with rich data. Use the quick-login buttons on the portal or manually enter:

- **Admin / HR:** 
  - Email: `admin@goalpulse.com`
  - Password: `admin123`
- **Manager:** 
  - Email: `manager@goalpulse.com`
  - Password: `manager123`
- **Employee:** 
  - Email: `employee@goalpulse.com`
  - Password: `employee123`
