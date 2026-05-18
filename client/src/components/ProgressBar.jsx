const ProgressBar = ({ percent = 0, size = 'md', showLabel = true, color = 'primary' }) => {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const getColor = () => {
    if (color !== 'auto') return colors[color] || colors.primary;
    if (percent >= 80) return colors.emerald;
    if (percent >= 50) return colors.primary;
    if (percent >= 25) return colors.amber;
    return colors.red;
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 bg-surface-100 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} bg-gradient-to-r ${getColor()} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-surface-700 w-10 text-right">{percent}%</span>}
    </div>
  );
};

export default ProgressBar;
