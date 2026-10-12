import { useState } from "react";
import "./Profile.css";

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "F";
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : `${words[0][0]}${words.at(-1)[0]}`.toUpperCase();
}

function Profile({ user = {}, profile, tasks = [], onSave, onSignOut, busy = false }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Flowly naudotojas";
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;

  async function save(event) {
    event.preventDefault();
    if (!name.trim()) { setError("Įveskite rodomą vardą."); return; }
    setError(""); setMessage("");
    const result = await onSave(name);
    if (result?.error) setError(result.error);
    else { setEditing(false); setMessage("Profilis išsaugotas."); }
  }

  return <main className="profile-page"><header className="profile-header profile-card"><div className="profile-avatar" aria-hidden="true">{getInitials(displayName)}</div><div className="profile-header__details"><p className="profile-eyebrow">Flowly naudotojas</p><h1>{displayName}</h1><p className="profile-email">{user.email || "El. paštas nenurodytas"}</p></div></header>
    <section className="profile-card profile-progress"><div className="profile-section-heading"><div><p className="profile-eyebrow">Apžvalga</p><h2>Mano progresas</h2></div><span className="profile-progress__value">{progress}%</span></div><div className="profile-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span style={{ width: `${progress}%` }}/></div><div className="profile-stats"><div className="profile-stat"><span className="profile-stat__value">{tasks.length}</span><span className="profile-stat__label">Visos užduotys</span></div><div className="profile-stat"><span className="profile-stat__value">{completed}</span><span className="profile-stat__label">Atliktos užduotys</span></div></div></section>
    <section className="profile-card profile-account"><div className="profile-section-heading"><div><p className="profile-eyebrow">Paskyra</p><h2>Paskyros informacija</h2></div></div>
      {editing ? <form className="profile-edit-form" onSubmit={save}><label>Rodomas vardas<input value={name} onChange={(e) => setName(e.target.value)} maxLength="100" required/></label>{error && <p className="login-error" role="alert">{error}</p>}<div className="profile-actions"><button className="profile-edit-button" type="submit" disabled={busy}>{busy ? "Saugoma…" : "Išsaugoti"}</button><button className="profile-edit-button profile-edit-button--secondary" type="button" onClick={() => { setEditing(false); setName(displayName); }}>Atšaukti</button></div></form> : <><dl className="profile-account__details"><div><dt>Vardas</dt><dd>{displayName}</dd></div><div><dt>El. paštas</dt><dd>{user.email || "Nenurodytas"}</dd></div></dl><button className="profile-edit-button" type="button" onClick={() => { setName(displayName); setEditing(true); }}>Redaguoti profilį</button></>}
      {message && <p className="success-message" role="status">{message}</p>}<button className="profile-signout" type="button" onClick={onSignOut} disabled={busy}>Atsijungti</button>
    </section>
  </main>;
}

export default Profile;
