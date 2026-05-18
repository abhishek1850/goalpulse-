const DashboardCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
  const gradients = {
    primary: 'from-primary-500 to-primary-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    purple: 'from-purple-500 to-purple-700',
    rose: 'from-rose-500 to-rose-700',
    cyan: 'from-cyan-500 to-cyan-700',
  };

  return (
    <div className="card p-6 group cursor-default">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-300 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-surface-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-surface-300 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-semibold mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last quarter
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
