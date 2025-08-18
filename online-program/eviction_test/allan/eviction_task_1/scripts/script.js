const { ethers } = require("hardhat");

async function main() {
	const address = process.argv[2];
	if (!address) {
		console.error("Usage: npx hardhat run scripts/script.js --network lisk-sepolia <address>");
		process.exit(1);
	}
	const lottery = await ethers.getContractAt("Lottery", address);
	console.log("Lottery:", address);
	console.log("Round:", (await lottery.roundId()).toString());
	console.log("Last winner:", await lottery.lastWinner());
	const players = await lottery.getPlayers();
	console.log("Players:", players);
}

main().catch((e) => {
	console.error(e);
	process.exitCode = 1;
}); 