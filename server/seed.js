const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Goal = require('./models/Goal');
const Achievement = require('./models/Achievement');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');

const DEPARTMENTS = ['Sales', 'Operations', 'HR', 'Engineering'];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Goal.deleteMany(),
      Achievement.deleteMany(),
      AuditLog.deleteMany(),
      Notification.deleteMany(),
    ]);

    // Password hashing is handled by the User model's pre-save hook

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'HR',
      email: 'admin@goalpulse.com',
      password: 'admin123',
      role: 'admin',
      department: 'HR',
      designation: 'System Administrator',
    });
    console.log('Admin created.');

    // 2. Create Managers
    const m1 = await User.create({
      firstName: 'Sarah',
      lastName: 'Manager',
      email: 'manager@goalpulse.com',
      password: 'manager123',
      role: 'manager',
      department: 'Sales',
      designation: 'Sales Director',
    });
    
    const m2 = await User.create({
      firstName: 'Michael',
      lastName: 'Scott',
      email: 'manager2@goalpulse.com',
      password: 'manager123',
      role: 'manager',
      department: 'Engineering',
      designation: 'VP of Engineering',
    });
    console.log('Managers created.');

    // 3. Create Employees
    const empConfigs = [
      { f: 'John',   l: 'Employee', email: 'employee@goalpulse.com',  d: 'Sales',       mgr: m1._id, state: 'approved' },
      { f: 'Alice',  l: 'Smith',    email: 'employee2@goalpulse.com', d: 'Sales',       mgr: m1._id, state: 'rework' },
      { f: 'Bob',    l: 'Jones',    email: 'employee3@goalpulse.com', d: 'Operations',  mgr: m1._id, state: 'submitted' },
      { f: 'Emma',   l: 'Davis',    email: 'employee4@goalpulse.com', d: 'Operations',  mgr: m1._id, state: 'draft' },
      { f: 'David',  l: 'Wilson',   email: 'employee5@goalpulse.com', d: 'HR',          mgr: m2._id, state: 'approved' },
      { f: 'Olivia', l: 'Brown',    email: 'employee6@goalpulse.com', d: 'HR',          mgr: m2._id, state: 'approved_delayed' },
      { f: 'James',  l: 'Taylor',   email: 'employee7@goalpulse.com', d: 'Engineering', mgr: m2._id, state: 'submitted' },
      { f: 'Sophia', l: 'Miller',   email: 'employee8@goalpulse.com', d: 'Engineering', mgr: m2._id, state: 'draft' },
    ];

    const employees = [];
    for (const c of empConfigs) {
      const emp = await User.create({
        firstName: c.f,
        lastName: c.l,
        email: c.email,
        password: 'employee123',
        role: 'employee',
        department: c.d,
        designation: `${c.d} Specialist`,
        manager: c.mgr,
      });
      employees.push({ ...emp.toObject(), state: c.state });
    }
    console.log('Employees created.');

    // 4. Create Goals & Achievements & Logs
    const UOMS = ['min', 'max', 'timeline', 'zero'];
    
    for (const emp of employees) {
      let isLocked = ['approved', 'approved_delayed'].includes(emp.state);
      let status = emp.state === 'approved_delayed' ? 'approved' : emp.state;
      
      const goalsToCreate = [
        { title: `Increase Output for ${emp.department}`, uomType: 'max', w: 30, t: '500 units' },
        { title: `Reduce Errors in ${emp.department}`, uomType: 'min', w: 20, t: '10 errors' },
        { title: `Deliver Q2 Project`, uomType: 'timeline', w: 40, t: 'End of Q2' },
        { title: `Zero Incidents`, uomType: 'zero', w: 10, t: '0' },
      ];

      for (let i = 0; i < goalsToCreate.length; i++) {
        const g = goalsToCreate[i];
        const goal = await Goal.create({
          user: emp._id,
          title: g.title,
          description: `Description for ${g.title}`,
          thrustArea: 'Performance',
          uomType: g.uomType,
          targetValue: g.t,
          deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)), // 6 months from now
          weightage: g.w,
          quarter: 'Q1',
          year: 2024,
          approvalStatus: status,
          isLocked: isLocked,
          managerComment: status === 'rework' ? 'Please adjust target values to be more realistic.' : '',
          approvedBy: isLocked ? emp.manager : null,
          progressStatus: 'Not Started',
          progressPercent: 0
        });

        // Audit Log for Goal Creation
        await AuditLog.create({
          user: emp._id, userRole: 'employee', action: 'goal_created', entityType: 'goal', entityId: goal._id,
          description: `Created Goal: ${goal.title}`
        });

        if (status === 'submitted') {
          await AuditLog.create({
            user: emp._id, userRole: 'employee', action: 'goal_sheet_submitted', entityType: 'goal',
            description: `Submitted Goal Sheet`
          });
        }
        
        if (status === 'rework') {
          await AuditLog.create({
            user: emp.manager, userRole: 'manager', action: 'goal_sheet_returned', entityType: 'goal',
            description: `Returned Goal Sheet`
          });
          
          await Notification.create({
            recipient: emp._id, title: 'Goal Sheet Returned', message: 'Your manager has requested rework.', type: 'warning'
          });
        }

        if (isLocked) {
          await AuditLog.create({
            user: emp.manager, userRole: 'manager', action: 'goal_sheet_approved', entityType: 'goal',
            description: `Approved Goal Sheet`
          });
          
          // Generate Check-ins / Achievements
          if (emp.state === 'approved') {
            // Healthy progress
            const achv = await Achievement.create({
              goal: goal._id, employee: emp._id, quarter: 'Q1', year: 2024,
              plannedTarget: g.t, actualValue: 'On pace', progressScore: 85, progressStatus: 'On Track',
              employeeComment: 'Making good progress.', managerComment: 'Keep it up!', checkInCompleted: true
            });
            await AuditLog.create({
              user: emp._id, userRole: 'employee', action: 'achievement_logged', entityType: 'achievement', entityId: achv._id,
              description: `Logged Q1 Achievement for ${goal.title}`
            });
            
            goal.progressStatus = 'On Track';
            goal.progressPercent = 85;
            await goal.save();
          } else if (emp.state === 'approved_delayed') {
            // Delayed progress
            await Achievement.create({
              goal: goal._id, employee: emp._id, quarter: 'Q1', year: 2024,
              plannedTarget: g.t, actualValue: 'Behind schedule', progressScore: 30, progressStatus: 'Not Started',
              employeeComment: 'Facing roadblocks.', checkInCompleted: true
            });
            goal.progressStatus = 'Not Started';
            goal.progressPercent = 30;
            await goal.save();
          }
        }
      }
    }
    console.log('Goals and Achievements created.');

    // 5. Some system audit logs & notifications
    await AuditLog.create({ user: admin._id, userRole: 'admin', action: 'goal_unlocked', entityType: 'goal', description: 'Admin unlocked a goal for editing' });
    await Notification.create({ recipient: m1._id, title: 'Pending Approvals', message: 'You have goal sheets waiting for review.', type: 'info' });
    
    console.log('Seed Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
