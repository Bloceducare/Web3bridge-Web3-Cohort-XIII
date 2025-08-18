// constructor-args.js

const stakeAmount = ethers.parseEther("10");
const goalPosition = 10;
const seed = 22;
const tokenAddress = "0x472f5f362B237C1E9C0d77E5E4589C0f64Ee2170"

const constructorArgs = [tokenAddress, stakeAmount, goalPosition, seed];

module.exports = [constructorArgs];
