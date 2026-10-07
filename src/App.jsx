import { useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import "./App.css";

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

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Sukurti prisijungimo formą",
      status: "Atlikta",
      deadline: "2026-10-01",
    },
    {
      id: 2,
      title: "Sukurti užduočių sąrašą",
      status: "Vykdoma",
      deadline: "2026-10-05",
    },
  ]);

  function handleSubmit(event) {
    event.preventDefault();

    if (email === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Neteisingas vartotojo vardas arba slaptažodis.");
  }

  function handleAddTask(newTask) {
    setTasks((currentTasks) => [...currentTasks, newTask]);
  }

  function handleTaskStatusChange(taskId, status) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );
  }

  function handleTaskDeadlineChange(taskId, deadline) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, deadline } : task,
      ),
    );
  }

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

                <TaskList
                  tasks={tasks}
                  loading={false}
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
    </>
  );
}

export default App;
