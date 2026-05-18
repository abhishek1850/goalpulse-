import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createGoal, updateGoal, getGoal } from '../services/api';
import { ArrowLeft, Target, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── UOM descriptions ───────────────────────────────── */
const UOM_INFO = {
  min:      { label: 'Minimize',  desc: 'Lower is better — e.g., reduce defect count, cut response time' },
  max:      { label: 'Maximize',  desc: 'Higher is better — e.g., increase revenue, improve coverage' },
  timeline: { label: 'Timeline',  desc: 'Complete by a specific date — e.g., deliver project by Q2 end' },
  zero:     { label: 'Zero',      desc: 'Aim for zero occurrences — e.g., zero security incidents' },
};

/* ── Suggested thrust areas ─────────────────────────── */
const THRUST_AREAS = [
  'Revenue Growth', 'Cost Optimisation', 'Customer Success',
  'Product Quality', 'Innovation', 'Learning & Development',
  'Team Collaboration', 'Process Improvement', 'Security & Compliance',
  'Performance Engineering', 'Leadership', 'Other',
];

const EMPTY_FORM = {
  title:        '',
  description:  '',
  thrustArea:   '',
  uomType:      '',
  targetValue:  '',
  deadline:     '',
  weightage:    '',
  isSharedGoal: false,
  sharedGoalId: null,
};

/* ── Form field wrapper ─────────────────────────────── */
const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="flex items-center gap-1 text-xs font-semibold text-surface-700 mb-1.5">
      {label}
      {required && <span className="text-red-500">*</span>}
      {hint && (
        <span className="ml-auto text-[11px] text-surface-400 font-normal flex items-center gap-0.5">
          <Info className="w-3 h-3" />{hint}
        </span>
      )}
    </label>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════
   CREATE / EDIT GOAL FORM
   ══════════════════════════════════════════════════════ */
const CreateGoal = () => {
  const navigate = useNavigate();
  const { id }   = useParams(); // present on edit
  const isEdit   = Boolean(id);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors]   = useState({});

  /* Load existing data on edit */
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await getGoal(id);
        const g   = res.data.data;
        setForm({
          title:        g.title        || '',
          description:  g.description  || '',
          thrustArea:   g.thrustArea   || '',
          uomType:      g.uomType      || '',
          targetValue:  g.targetValue  || '',
          deadline:     g.deadline ? g.deadline.split('T')[0] : '',
          weightage:    g.weightage    || '',
          isSharedGoal: g.isSharedGoal || false,
          sharedGoalId: g.sharedGoalId || null,
        });
      } catch {
        toast.error('Failed to load goal');
        navigate('/employee/goals');
      }
      setFetching(false);
    };
    load();
  }, [id, isEdit, navigate]);

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.title.trim())      errs.title      = 'Title is required';
    if (!form.thrustArea.trim()) errs.thrustArea  = 'Thrust area is required';
    if (!form.uomType)           errs.uomType     = 'UOM type is required';
    if (!form.deadline)          errs.deadline    = 'Deadline is required';
    else if (new Date(form.deadline) < new Date()) errs.deadline = 'Deadline must be in the future';

    const w = Number(form.weightage);
    if (!form.weightage)  errs.weightage = 'Weightage is required';
    else if (isNaN(w))    errs.weightage = 'Must be a number';
    else if (w < 10)      errs.weightage = 'Each goal must have at least 10% weightage.';
    else if (w > 100)     errs.weightage = 'Maximum is 100%';

    if (form.uomType !== 'zero' && !form.targetValue.trim()) {
      errs.targetValue = 'Target value is required for this UOM type';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the form errors below');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        weightage: Number(form.weightage),
      };

      if (isEdit) {
        await updateGoal(id, payload);
        toast.success('Goal updated successfully!');
      } else {
        await createGoal(payload);
        toast.success('Goal created successfully!');
      }
      navigate('/employee/goals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (fetching) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* ── Breadcrumb header ─────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/employee/goals"
          className="p-2 rounded-xl bg-white border border-surface-200 text-surface-600 hover:text-primary-600 hover:border-primary-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900">
            {isEdit ? 'Edit Goal' : 'Create New Goal'}
          </h1>
          <p className="text-sm text-surface-400">
            {isEdit ? 'Update your goal details below' : 'Define your performance goal clearly'}
          </p>
        </div>
      </div>

      {/* ── Form card ────────────────────────────── */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">

        {/* Title */}
        <Field label="Goal Title" required hint="Max 150 characters">
          <input
            id="goal-title"
            type="text"
            maxLength={150}
            className={`input-field ${errors.title ? 'border-red-300 focus:ring-red-200' : ''}`}
            placeholder="e.g., Increase quarterly sales by 20%"
            value={form.title}
            onChange={set('title')}
            disabled={!!form.sharedGoalId}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          <p className="text-[11px] text-surface-400 mt-1 text-right">{form.title.length}/150</p>
        </Field>

        {/* Description */}
        <Field label="Description" hint="Optional — explain context or approach">
          <textarea
            id="goal-description"
            rows={3}
            maxLength={1000}
            className="input-field resize-none"
            placeholder="Provide additional context, approach, or key milestones…"
            value={form.description}
            onChange={set('description')}
            disabled={!!form.sharedGoalId}
          />
        </Field>

        {/* Thrust Area */}
        <Field label="Thrust Area" required>
          <div className="flex gap-2">
            <input
              id="goal-thrust-area"
              type="text"
              className={`input-field flex-1 ${errors.thrustArea ? 'border-red-300 focus:ring-red-200' : ''}`}
              placeholder="e.g., Revenue Growth"
              value={form.thrustArea}
              onChange={set('thrustArea')}
              list="thrust-area-suggestions"
              disabled={!!form.sharedGoalId}
            />
            <datalist id="thrust-area-suggestions">
              {THRUST_AREAS.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          {errors.thrustArea && <p className="text-xs text-red-500 mt-1">{errors.thrustArea}</p>}
        </Field>

        {/* UOM Type */}
        <Field label="UOM Type (Unit of Measurement)" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(UOM_INFO).map(([key, { label, desc }]) => (
              <button
                key={key}
                type="button"
                onClick={() => { if (!form.sharedGoalId) { setForm((p) => ({ ...p, uomType: key })); if (errors.uomType) setErrors((p) => { const n = { ...p }; delete n.uomType; return n; }); } }}
                disabled={!!form.sharedGoalId}
                className={`
                  p-3 rounded-xl border-2 text-left transition-all
                  ${form.uomType === key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:border-primary-300 bg-white'}
                `}
                title={desc}
              >
                <p className={`text-xs font-bold ${form.uomType === key ? 'text-primary-700' : 'text-surface-700'}`}>
                  {label}
                </p>
                <p className="text-[10px] text-surface-400 mt-0.5 leading-snug line-clamp-2">{desc.split('—')[0]}</p>
              </button>
            ))}
          </div>
          {errors.uomType && <p className="text-xs text-red-500 mt-1">{errors.uomType}</p>}
          {form.uomType && (
            <p className="text-[11px] text-primary-600 bg-primary-50 rounded-lg px-3 py-2 mt-2">
              ℹ {UOM_INFO[form.uomType].desc}
            </p>
          )}
        </Field>

        {/* Target Value */}
        {form.uomType !== 'zero' && (
          <Field
            label={form.uomType === 'timeline' ? 'Target Description / Milestone' : 'Target Value'}
            required={form.uomType !== 'zero'}
            hint={form.uomType === 'min' ? 'Enter the target lower bound' : form.uomType === 'max' ? 'Enter the target upper bound' : 'Describe the deliverable'}
          >
            <input
              id="goal-target-value"
              type="text"
              className={`input-field ${errors.targetValue ? 'border-red-300 focus:ring-red-200' : ''}`}
              placeholder={
                form.uomType === 'min'      ? 'e.g., 5 (bugs), 2h (response time)' :
                form.uomType === 'max'      ? 'e.g., 500 (units), 95% (coverage)' :
                form.uomType === 'timeline' ? 'e.g., Deliver MVP, Ship v2.0 feature' :
                'e.g., 0 incidents'
              }
              value={form.targetValue}
              onChange={set('targetValue')}
              disabled={!!form.sharedGoalId}
            />
            {errors.targetValue && <p className="text-xs text-red-500 mt-1">{errors.targetValue}</p>}
          </Field>
        )}

        {/* Deadline + Weightage — 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Deadline" required>
            <input
              id="goal-deadline"
              type="date"
              className={`input-field ${errors.deadline ? 'border-red-300 focus:ring-red-200' : ''}`}
              value={form.deadline}
              min={new Date().toISOString().split('T')[0]}
              onChange={set('deadline')}
              disabled={!!form.sharedGoalId}
            />
            {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
          </Field>

          <Field label="Weightage (%)" required hint="Min 10% per goal">
            <div className="relative">
              <input
                id="goal-weightage"
                type="number"
                min={10}
                max={100}
                step={5}
                className={`input-field pr-8 ${errors.weightage ? 'border-red-300 focus:ring-red-200' : ''}`}
                placeholder="e.g., 25"
                value={form.weightage}
                onChange={set('weightage')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">%</span>
            </div>
            {errors.weightage && <p className="text-xs text-red-500 mt-1">{errors.weightage}</p>}
            {form.weightage && !errors.weightage && (
              <div className="mt-1.5 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${Math.min(form.weightage, 100)}%` }} />
              </div>
            )}
          </Field>
        </div>

        {/* Shared goal toggle */}
        <div className="flex items-center gap-3 p-4 bg-surface-50 border border-surface-200 rounded-xl">
          <input
            id="goal-shared"
            type="checkbox"
            className="w-4 h-4 rounded text-primary-600 border-surface-300 focus:ring-primary-500 cursor-pointer"
            checked={form.isSharedGoal}
            onChange={set('isSharedGoal')}
            disabled={!!form.sharedGoalId}
          />
          <div>
            <label htmlFor="goal-shared" className="text-sm font-semibold text-surface-900 cursor-pointer">
              Shared Goal
            </label>
            <p className="text-xs text-surface-400">This goal is shared with or aligned to another team member's goal</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link to="/employee/goals" className="flex-1 btn-secondary text-center py-3">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            id={isEdit ? 'update-goal-btn' : 'create-goal-btn'}
            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? 'Update Goal' : 'Create Goal'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGoal;
