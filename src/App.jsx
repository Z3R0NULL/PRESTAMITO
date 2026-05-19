import { useState } from "react";
import { StoreProvider } from "./store/useStore.jsx";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Clients from "./components/Clients";
import Loans from "./components/Loans";
import Payments from "./components/Payments";

function App() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    clients: <Clients />,
    loans: <Loans />,
    payments: <Payments />,
  };

  return (
    <StoreProvider>
      <Layout page={page} setPage={setPage}>
        {pages[page] ?? pages.dashboard}
      </Layout>
    </StoreProvider>
  );
}

export default App;
