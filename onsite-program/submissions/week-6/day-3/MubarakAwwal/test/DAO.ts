import { expect } from "chai";
import { ethers } from "hardhat";

const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO.Proposer()"));
const VOTER_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("DAO.Voter()"));
const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO.Executor()"));

describe("Role-gated DAO via ERC-7432", function () {
  it("flows through proposal -> vote -> execute", async () => {
    const [owner, alice] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("GovernanceNFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();

    const Roles = await ethers.getContractFactory("BasicRolesRegistry");
    const roles = await Roles.deploy();
    await roles.waitForDeployment();

    const DAO = await ethers.getContractFactory("RoleGatedDAO");
    const dao = await DAO.deploy(await roles.getAddress(), await nft.getAddress());
    await dao.waitForDeployment();

 
    await (await nft.mint(owner.address)).wait();

   
    await (await roles.setRoleApprovalForAll(await nft.getAddress(), owner.address, true)).wait(); // owner approves self (no-op)
   
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;
    const expiry = BigInt(now + 3600);

    const grant = async (roleId: string) => {
      await (await roles.grantRole({
        roleId,
        tokenAddress: await nft.getAddress(),
        tokenId: 1,
        recipient: alice.address,
        expirationDate: expiry,
        revocable: true,
        data: "0x"
      })).wait();
    };

    await grant(PROPOSER_ROLE);
    await grant(VOTER_ROLE);
    await grant(EXECUTOR_ROLE);

    
    await expect(
      (await (await dao.connect(alice).createProposal("Add feature X", 60, await nft.getAddress(), 1))).wait()
    ).to.emit(dao, "ProposalCreated");

   
    await expect(
      (await (await dao.connect(alice).vote(0, true, await nft.getAddress(), 1))).wait()
    ).to.emit(dao, "VoteCast");

   
    await ethers.provider.send("evm_increaseTime", [120]);
    await ethers.provider.send("evm_mine", []);

    
    await expect(
      (await (await dao.connect(alice).execute(0, await nft.getAddress(), 1))).wait()
    ).to.emit(dao, "Executed");
  });
});
