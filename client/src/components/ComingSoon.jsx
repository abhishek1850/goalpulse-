/**
 * Reusable Coming-Soon / Placeholder page component.
 * Used for features that aren't yet fully implemented.
 */
const ComingSoon = ({ icon: Icon, title, description, features = [] }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
    {/* Icon blob */}
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-xl shadow-primary-200">
      <Icon className="w-10 h-10 text-white" />
    </div>

    <h2 className="text-2xl font-bold text-surface-900 mb-2">{title}</h2>
    <p className="text-surface-400 text-sm max-w-md leading-relaxed mb-8">{description}</p>

    {features.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2.5 bg-white border border-surface-100 rounded-xl px-4 py-3 text-left shadow-card">
            <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
            <span className="text-sm text-surface-700 font-medium">{f}</span>
          </div>
        ))}
      </div>
    )}

    <div className="mt-8 inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold px-4 py-2 rounded-full">
      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse-soft" />
      Coming soon in next release
    </div>
  </div>
);

export default ComingSoon;
