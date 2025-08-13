import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

const TIMELOCK_MIN_DELAY = 3600;
const VOTING_PERIOD = 50400;
const QUORUM_VOTES = BigInt(4 * 10 ** 18);

const PROPOSER_ROLE = keccak256(toUtf8Bytes("PROPOSER_ROLE"));
const EXECUTOR_ROLE = keccak256(toUtf8Bytes("EXECUTOR_ROLE"));
const TIMELOCK_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

const AdvancedDAODeploymentModule = buildModule("AdvancedDAODeploymentModule", (m) => {
  const [deployer] = m.getAccount(0);

  const timelock = m.contract("TimelockController", [TIMELOCK_MIN_DELAY, [], [], deployer]);

  const membershipNFT = m.contract("MembershipNFT", [deployer]);

  const roles = m.contract("Roles");

  const dao = m.contract("DAO", [
    roles.address,
    membershipNFT.address,
    timelock.address,
    VOTING_PERIOD,
    QUORUM_VOTES,
  ]);

  m.call(timelock, "grantRole", [PROPOSER_ROLE, dao.address]);
  m.call(timelock, "grantRole", [EXECUTOR_ROLE, "0x0000000000000000000000000000000000000000"]);
  m.call(timelock, "renounceRole", [TIMELOCK_ADMIN_ROLE, deployer]);

  return { timelock, membershipNFT, roles, dao };
});

export default AdvancedDAODeploymentModule;
