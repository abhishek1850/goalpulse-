# GoalPulse
**Enterprise Goal Setting & Quarterly Check-in Portal**

**Hackathon:** AtomQuest Hackathon 1.0  
**Problem Statement:** In-House Goal Setting & Tracking Portal  
**Team Name:** [ADD_TEAM_NAME_HERE]  
**Team Members:** [ADD_TEAM_MEMBERS_HERE]  

---

## 1. Problem Statement
Organizations heavily reliant on spreadsheets, scattered emails, and manual review cycles face systemic challenges in performance management. Such disconnected methods lead to poor alignment of individual tasks with corporate objectives, zero real-time visibility, weak accountability, and non-existent audit readiness. Managers struggle to monitor progress without micromanaging, employees lack clarity on expectations, and HR executives are burdened with compiling data manually during chaotic appraisal cycles.

## 2. Proposed Solution
**GoalPulse** is a comprehensive, role-based web portal designed to digitize and automate the entire goal lifecycle. It provides a structured environment where employees can independently draft and submit goals, managers can review and approve them through intuitive workflows, and Admin/HR teams can monitor organization-wide progress. Through centralized dashboards, automated progress calculations, immutable audit logs, and actionable reporting, GoalPulse eliminates spreadsheet chaos and enforces continuous performance tracking.

---

## 3. User Roles

| Role | Responsibilities & System Capabilities |
| :--- | :--- |
| **Employee** | - Create and draft personal goals based on Thrust Areas.<br>- Submit goal sheets for manager approval.<br>- Perform quarterly check-ins and log achievements.<br>- Track personal goal health and progress scores. |
| **Manager (L1)** | - Review submitted team goal sheets.<br>- Approve goals (locks them) or return them for rework with feedback.<br>- Provide qualitative comments during quarterly check-ins.<br>- Monitor overall team analytics and escalations. |
| **Admin / HR** | - Full system oversight and governance.<br>- Access organization-wide dashboards and health metrics.<br>- View immutable Audit Logs for compliance.<br>- Generate reports and export data to CSV.<br>- Manage user accounts and system configuration. |

---

## 4. Core Features Implemented

- **Role-Based Access Control:** Distinct authentication and isolated dashboards for Employees, Managers, and Admins.
- **Robust Goal Creation:** Employees define Thrust Area, Goal Title, Description, Unit of Measure (UoM), Target, Deadline, and Weightage.
- **Strict BRD Validations:**
  - Total weightage across an employee's goals must equal exactly 100%.
  - Minimum weightage per goal is 10%.
  - Maximum of 8 goals allowed per employee.
- **Approval & Rework Workflow:** Managers can approve goals (locking them from further edits) or return them for rework.
- **Quarterly Achievement Updates:** Employees log achievements incrementally, allowing for continuous tracking rather than annual surprises.
- **Automated Progress Scoring:** Dynamic score calculations based on the UoM type (Min, Max, Zero-based, Timeline).
- **Check-in Comments:** Managers can leave constructive feedback on specific achievements.
- **Admin Dashboard & Audit Logs:** Real-time metrics and a secure trail of all critical system actions.
- **Reports & CSV Export:** One-click data exports for HR processing.
- **Shared Goals:** Visibility into cross-functional objectives.
- **Notifications & Escalation Center:** Alerts for pending approvals and delayed check-ins.
- **Goal Health Score:** Visual indicators of goal status (On Track, At Risk, Delayed).
- **Responsive UI:** Seamless experience across desktop and mobile devices.

---

## 5. Workflow Explanation

The GoalPulse ecosystem operates on a linear, structured timeline:
1. **Goal Creation:** Employee creates and drafts goals based on business requirements.
2. **Submission:** Employee submits the completed goal sheet for review.
3. **Managerial Review:** Manager reviews the submission and either approves it or returns it for rework.
4. **Goal Locking:** Once approved, the goals are locked to ensure data integrity.
5. **Quarterly Updates:** The employee periodically updates achievements against the locked targets.
6. **Progress Calculation:** The system automatically calculates the progress score based on predefined rules.
7. **Manager Feedback:** The manager reviews the check-ins and adds qualitative comments.
8. **HR Oversight:** Admin/HR continuously views high-level dashboards, reviews audit logs, and exports compliance reports.

---

## 6. Progress Score Logic

Progress percentages are calculated intelligently based on the goal's Unit of Measure (UoM):
- **Min / Higher is better:** `(Actual / Target) × 100` *(e.g., Sales revenue)*
- **Max / Lower is better:** `(Target / Actual) × 100` *(e.g., Number of bugs reported)*
- **Zero-based:** If Actual is exactly 0, score is 100%; otherwise 0%. *(e.g., Zero safety incidents)*
- **Timeline:** If completed before or exactly on the deadline, score is 100%; if delayed, the score is penalized based on the overrun duration.

---

## 7. Architecture Diagram Section

GoalPulse leverages a modern, decoupled **Client-Server** architecture, utilizing RESTful principles and JWT authentication for stateless, secure communication.

```text
User Browser
(Employee / Manager / Admin)
        |
        v
React Frontend
Vite + Tailwind CSS + Recharts
Hosted on Vercel
        |
        | REST API + JWT Authentication
        v
Node.js + Express Backend
Hosted on Render
        |
        | Mongoose ODM
        v
MongoDB Atlas
Users | Goals | Achievements | Audit Logs | Notifications | Shared Goals
```

**Module Overview:**
- **Auth Module:** Manages JWT generation and role-based route guarding.
- **Goal & Approval Module:** Handles BRD validations and the lock/unlock state machine.
- **Achievement Module:** Processes the mathematical logic for progress scoring.
- **Admin & Audit Module:** Tracks immutable system changes and aggregates high-level analytics.
- **Escalation Engine:** Flags overdue approvals and missing check-ins.

---

## 8. Deployment Details

The platform is fully containerized and deployed in the cloud for high availability:
- **Frontend:** [https://goalpulse-five.vercel.app](https://goalpulse-five.vercel.app)
- **Backend API:** [https://goalpulse-backend-vmbf.onrender.com](https://goalpulse-backend-vmbf.onrender.com)
- **Database:** MongoDB Atlas (Cloud NoSQL)
- **Repository:** [https://github.com/abhishek1850/goalpulse-](https://github.com/abhishek1850/goalpulse-)

---

## 9. Demo Credentials

You may test the live environment using the following accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin / HR** | `admin@goalpulse.com` | `admin123` |
| **Manager** | `manager@goalpulse.com` | `manager123` |
| **Employee** | `employee@goalpulse.com` | `employee123` |

---

## 10. What Makes GoalPulse Different

- **Holistic Lifecycle:** It goes beyond simple CRUD operations to enforce a strict, compliant business workflow (Draft → Rework → Approve → Lock).
- **Intelligent Validations:** Strict enforcement of 100% weightage rules and goal limits.
- **Audit-Ready Design:** Every significant action is logged immutably, ensuring HR and corporate compliance.
- **Escalation & Health Tracking:** Proactive identification of delayed goals rather than reactive reporting.
- **Production-Ready:** Live, secure, and accessible via Vercel, Render, and MongoDB Atlas.
- **Stunning UI/UX:** A highly polished, responsive interface that users will genuinely enjoy using.

---

## 11. Cost Optimization

GoalPulse is architected to be incredibly cost-efficient and scalable:
- **Vercel Frontend:** Utilizes the free tier for edge-network static hosting.
- **Render Backend:** Leverages free-tier web service hosting for the Node.js API.
- **MongoDB Atlas:** Uses the M0 free cluster, optimized with proper indexing and structured collections to minimize read/write operations.
- **Lightweight Architecture:** Eliminates the need for costly third-party UI libraries or heavy ORMs, relying on standard React and Mongoose.
- **Zero Paid Services:** Fully operational without requiring monthly subscriptions to external APIs or tools.

---

## 12. Future Scope

- **Microsoft Entra ID SSO:** Seamless corporate login integration.
- **Microsoft Teams Notifications:** Real-time webhooks for approvals and check-ins directly into chat channels.
- **AI-Assisted SMART Goals:** Leveraging LLMs to help employees draft Specific, Measurable, Achievable, Relevant, and Time-bound objectives.
- **Advanced Predictive Analytics:** Forecasting team performance based on historical check-in velocity.
- **360-Degree Feedback:** Incorporating peer reviews into the appraisal workflow.
- **Dedicated Mobile App:** For on-the-go progress updates and approval notifications.

---

## 13. Final Submission Links

- **Live Demo URL:** [https://goalpulse-five.vercel.app](https://goalpulse-five.vercel.app)
- **Backend API URL:** [https://goalpulse-backend-vmbf.onrender.com](https://goalpulse-backend-vmbf.onrender.com)
- **GitHub Repository:** [https://github.com/abhishek1850/goalpulse-](https://github.com/abhishek1850/goalpulse-)
- **Demo Accounts:** Reference Section 9 for `admin123`, `manager123`, and `employee123` credentials.
