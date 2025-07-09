import React from "react";
import DashboardScreen from "../../src/components/dashboard/DashboardScreen";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardScreen />
    </ProtectedRoute>
  );
}
