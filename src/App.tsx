import { useState } from "react";
import { Overview } from "./tabs/Overview";
import { Symlinks } from "./tabs/Symlinks";
import { Projects } from "./tabs/Projects";
import { Plugins } from "./tabs/Plugins";
import { Context } from "./tabs/Context";
import "./App.css";

const TABS = ["Overview", "Symlinks", "Projects", "Plugins", "Context"] as const;
type Tab = (typeof TABS)[number];

function App() {
  const [active, setActive] = useState<Tab>("Symlinks");

  return (
    <main className="app">
      <header className="app-header">
        <h1>claude-atlas</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab-button ${active === t ? "active" : ""}`}
              onClick={() => setActive(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <div className="tab-content">
        {active === "Overview" && <Overview />}
        {active === "Symlinks" && <Symlinks />}
        {active === "Projects" && <Projects />}
        {active === "Plugins" && <Plugins />}
        {active === "Context" && <Context />}
      </div>
    </main>
  );
}

export default App;
