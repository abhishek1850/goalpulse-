const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const createAuditLog = async ({
  user,
  userRole,
  action,
  entity, // legacy support
  entityType,
  entityId,
  details, // legacy support
  description,
  oldValue,
  newValue,
  ipAddress,
}) => {
  try {
    // If userRole isn't provided, try to fetch it
    let role = userRole;
    if (!role && user) {
      const u = await User.findById(user).select('role');
      if (u) role = u.role;
    }

    await AuditLog.create({
      user,
      userRole: role || 'employee',
      action,
      entityType: entityType || entity || 'system',
      entityId: entityId || null,
      description: description || details || '',
      oldValue: oldValue || null,
      newValue: newValue || null,
      ipAddress: ipAddress || '',
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = createAuditLog;
