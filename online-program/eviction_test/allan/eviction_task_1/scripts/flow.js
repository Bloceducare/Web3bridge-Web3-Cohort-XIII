const { ethers } = require("hardhat");

async function joinRound(lottery, players, entry) {
	const receipts = [];
	for (const p of players) {
		const tx = await lottery.connect(p).enter({ value: entry });
		receipts.push(tx.wait());
	}
	await Promise.all(receipts);
}

async function main() {
	const [deployer, ...others] = await ethers.getSigners();
	const Lottery = await ethers.getContractFactory("Lottery");
	const lottery = await Lottery.deploy();
	await lottery.waitForDeployment();
	console.log("Lottery deployed to:", await lottery.getAddress());

	const ENTRY = ethers.parseEther("0.01");
	const roundPlayers = others.slice(0, 10);

	await joinRound(lottery, roundPlayers, ENTRY);
	console.log("Round:", (await lottery.roundId()).toString());
	console.log("Winner:", await lottery.lastWinner());

	await joinRound(lottery, roundPlayers, ENTRY);
	console.log("Round:", (await lottery.roundId()).toString());
	console.log("Winner:", await lottery.lastWinner());
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
}); 