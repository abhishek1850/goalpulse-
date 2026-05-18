const StatusBadge = ({ status }) => {
  const styles = {
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    under_review: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rework: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-purple-50 text-purple-700 border-purple-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    reviewed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
    approved: 'Approved', rework: 'Rework', completed: 'Completed',
    pending: 'Pending', reviewed: 'Reviewed', active: 'Active', inactive: 'Inactive',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'approved' || status === 'completed' || status === 'active' || status === 'reviewed' ? 'bg-emerald-500' : status === 'rework' || status === 'inactive' ? 'bg-red-500' : status === 'submitted' || status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
