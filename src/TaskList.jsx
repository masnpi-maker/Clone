import { useState } from "react";
import "./TaskList.css";

const STATUS_LABELS = { todo: "Laukiama", in_progress: "Vykdoma", completed: "Atlikta" };
const PRIORITY_LABELS = { low: "Žemas", medium: "Vidutinis", high: "Aukštas" };

function TaskList({ tasks = [], loading = false, onRetry, onUpdate, onDelete, busyTaskId }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saveError, setSaveError] = useState("");

  if (loading) return <section className="task-card"><p className="task-state">Kraunamos užduotys…</p></section>;
  if (!tasks.length) return <section className="task-card"><p className="task-state">Užduočių kol kas nėra.</p>{onRetry && <button className="task-action" type="button" onClick={onRetry}>Atnaujinti</button>}</section>;

  function startEdit(task) { setEditingId(task.id); setDraft({ title: task.title, description: task.description || "", deadline: task.deadline || "", priority: task.priority || "medium", status: task.status }); setSaveError(""); }
  async function save(taskId) {
    if (!draft.title.trim()) { setSaveError("Įveskite užduoties pavadinimą."); return; }
    const result = await onUpdate(taskId, { ...draft, title: draft.title.trim(), description: draft.description.trim() || null, deadline: draft.deadline || null });
    if (!result?.error) { setEditingId(null); setDraft(null); }
  }

  return <section className="task-card"><header className="task-card__header"><h2>Užduotys</h2><p>Artimiausi darbai ir jų būsena</p></header><div className="task-list">
    {tasks.map((task) => <article className="task-item" key={task.id}>
      {editingId === task.id ? <div className="task-edit-form">
        <label>Pavadinimas<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}/></label>
        <label>Aprašymas<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></label>
        <div className="task-edit-grid"><label>Terminas<input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}/></label><label>Prioritetas<select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{Object.entries(PRIORITY_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Būsena<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{Object.entries(STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div>
        {saveError && <p className="login-error" role="alert">{saveError}</p>}<div className="task-actions"><button type="button" className="task-action task-action--primary" disabled={busyTaskId === task.id} onClick={() => save(task.id)}>Išsaugoti</button><button type="button" className="task-action" onClick={() => setEditingId(null)}>Atšaukti</button></div>
      </div> : <>
        <div className="task-item__top"><div><h3>{task.title}</h3>{task.description && <p className="task-description">{task.description}</p>}</div><span className={`task-status task-status--${task.status}`}>{STATUS_LABELS[task.status] || task.status}</span></div>
        <div className="task-meta"><span>Prioritetas: <strong>{PRIORITY_LABELS[task.priority] || "Vidutinis"}</strong></span><span>{task.deadline ? `Terminas: ${task.deadline}` : "Terminas nenurodytas"}</span></div>
        <div className="task-actions"><button type="button" className="task-action task-action--primary" onClick={() => startEdit(task)}>Redaguoti</button><button type="button" className="task-action task-action--danger" disabled={busyTaskId === task.id} onClick={() => onDelete(task.id)}>{busyTaskId === task.id ? "Vykdoma…" : "Ištrinti"}</button></div>
      </>}
    </article>)}
  </div></section>;
}

export default TaskList;
