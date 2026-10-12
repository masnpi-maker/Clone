import { useState } from "react";
import "./AddTaskForm.css";

function AddTaskForm({ onAddTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim()) { setError("Įveskite užduoties pavadinimą."); return; }
    setBusy(true); setError("");
    const result = await onAddTask({ title, description, deadline, priority });
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    setTitle(""); setDescription(""); setDeadline(""); setPriority("medium"); setIsOpen(false);
  }

  if (!isOpen) return <div className="add-task"><button type="button" className="add-task__open-button" onClick={() => setIsOpen(true)}>+ Nauja užduotis</button></div>;
  return <div className="add-task"><div className="add-task__card"><div className="add-task__header"><div><h2>Nauja užduotis</h2><p>Pridėkite naują užduotį į savo sąrašą</p></div><button type="button" className="add-task__close" onClick={() => setIsOpen(false)} aria-label="Uždaryti">×</button></div>
    <form className="add-task__form" onSubmit={handleSubmit}>
      <label className="add-task__field"><span>Užduoties pavadinimas</span><input type="text" placeholder="Pvz. Sukurti profilio puslapį" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength="200"/></label>
      <label className="add-task__field"><span>Aprašymas</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3"/></label>
      <label className="add-task__field"><span>Prioritetas</span><select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="low">Žemas</option><option value="medium">Vidutinis</option><option value="high">Aukštas</option></select></label>
      <label className="add-task__field"><span>Terminas (neprivaloma)</span><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}/></label>
      {error && <p className="login-error" role="alert">{error}</p>}
      <div className="add-task__actions"><button type="button" className="add-task__cancel" disabled={busy} onClick={() => setIsOpen(false)}>Atšaukti</button><button type="submit" className="add-task__submit" disabled={busy}>{busy ? "Saugoma…" : "Pridėti užduotį"}</button></div>
    </form>
  </div></div>;
}

export default AddTaskForm;
