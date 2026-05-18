const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');
const { Parser } = require('json2csv');

const buildAchievementPipeline = (query) => {
  const { department, manager, quarter, approvalStatus, progressStatus } = query;

  const pipeline = [];

  // Lookup goal
  pipeline.push({
    $lookup: {
      from: 'goals',
      localField: 'goal',
      foreignField: '_id',
      as: 'goalData'
    }
  });
  pipeline.push({ $unwind: '$goalData' });

  // Lookup employee
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'employee',
      foreignField: '_id',
      as: 'employeeData'
    }
  });
  pipeline.push({ $unwind: '$employeeData' });

  // Lookup manager
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'employeeData.manager',
      foreignField: '_id',
      as: 'managerData'
    }
  });
  pipeline.push({
    $unwind: { path: '$managerData', preserveNullAndEmptyArrays: true }
  });

  const match = {};

  if (quarter) match.quarter = quarter;
  if (progressStatus) match.progressStatus = progressStatus;
  if (approvalStatus) match['goalData.approvalStatus'] = approvalStatus;
  if (department) match['employeeData.department'] = department;
  
  if (manager) {
    match['managerData._id'] = new mongoose.Types.ObjectId(manager);
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // Format output
  pipeline.push({
    $project: {
      employeeName: { $concat: ['$employeeData.firstName', ' ', '$employeeData.lastName'] },
      department: { $ifNull: ['$employeeData.department', 'N/A'] },
      managerName: { $ifNull: [{ $concat: ['$managerData.firstName', ' ', '$managerData.lastName'] }, 'No Manager'] },
      goalTitle: '$goalData.title',
      thrustArea: '$goalData.thrustArea',
      uomType: '$goalData.uomType',
      plannedTarget: '$plannedTarget',
      actualAchievement: '$actualValue',
      progressScore: '$progressScore',
      quarter: '$quarter',
      progressStatus: '$progressStatus',
      approvalStatus: '$goalData.approvalStatus',
      checkInCompleted: { $cond: ['$checkInCompleted', 'Yes', 'No'] }
    }
  });

  return pipeline;
};

exports.getAchievementReport = async (req, res, next) => {
  try {
    const pipeline = buildAchievementPipeline(req.query);
    const results = await Achievement.aggregate(pipeline);

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

exports.exportAchievementReportCsv = async (req, res, next) => {
  try {
    const pipeline = buildAchievementPipeline(req.query);
    const results = await Achievement.aggregate(pipeline);

    const fields = [
      { label: 'Employee Name', value: 'employeeName' },
      { label: 'Department', value: 'department' },
      { label: 'Manager Name', value: 'managerName' },
      { label: 'Goal Title', value: 'goalTitle' },
      { label: 'Thrust Area', value: 'thrustArea' },
      { label: 'UoM Type', value: 'uomType' },
      { label: 'Planned Target', value: 'plannedTarget' },
      { label: 'Actual Achievement', value: 'actualAchievement' },
      { label: 'Progress Score', value: 'progressScore' },
      { label: 'Quarter', value: 'quarter' },
      { label: 'Progress Status', value: 'progressStatus' },
      { label: 'Approval Status', value: 'approvalStatus' },
      { label: 'Check-in Completed', value: 'checkInCompleted' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(results);

    res.header('Content-Type', 'text/csv');
    res.attachment('goalpulse-achievement-report.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};
