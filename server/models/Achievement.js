const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      required: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },

    // What the goal's target was at time of check-in
    plannedTarget: {
      type: String,
      default: '',
    },

    // What the employee actually achieved
    actualValue: {
      type: String,
      required: [true, 'Actual achievement value is required'],
    },

    // Computed score (0–100)
    progressScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    progressStatus: {
      type: String,
      enum: ['Not Started', 'On Track', 'Completed'],
      default: 'Not Started',
    },

    employeeComment: {
      type: String,
      default: '',
    },
    managerComment: {
      type: String,
      default: '',
    },

    checkInCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate check-in per goal per quarter
achievementSchema.index({ goal: 1, quarter: 1, year: 1 }, { unique: true });
achievementSchema.index({ employee: 1, quarter: 1, year: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
