import { NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import MatchesPage from "./pages/MatchesPage";
import PlayersPage from "./pages/PlayersPage";
import ScorekeeperPage from "./pages/ScorekeeperPage";

const links = [
  { to: "/", label: "Standings" },
  { to: "/scorekeeper", label: "Scorekeeper" },
  { to: "/players", label: "Players" },
  { to: "/matches", label: "Match log" },
];

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">8</span>
          <span className="brand-text">
            APA Tracker
            <small>Scorekeeper &amp; stats</small>
          </span>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scorekeeper" element={<ScorekeeperPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="*" element={<p className="empty">That page doesn't exist.</p>} />
        </Routes>
      </main>

      <footer className="footer">
        Races per APA 8-ball skill levels: a player wins when their game count reaches their SL.
      </footer>
    </div>
  );
}
