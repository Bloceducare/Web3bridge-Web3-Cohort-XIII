// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { MembershipNFT, RolesRegistry7432, DAO } from "../typechain-types";

// describe("DAO Integration with ERC-7432 Roles", function () {
//   it("should allow NFT holder with VOTER role to create and vote on proposals", async function () {
//     const [owner, voter, nonVoter] = await ethers.getSigners();

//     // 1️⃣ Deploy MembershipNFT
//     const MembershipNFTFactory = await ethers.getContractFactory("MembershipNFT");
//     const membershipNFT = (await MembershipNFTFactory.deploy()) as MembershipNFT;
//     await membershipNFT.waitForDeployment();

//     // 2️⃣ Deploy RolesRegistry7432
//     const RolesRegistryFactory = await ethers.getContractFactory("RolesRegistry7432");
//     const rolesRegistry = (await RolesRegistryFactory.deploy()) as RolesRegistry7432;
//     await rolesRegistry.waitForDeployment();

//     // 3️⃣ Deploy DAO (pass NFT & Registry addresses)
//     const DAOFactory = await ethers.getContractFactory("DAO");
//     const dao = (await DAOFactory.deploy(
//       await membershipNFT.getAddress(),
//       await rolesRegistry.getAddress()
//     )) as DAO;
//     await dao.waitForDeployment();

//     // 4️⃣ Mint NFT to voter
//     const mintTx = await membershipNFT.mint(voter.address);
//     await mintTx.wait();

//     // 5️⃣ Assign VOTER role to NFT holder
//     const voterRole = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
// // ...existing code...
// const roleStruct = {
//   roleId: voterRole,
//   tokenAddress: await membershipNFT.getAddress(),
//   tokenId: 1,
//   recipient: voter.address,
//   expirationDate: ethers.MaxUint256, // non-expiring
//   revocable: true,
//   data: ethers.toUtf8Bytes("can vote")
// };
// await (await rolesRegistry.connect(voter).grantRole(roleStruct)).wait();
// // ...existing code...

//     // 6️⃣ Verify voting rights
//     expect(await dao.connect(voter).hasVotingRights(voter.address)).to.equal(true);
//     expect(await dao.hasVotingRights(nonVoter.address)).to.equal(false);

//     // 7️⃣ Create proposal (only voter)
//     await (await dao.connect(voter).createProposal("Proposal 1")).wait();

//     // 8️⃣ Cast vote
//     await (await dao.connect(voter).vote(1, true)).wait();

//     // 9️⃣ Check proposal data
//     const proposal = await dao.getProposal(1);
//     expect(proposal.description).to.equal("Proposal 1");
//     expect(proposal.yesVotes).to.equal(1);
//     expect(proposal.noVotes).to.equal(0);
//   });
// });
