import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Auth } from "./components/Auth";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Transactions } from "./components/Transactions";
import { Accounts } from "./components/Accounts";
import { Loans } from "./components/Loans";
import { Goals } from "./components/Goals";
import { Chat } from "./components/Chat";
import { CreditScore } from "./components/CreditScore";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (c
