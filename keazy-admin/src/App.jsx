import { Link, Routes, Route } from "react-router-dom";
import DashboardHome from "./pages/DashboardHome";
import LogsPage from "./pages/LogsPage";
import ServicesPage from "./pages/ServicesPage";
import SlotsPage from "./pages/SlotsPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ marginBottom: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/logs" style={{ marginRight: 12 }}>Logs</Link>
        <Link to="/services" style={{ marginRight: 12 }}>Services</Link>
        <Link to="/slots" style={{ marginRight: 12 }}>Slots</Link>
        <Link to="/users" style={{ marginRight: 12 }}>Users</Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/slots" element={<SlotsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </div>
  );
}