import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigError } from "./lib/supabase";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import "./App.css";

const STATUS_LABELS = { todo: "Laukiama", in_progress: "Vykdoma", completed: "Atlikta" };
const ERROR_MESSAGES = {
  "Invalid login credentials": "Neteisingas el. paštas arba slaptažodis.",
  "Email not confirmed": "Patvirtinkite el. paštą ir bandykite prisijungti.",
  "User already registered": "Šis el. paštas jau užregistruotas. Pabandykite prisijungti.",
  "Password should be at least 6 characters": "Slaptažodį turi sudaryti bent 6 simboliai.",
};
const translateError = (error, fallback) => ERROR_MESSAGES[error?.message] || fallback;

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyTaskId, setBusyTaskId] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError("Nepavyko atkurti sesijos. Prisijunkite iš naujo.");
      setSession(data?.session ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) { setTasks([]); setProfile(null); }
      setAuthError("");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const loadProfile = useCallback(async (user) => {
    if (!user || !supabase) return;
    let { data, error } = await supabase.from("profiles").select("id, display_name, created_at, updated_at").eq("id", user.id).maybeSingle();
    if (error) { setTasksError("Nepavyko įkelti profilio."); return; }
    if (!data) {
      const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Flowly naudotojas";
      const result = await supabase.from("profiles").upsert({ id: user.id, display_name: name }, { onConflict: "id" }).select("id, display_name, created_at, updated_at").single();
      data = result.data;
      error = result.error;
    }
    if (error) setTasksError("Nepavyko atkurti profilio. Patikrinkite profiles lentelės RLS taisykles.");
    else setProfile(data);
  }, []);

  const userId = session?.user?.id;
  const loadTasks = useCallback(async () => {
    if (!userId || !supabase) return;
    setTasksLoading(true);
    setTasksError("");
    const { data, error } = await supabase.from("tasks").select("id, user_id, title, description, status, priority, deadline, completed_at, created_at, updated_at").eq("user_id", userId).order("deadline", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    if (error) setTasksError("Nepavyko įkelti užduočių. Bandykite dar kartą.");
    else setTasks(data || []);
    setTasksLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId || !supabase) return;
    Promise.resolve().then(() => {
      loadProfile(session.user);
      loadTasks();
    });
  }, [userId, session?.user, loadProfile, loadTasks]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!supabase || authBusy) return;
    setAuthBusy(true); setAuthError(""); setAuthNotice("");
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName.trim() } } });
        if (error) throw error;
        if (data.user?.identities?.length === 0) {
          setAuthError("Šis el. paštas jau užregistruotas. Pabandykite prisijungti.");
          return;
        }
        if (data.session) setAuthNotice("Paskyra sukurta. Sveiki prisijungę!");
        else setAuthNotice("Registracija sėkminga. Patikrinkite el. paštą ir patvirtinkite paskyrą.");
      }
    } catch (error) { setAuthError(translateError(error, "Nepavyko prisijungti. Patikrinkite duomenis ir bandykite dar kartą.")); }
    finally { setAuthBusy(false); }
  }

  async function handleSignOut() {
    if (!supabase || authBusy) return;
    setAuthBusy(true);
    const { error } = await supabase.auth.signOut();
    setAuthBusy(false);
    if (error) setTasksError("Nepavyko atsijungti. Bandykite dar kartą.");
    else { setTasks([]); setProfile(null); setActivePage("home"); }
  }

  async function handleAddTask(newTask) {
    if (!session?.user || !supabase) return { error: "Prisijunkite, kad galėtumėte kurti užduotis." };
    const title = newTask.title.trim();
    if (!title) return { error: "Įveskite užduoties pavadinimą." };
    const { data, error } = await supabase.from("tasks").insert({ user_id: session.user.id, title, description: newTask.description.trim() || null, status: "todo", priority: newTask.priority, deadline: newTask.deadline || null }).select("id, user_id, title, description, status, priority, deadline, completed_at, created_at, updated_at").single();
    if (error) return { error: "Nepavyko išsaugoti užduoties." };
    setTasks((current) => [...current, data].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999")));
    setNotice("Užduotis sėkmingai sukurta.");
    return { success: true };
  }

  async function updateTask(taskId, changes) {
    if (!session?.user || !supabase || busyTaskId) return;
    setBusyTaskId(taskId); setTasksError(""); setNotice("");
    const { data, error } = await supabase.from("tasks").update(changes).eq("id", taskId).eq("user_id", session.user.id).select("id, user_id, title, description, status, priority, deadline, completed_at, created_at, updated_at").single();
    if (error) setTasksError("Nepavyko išsaugoti pakeitimų.");
    else { setTasks((current) => current.map((task) => task.id === taskId ? data : task)); setNotice("Pakeitimai išsaugoti."); }
    setBusyTaskId("");
    return error ? { error: true } : { success: true };
  }

  async function deleteTask(taskId) {
    if (!session?.user || !supabase || busyTaskId) return;
    if (!window.confirm("Ar tikrai norite ištrinti šią užduotį?")) return;
    setBusyTaskId(taskId); setTasksError(""); setNotice("");
    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", session.user.id);
    if (error) setTasksError("Nepavyko ištrinti užduoties.");
    else { setTasks((current) => current.filter((task) => task.id !== taskId)); setNotice("Užduotis sėkmingai ištrinta."); }
    setBusyTaskId("");
  }

  async function saveProfile(name) {
    if (!session?.user || !supabase) return { error: "Sesija baigėsi. Prisijunkite iš naujo." };
    const { data, error } = await supabase.from("profiles").upsert({ id: session.user.id, display_name: name.trim() }, { onConflict: "id" }).select("id, display_name, created_at, updated_at").single();
    if (error) return { error: "Nepavyko išsaugoti profilio." };
    setProfile(data);
    return { success: true };
  }

  const filteredTasks = useMemo(() => tasks.filter((task) => (statusFilter === "all" || task.status === statusFilter) && (priorityFilter === "all" || task.priority === priorityFilter) && task.title.toLocaleLowerCase("lt").includes(search.toLocaleLowerCase("lt"))), [tasks, statusFilter, priorityFilter, search]);
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;

  if (authLoading) return <main className="auth-loading">Tikrinama sesija…</main>;

  return <>
    <Navbar activePage={activePage} onNavigate={setActivePage} />
    {!session ? <main className="login-page"><section className="login-card">
      <header className="login-card__header"><h1>{authMode === "login" ? "Prisijungti" : "Sukurti paskyrą"}</h1><p>Įveskite savo duomenis, kad tęstumėte</p></header>
      <form className="login-form" onSubmit={handleAuthSubmit}>
        {authMode === "signup" && <label className="login-field"><span>Rodomas vardas</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" required /></label>}
        <label className="login-field"><span>El. paštas</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="login-field"><span>Slaptažodis</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength="6" required /></label>
        {authError && <p className="login-error" role="alert">{authError}</p>}{authNotice && <p className="success-message" role="status">{authNotice}</p>}
        <button className="login-submit" type="submit" disabled={authBusy || !supabase}>{authBusy ? "Prašome palaukti…" : authMode === "login" ? "Prisijungti" : "Registruotis"}</button>
      </form>
      <button className="auth-switch" type="button" disabled={authBusy} onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); setAuthNotice(""); }}>{authMode === "login" ? "Neturite paskyros? Registruotis" : "Jau turite paskyrą? Prisijungti"}</button>
      {supabaseConfigError && <p className="login-error" role="alert">{supabaseConfigError}</p>}
    </section></main> : <>
      {activePage === "home" && <><header className="welcome-message"><h1>Sveiki, {profile?.display_name || session.user.email}!</h1><p>Jūsų užduotys ir progresas vienoje vietoje.</p></header>
        <main className="dashboard-page"><section className="dashboard-summary"><p><strong>{tasks.length} užduotys</strong><span>·</span><strong>{completedCount} atliktos</strong></p></section>
          {tasksError && <div className="notice-error" role="alert">{tasksError} <button type="button" onClick={loadTasks}>Bandyti dar kartą</button></div>}{notice && <p className="success-message" role="status">{notice}</p>}
          <section className="task-controls" aria-label="Užduočių filtrai"><input type="search" placeholder="Ieškoti užduoties…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Ieškoti pagal pavadinimą"/><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtruoti pagal būseną"><option value="all">Visos būsenos</option>{Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filtruoti pagal prioritetą"><option value="all">Visi prioritetai</option><option value="low">Žemas</option><option value="medium">Vidutinis</option><option value="high">Aukštas</option></select></section>
          <TaskList tasks={filteredTasks} loading={tasksLoading} onRetry={loadTasks} onUpdate={updateTask} onDelete={deleteTask} busyTaskId={busyTaskId}/>
          <AddTaskForm onAddTask={handleAddTask}/><ProgressBar progress={progress} completedCount={completedCount} totalCount={tasks.length}/>
        </main></>}
      {activePage === "tasks" && <main className="dashboard-page"><h1>Užduotys</h1>{tasksError && <p className="login-error" role="alert">{tasksError}</p>}<section className="task-controls"><input type="search" placeholder="Ieškoti užduoties…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Ieškoti"/><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Visos būsenos</option>{Object.entries(STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></section><TaskList tasks={filteredTasks} loading={tasksLoading} onRetry={loadTasks} onUpdate={updateTask} onDelete={deleteTask} busyTaskId={busyTaskId}/><AddTaskForm onAddTask={handleAddTask}/></main>}
      {activePage === "progress" && <main className="dashboard-page"><ProgressBar progress={progress} completedCount={completedCount} totalCount={tasks.length}/></main>}
      {activePage === "profile" && <Profile user={session.user} profile={profile} tasks={tasks} onSave={saveProfile} onSignOut={handleSignOut} busy={authBusy}/ >}
    </>}
  </>;
}

export default App;
