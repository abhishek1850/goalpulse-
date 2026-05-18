import { useState, useEffect } from 'react';
import { getEscalations, triggerNotification } from '../services/api';
import { Loader2, AlertTriangle, Bell, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminEscalations = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    try {
      const res = await getEscalations();
      setEscalations(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (item, targetType) => {
    const actionKey = `${item.id}-${targetType}`;
    setActionLoading(actionKey);
    try {
      let targetUserId, title, message;
      
      if (targetType === 'employee') {
        targetUserId = item.employeeId;
        title = `Action Required: ${item.issue}`;
        message = `Please address the following issue: ${item.status}. Action: ${item.suggestedAction}`;
      } else if (targetType === 'manager') {
        targetUserId = item.managerId;
        title = `Manager Action Required for ${item.employeeName}`;
        message = `Pending issue: ${item.issue}. Status: ${item.status}. Action: ${item.suggestedAction}`;
      } else if (targetType === 'hr') {
        // Here we simulate an HR escalation by notifying the admin (current user or specific HR user)
        // Since we don't have a specific HR id, we will just simulate a success message
        await new Promise(r => setTimeout(r, 500));
        alert(`Simulated escalation to HR for ${item.employeeName}.`);
        setActionLoading(null);
        return;
      }

      if (!targetUserId) {
        alert('Cannot send notification: Target User ID missing.');
        setActionLoading(null);
        return;
      }

      await triggerNotification({
        targetUserId,
        title,
        message,
        type: item.type
      });

      // Show success briefly
      alert(`Notification sent to ${targetType}.`);
    } catch (e) {
      console.error(e);
      alert('Failed to send notification.');
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'danger': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-surface-50 text-surface-700 border-surface-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-sky-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-surface-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Escalation Center</h1>
        <p className="text-sm text-surface-400 mt-1">Rule-based escalations for pending performance tasks</p>
      </div>

      {escalations.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
          <h3 className="text-lg font-medium text-surface-900">All clear</h3>
          <p className="text-surface-400">There are no pending escalations at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {escalations.map((item) => (
            <div key={item.id} className={`card p-5 border ${getTypeStyles(item.type)}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-surface-900 mb-1">{item.issue}</h3>
                  <div className="text-sm space-y-1 mb-4">
                    <p><span className="font-medium">Employee:</span> {item.employeeName}</p>
                    <p><span className="font-medium">Manager:</span> {item.managerName}</p>
                    <p><span className="font-medium">Status:</span> {item.status}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded text-sm mb-4">
                    <span className="font-medium text-surface-700 block mb-1">Suggested Action:</span>
                    <span className="text-surface-600">{item.suggestedAction}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleNotify(item, 'employee')}
                      disabled={!!actionLoading}
                      className="btn bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      {actionLoading === `${item.id}-employee` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                      Notify Emp
                    </button>
                    {item.managerId && (
                      <button
                        onClick={() => handleNotify(item, 'manager')}
                        disabled={!!actionLoading}
                        className="btn bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        {actionLoading === `${item.id}-manager` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                        Notify Mgr
                      </button>
                    )}
                    <button
                      onClick={() => handleNotify(item, 'hr')}
                      disabled={!!actionLoading}
                      className="btn bg-rose-500 hover:bg-rose-600 text-white border-transparent py-1.5 px-3 text-xs flex items-center gap-1 ml-auto"
                    >
                      {actionLoading === `${item.id}-hr` ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                      Escalate HR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEscalations;
