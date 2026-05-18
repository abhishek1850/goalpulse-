const mongoose = require('mongoose');

const sharedGoalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    thrustArea: {
      type: String,
      required: true,
    },
    uomType: {
      type: String,
      enum: ['min', 'max', 'timeline', 'zero'],
      required: true,
    },
    targetValue: {
      type: String,
      default: '',
    },
    deadline: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    primaryOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SharedGoal', sharedGoalSchema);
