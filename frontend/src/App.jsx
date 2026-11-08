import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import LoginView from "./features/auth/LoginView";
import RevenueAnalyticsView from "./features/analytics/RevenueAnalyticsView";
import PendingOrdersView from "./features/orders/PendingOrdersView";
import DatasetExplorerView from "./features/datasets/DatasetExplorerView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Route Publik */}
            <Route path="/login" element={<LoginView />} />

            {/* Protected Routes Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RevenueAnalyticsView />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/pending"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PendingOrdersView />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/datasets"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DatasetExplorerView />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
