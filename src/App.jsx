import { useEffect, useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import Weather from "./Weather";
import "./App.css";

const TASKS_API_URL = "https://testapi.io/api/masnpi-maker/resource/DateBase";
const TESTAPI_TOKEN = import.meta.env.VITE_TESTAPI_TOKEN;

function getApiHeaders(includeJson = false) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(TESTAPI_TOKEN ? { Authorization: `Bearer ${TESTAPI_TOKEN}` } : {}),
  };
}

function getTasksFromResponse(response) {
  const records = Array.isArray(response) ? response : response?.data;
  if (!Array.isArray(records)) throw new Error("API grąžino netinkamo formato duomenis.");

  return records.map((record) => {
    const status = record.status ?? record.Status ?? "Nepradėta";
    return {
      ...record,
      title: record.title ?? record.Title ?? record.name ?? "",
      status: status === "Nepradeta" ? "Nepradėta" : status,
      deadline: record.deadline ?? record.DeadLine ?? "",
    };
  });
}

function App() {
  const user = {
    name: "Jonas Jonaitis",
    email: "jonas@flowly.lt",
  };

  const [activePage, setActivePage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function loadTasks() {
      try {
        const response = await fetch(TASKS_API_URL, { headers: getApiHeaders() });
        if (!response.ok) throw new Error("Nepavyko gauti užduočių iš duomenų bazės.");
        const loadedTasks = getTasksFromResponse(await response.json());
        if (isCurrent) setTasks(loadedTasks);
      } catch (error) {
        if (isCurrent) setTasksError(error.message || "Nepavyko prisijungti prie duomenų bazės.");
      } finally {
        if (isCurrent) setTasksLoading(false);
      }
    }
    loadTasks();
    return () => { isCurrent = false; };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    if (email === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Neteisingas vartotojo vardas arba slaptažodis.");
  }

  async function handleAddTask(newTask) {
    setTasksError("");
    try {
      const response = await fetch(TASKS_API_URL, {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify({
          Title: newTask.title,
          Status: newTask.status,
          DeadLine: newTask.deadline,
        }),
      });
      if (!response.ok) throw new Error("Nepavyko išsaugoti užduoties duomenų bazėje.");
      const result = await response.json();
      const createdTask = result?.data ?? result;
      if (!createdTask?.id) throw new Error("Duomenų bazė negrąžino sukurtos užduoties ID.");
      setTasks((currentTasks) => [...currentTasks, { ...newTask, ...createdTask }]);
    } catch (error) {
      setTasksError(error.message || "Nepavyko išsaugoti užduoties.");
    }
  }

  async function updateTask(taskId, changes) {
    const previousTask = tasks.find((task) => task.id === taskId);
    if (!previousTask) return;
    const updatedTask = { ...previousTask, ...changes };
    setTasksError("");
    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? updatedTask : task));
    try {
      const response = await fetch(`${TASKS_API_URL}/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        headers: getApiHeaders(true),
        body: JSON.stringify({
          Title: updatedTask.title,
          Status: updatedTask.status,
          DeadLine: updatedTask.deadline,
        }),
      });
      if (!response.ok) throw new Error("Nepavyko atnaujinti užduoties duomenų bazėje.");
    } catch (error) {
      setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? previousTask : task));
      setTasksError(error.message || "Nepavyko atnaujinti užduoties.");
    }
  }

  function handleTaskStatusChange(taskId, status) { updateTask(taskId, { status }); }
  function handleTaskDeadlineChange(taskId, deadline) { updateTask(taskId, { deadline }); }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedTaskCount = tasks.filter(
    (task) => task.status === "Atlikta",
  ).length;
  const overdueTaskCount = tasks.filter((task) => {
    if (task.status === "Atlikta" || !task.deadline) return false;

    const deadline = new Date(`${task.deadline}T00:00:00`);
    return deadline < today;
  }).length;
  const taskStatuses = ["Nepradėta", "Vykdoma", "Atlikta"];

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      {activePage === "home" && (
        <>
          {isLoggedIn && (
            <header className="welcome-message">
              <h1>Sveiki sugrįžę!</h1>
              <p>Prisijungėte kaip admin.</p>
            </header>
          )}

          <main className="login-page">
            {!isLoggedIn && (
              <div className="login-card">
                <>
                  <header className="login-card__header">
                    <h1>Prisijungti</h1>
                    <p>Įveskite savo duomenis, kad tęstumėte</p>
                  </header>

                  <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-field">
                      <span>Vartotojo vardas</span>
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="admin"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>

                    <label className="login-field">
                      <span>Slaptažodis</span>
                      <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </label>

                    <button type="submit" className="login-submit">
                      Prisijungti
                    </button>

                    {loginError && (
                      <p className="login-error" role="alert">
                        {loginError}
                      </p>
                    )}
                  </form>
                </>
              </div>
            )}

            {isLoggedIn && (
              <>
                <section className="dashboard-summary" aria-label="Užduočių suvestinė">
                  <p>
                    <strong>{tasks.length} užduotys</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{completedTaskCount} atliktos</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{overdueTaskCount} vėluoja</strong>
                  </p>
                </section>

                {tasksError && <p className="login-error" role="alert">{tasksError}</p>}

                <TaskList
                  tasks={tasks}
                  loading={tasksLoading}
                  onStatusChange={handleTaskStatusChange}
                  onDeadlineChange={handleTaskDeadlineChange}
                />

                <section className="charts-card" aria-labelledby="charts-title">
                  <header className="charts-card__header">
                    <h2 id="charts-title">Grafikai</h2>
                    <p>Užduočių pasiskirstymas pagal būseną</p>
                  </header>
                  <div className="charts-list">
                    {taskStatuses.map((status) => {
                      const count = tasks.filter((task) => task.status === status).length;
                      const percentage = tasks.length
                        ? Math.round((count / tasks.length) * 100)
                        : 0;

                      return (
                        <div className="chart-row" key={status}>
                          <div className="chart-row__label">
                            <span>{status}</span>
                            <strong>{count}</strong>
                          </div>
                          <div
                            className="chart-track"
                            role="progressbar"
                            aria-label={`${status}: ${count} užduotys`}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow={percentage}
                          >
                            <span style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <AddTaskForm onAddTask={handleAddTask} />

                <ProgressBar initialProgress={50} />
              </>
            )}
          </main>
        </>
      )}

      {activePage === "profile" && <Profile user={user} tasks={tasks} />}
      {activePage === "weather" && <Weather />}
    </>
  );
}

export default App;
