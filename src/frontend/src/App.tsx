import { useState } from "react";
import { Layout } from "./Layout";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  const [isHighRisk, setIsHighRisk] = useState(false);

  return (
    <Layout isHighRisk={isHighRisk}>
      <Dashboard onRiskChange={setIsHighRisk} />
    </Layout>
  );
}
