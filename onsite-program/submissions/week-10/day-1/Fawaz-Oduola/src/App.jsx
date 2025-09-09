import "./App.css";
import AppLayout from "./components/Layout";
import { StakingForm } from "./components/StakingForm";
import { Withdraw } from "./components/Withdraw";
import ClaimReward from "./components/ClaimReward";
import EmergencyWithdraw from "./components/EmergencyWithdraw";
import ProtocolStats from "./components/ProtocolStats";
import UserInfo from "./components/UserInfo";

function App() {
  return (
    <AppLayout>
      <StakingForm />
      <Withdraw />
      <ClaimReward />
      <EmergencyWithdraw />
      <ProtocolStats />
      <UserInfo />
    </AppLayout>
  );
}

export default App;
