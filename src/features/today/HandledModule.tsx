import React from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

export const HandledModule = () => {
  const { todayState } = useApp();
  const [detail, setDetail] = React.useState<any | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const base = import.meta.env.VITE_DIRECTOR_API_BASE_URL ?? 'http://127.0.0.1:4600/api/v1';
  const openDetail = async (item: any) => {
    if (!item.artifactId) return;
    setLoadingId(item.id);
    try {
      const [workResponse, artifactResponse] = await Promise.all([fetch(`${base}/agent-work/${item.id}`), fetch(`${base}/agent-work-artifacts/${item.artifactId}`)]);
      if (!workResponse.ok || !artifactResponse.ok) throw new Error('Runtime provenance unavailable');
      setDetail({ item, work: (await workResponse.json()).work, artifact: (await artifactResponse.json()).artifact });
    } finally { setLoadingId(null); }
  };

  if (!todayState) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">I Handled</h3>
      </div>

      <div className="flex-1 space-y-6">
        {todayState.handled.map(item => (
          <button key={item.id} onClick={() => void openDetail(item)} disabled={!item.artifactId || loadingId === item.id} className="w-full flex items-center justify-between gap-4 text-left rounded-lg hover:bg-surface-hover disabled:hover:bg-transparent disabled:cursor-default px-2 -mx-2 py-1">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] text-text-primary">{item.description}{loadingId === item.id ? '…' : ''}</span>
            </div>
            <span className="text-sm text-text-secondary shrink-0">{item.time}</span>
          </button>
        ))}
      </div>

      <button className="w-full py-4 text-xs font-medium text-text-muted hover:text-text-primary flex items-center justify-center gap-1 mt-4">
        View all handled <ChevronRight className="w-3 h-3" />
      </button>
      {detail && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={() => setDetail(null)}><section className="w-full max-w-lg rounded-2xl bg-bg border border-border p-6 shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-5"><div><h2 className="text-base font-medium text-text-primary">{detail.item.description}</h2><p className="text-xs text-text-secondary mt-1">Completed {new Date(detail.work.completed_at).toLocaleString()}</p></div><button onClick={() => setDetail(null)} className="text-sm text-text-secondary hover:text-text-primary">Close</button></div><dl className="mt-6 space-y-3 text-sm"><div><dt className="text-text-muted">Agent</dt><dd className="text-text-primary">{detail.work.assigned_agent_id === 'CALENDAR_TRAVEL' ? 'Calendar & Travel' : detail.work.assigned_agent_id === 'CHIEF_OF_STAFF' ? 'Chief of Staff' : detail.work.assigned_agent_id}</dd></div><div><dt className="text-text-muted">Triggered by</dt><dd className="text-text-primary">{detail.work.work_type === 'MEETING_PREPARATION' ? 'Meeting entered its preparation window' : detail.work.work_type.replaceAll('_', ' ')}</dd></div><div><dt className="text-text-muted">Source facts</dt><dd className="text-text-primary break-all">{detail.work.subject_type}: {JSON.stringify(detail.work.subject_ref)}</dd></div><div><dt className="text-text-muted">External actions</dt><dd className="text-text-primary">None</dd></div></dl><p className="mt-5 text-xs text-text-secondary">This is a persisted internal preparation artifact. No message, calendar, or external system was changed.</p></section></div>}
    </div>
  );
};
