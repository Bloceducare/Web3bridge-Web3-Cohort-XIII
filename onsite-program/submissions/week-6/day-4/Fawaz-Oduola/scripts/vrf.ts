import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});
const abi = [
  "function withdraw() external",
  "function openBox() external payable",
  "event RequestFulfilled(uint256 requestId, uint256[] randomWords)",
  "event RequestSent(uint256 requestId, uint32 numWords)",
  "event WonERC20(address winner)",
  "event WonERC721(address winner)",
  "event WonERC1155(address winner)",
  "function getReward(uint256 random) external  returns (string memory)"
];
const vrf = await ethers.getContractAt(
  abi,
  "0x9796e1c30741C9db6BB333241f05B2D8CA5af63E"
);
const requestIdTx = await vrf.openBox({ value: ethers.parseEther("0.001") });
const receipt = await requestIdTx.wait();

vrf.on("RequestSent", (requestId, numWords) => {
  console.log(`Request Sent: ${requestId}, num of words: ${numWords}`);
});

vrf.on("RequestFulfilled", async (requestId, words) => {
  console.log(`Request fulfilled: ${requestId}, word: ${words[0]}`);
  const reward = await vrf.getReward(words[0]);
  console.log(reward);
});

vrf.on("WonERC20", (winner) => {
  console.log(`WonERC20:  ${winner}`);
});

vrf.on("WonERC721", (winner) => {
  console.log(`WonERC721:  ${winner}`);
});

vrf.on("WonERC1155", (winner) => {
  console.log(`WonERC1155:  ${winner}`);
});

console.log("listening...")


// console.log(receipt)
// const event = receipt?.logs
//   .map(log => {
//     try { return vrf.interface.parseLog(log) } catch { return null }
//   })
//   .find(e => e?.name === "RequestSent");

// const requestId = event?.args?.requestId;
// console.log("Request ID:", requestId);
await new Promise((r) => setTimeout(r, 60000));
// const status =  await vrf.getRequestStatus(requestId)
// console.log(status)

console.log("Transaction sent successfully");
