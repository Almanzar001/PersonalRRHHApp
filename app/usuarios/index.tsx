import React from "react";
import UserManagementScreen from "../../src/components/users/UserManagementScreen";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";

export default function UsersPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <UserManagementScreen />
    </ProtectedRoute>
  );
}