import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inspect from "./pages/Inspect";
import Reports from "./pages/Reports";
import Maintenance from "./pages/Maintenance";
import MapView from "./pages/MapView";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inspect" element={<Inspect />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/map" element={<MapView />} />
      </Route>
    </Routes>
  );
}
