const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    // ── Who owns this goal ───────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Core fields ──────────────────────────────────
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    thrustArea: {
      type: String,
      required: [true, 'Thrust area is required'],
      trim: true,
    },

    // ── Measurement ──────────────────────────────────
    uomType: {
      type: String,
      enum: {
        values: ['min', 'max', 'timeline', 'zero'],
        message: 'UOM type must be one of: min, max, timeline, zero',
      },
      required: [true, 'UOM type is required'],
    },
    targetValue: {
      type: String, // stored as string to support "2026-06-30" or "500" or "0"
      default: '',
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },

    // ── Weightage (must sum to 100 across all goals in a sheet) ─
    weightage: {
      type: Number,
      required: [true, 'Weightage is required'],
      min: [10, 'Minimum weightage per goal is 10%'],
      max: [100, 'Weightage cannot exceed 100%'],
    },

    // ── Status lifecycle ─────────────────────────────
    approvalStatus: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rework'],
      default: 'draft',
    },
    progressStatus: {
      type: String,
      enum: ['Not Started', 'On Track', 'Completed'],
      default: 'Not Started',
    },

    // ── Lock / Shared ────────────────────────────────
    isLocked: {
      type: Boolean,
      default: false,
    },
    isSharedGoal: {
      type: Boolean,
      default: false,
    },
    sharedGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedGoal',
      default: null,
    },

    // ── Manager feedback ─────────────────────────────
    managerComment: {
      type: String,
      default: '',
    },

    // ── Timestamps for workflow ───────────────────────
    submittedAt: { type: Date, default: null },
    approvedAt:  { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Legacy / compatibility fields ─────────────────
    // (kept so existing data / manager views don't break)
    quarter:  { type: String, default: '' },
    year:     { type: Number, default: () => new Date().getFullYear() },
    category: { type: String, default: 'performance' },
    priority: { type: String, default: 'medium' },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Compound indexes for the most common queries
goalSchema.index({ user: 1, approvalStatus: 1 });
goalSchema.index({ approvalStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Goal', goalSchema);
