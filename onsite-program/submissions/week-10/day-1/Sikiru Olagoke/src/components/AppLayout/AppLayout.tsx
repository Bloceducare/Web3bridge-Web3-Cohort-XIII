import { Outlet } from "react-router-dom";
import StakedRewardAmount from "../StakedRewardAmount";

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-8">
      <StakedRewardAmount />
      <Outlet />
    </div>
  );
}

export default AppLayout;
