import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import QueryLogsPage from "./pages/QueryLogsPage";
import MLLogsPage from "./pages/MLLogsPage";
import PredictPage from "./pages/PredictPage";
import ServicesPage from "./pages/ServicesPage";
import SlotsPage from "./pages/SlotsPage";
import UsersPage from "./pages/UsersPage";
import UserQuery from "./pages/UserQuery";
import RetrainPage from "./pages/RetrainPage";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/logs" element={<QueryLogsPage />} />
        <Route path="/ml-logs" element={<MLLogsPage />} />
        <Route path="/retrain" element={<RetrainPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/slots" element={<SlotsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/query" element={<UserQuery />} />
      </Route>
    </Routes>
  );
}