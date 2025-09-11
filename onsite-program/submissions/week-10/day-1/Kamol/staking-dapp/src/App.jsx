import Header from "./components/Header";
import React from "react";
import Dashboard from "./components/Dashboard";
import StakeForm from "./components/StakeForm";
import ClaimBtn from "./components/ClaimBtn";
import WithdrawBtn from "./components/WithdrawBtn";
import EmergencyBtn from "./components/EmergencyBtn";
import "./App.css";

function App() {
  return (
    <div>
      <Header />
      <Dashboard />
      <StakeForm />
      <div className="p-4 flex gap-4">
        <ClaimBtn />
        <WithdrawBtn amount={""} />
        <EmergencyBtn />
      </div>
    </div>
  );
}

export default App;
