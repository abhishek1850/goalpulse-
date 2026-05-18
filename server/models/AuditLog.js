const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
    },
    userRole: {
      type   : String,
      enum   : ['employee', 'manager', 'admin'],
      default: 'employee',
    },
    action: {
      type    : String,
      required: true,
      // e.g. goal_created | goal_edited | goal_deleted | goal_submitted
      //      manager_goal_edited | goal_sheet_approved | goal_sheet_returned
      //      achievement_logged  | checkin_commented
      //      goal_unlocked | manager_assigned | user_created
    },
    entityType: {
      type   : String,
      enum   : ['goal', 'achievement', 'user', 'system'],
      default: 'system',
    },
    entityId: {
      type   : mongoose.Schema.Types.ObjectId,
      default: null,
    },
    oldValue: {
      type   : mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type   : mongoose.Schema.Types.Mixed,
      default: null,
    },
    description: {
      type   : String,
      default: '',
    },
    ipAddress: {
      type   : String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ userRole: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
