import { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
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

  if (loading) return <div>Loading...</div>;
  if (!user) return <Auth />;

  const renderView = () => {
    switch (currentView) {
      case "dashboard": return <Dashboard />;
      case "transactions": return <Transactions />;
      case "accounts": return <Accounts />;
      case "loans": return <Loans />;
      case "goals": return <Goals />;
      case "chat": return <Chat />;
      case "credit": return <CreditScore />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
