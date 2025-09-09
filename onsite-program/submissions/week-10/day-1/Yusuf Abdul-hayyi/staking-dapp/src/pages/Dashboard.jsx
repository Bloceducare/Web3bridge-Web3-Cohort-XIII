import StakeForm from "../components/staking/StakeForm";
import Withdrawn from "../components/staking/Withdrawn";
import ClaimRewards from "../components/staking/ClaimRewards";
import EmergencyWithdraw from "../components/staking/EmergencyWithdraw";
import StakePositions from "../components/staking/StakePositions";
import RewardsInfo from "../components/staking/RewardsInfo";

const Dashboard = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-6">
                    <StakeForm />
                    <Withdrawn />
                </div>
                <div className="flex-1 flex flex-col gap-6">
                    <ClaimRewards />
                    <EmergencyWithdraw />
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <StakePositions />
                </div>
                <div className="flex-1">
                    <RewardsInfo />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
