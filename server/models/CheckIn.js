const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema(
  {
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quarter: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    achievements: {
      type: String,
      required: [true, 'Achievements description is required'],
    },
    challenges: {
      type: String,
      default: '',
    },
    selfRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    managerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    managerComments: {
      type: String,
      default: '',
    },
    progressUpdate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

checkinSchema.index({ goal: 1, quarter: 1 });
checkinSchema.index({ user: 1, quarter: 1 });

module.exports = mongoose.model('CheckIn', checkinSchema);
