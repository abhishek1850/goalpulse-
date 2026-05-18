const User = require('../models/User');
const Goal = require('../models/Goal');
const Achievement = require('../models/Achievement');
const Notification = require('../models/Notification');

exports.getEscalations = async (req, res, next) => {
  try {
    const escalations = [];

    // All active employees
    const employees = await User.find({ role: 'employee', isActive: true }).populate('manager', 'firstName lastName _id');

    // Rules logic:
    for (const emp of employees) {
      // Get goals for employee
      const goals = await Goal.find({ user: emp._id });
      
      const managerName = emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'No Manager';
      const managerId = emp.manager ? emp.manager._id : null;

      // 1. Employee has not submitted goals
      if (goals.length === 0 || goals.every(g => g.approvalStatus === 'draft')) {
        escalations.push({
          id: `draft-${emp._id}`,
          employeeId: emp._id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          managerId,
          managerName,
          issue: 'Goals Not Submitted',
          status: 'Goals are still in draft or not created',
          suggestedAction: 'Remind employee to submit goals for approval',
          type: 'warning'
        });
      }

      // 2. Manager has not approved submitted goals
      if (goals.some(g => g.approvalStatus === 'submitted')) {
        escalations.push({
          id: `submitted-${emp._id}`,
          employeeId: emp._id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          managerId,
          managerName,
          issue: 'Pending Manager Approval',
          status: 'Goals submitted but not approved',
          suggestedAction: 'Remind manager to review goals',
          type: 'info'
        });
      }

      // 3. Goal sheet returned for rework but not resubmitted
      if (goals.some(g => g.approvalStatus === 'rework')) {
        escalations.push({
          id: `rework-${emp._id}`,
          employeeId: emp._id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          managerId,
          managerName,
          issue: 'Goals Rework Pending',
          status: 'Returned by manager, not yet resubmitted',
          suggestedAction: 'Remind employee to update and resubmit goals',
          type: 'danger'
        });
      }

      // 4. Quarterly check-in is pending
      // Find active achievements for this user where checkInCompleted is false
      // Or find goals that have no achievement record for the current quarter
      const currentQuarter = 'Q2'; // Using a static quarter for simplicity or get dynamically
      const achievements = await Achievement.find({ employee: emp._id, quarter: currentQuarter });
      
      if (goals.some(g => g.approvalStatus === 'approved')) {
        const approvedGoals = goals.filter(g => g.approvalStatus === 'approved');
        let checkInPending = false;
        
        for (const ag of approvedGoals) {
          const ach = achievements.find(a => a.goal.toString() === ag._id.toString());
          if (!ach || !ach.checkInCompleted) {
            checkInPending = true;
            break;
          }
        }

        if (checkInPending) {
          escalations.push({
            id: `checkin-${emp._id}`,
            employeeId: emp._id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            managerId,
            managerName,
            issue: 'Check-in Pending',
            status: 'Quarterly check-in not completed',
            suggestedAction: 'Remind employee to complete check-in',
            type: 'warning'
          });
        }
      }
    }

    res.json({ success: true, count: escalations.length, data: escalations });
  } catch (error) {
    next(error);
  }
};

exports.triggerNotification = async (req, res, next) => {
  try {
    const { targetUserId, title, message, type } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }

    await Notification.create({
      recipient: targetUserId,
      title,
      message,
      type: type || 'info'
    });

    res.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    next(error);
  }
};
