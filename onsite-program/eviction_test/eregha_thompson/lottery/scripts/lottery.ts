const hre = require("hardhat");

async function main() {

    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy()
    const LOTTERY =await lottery.waitForDeployment();

    const lotteryAddress = await LOTTERY.getAddress();
    console.log("Lottery contract deployed to:", lotteryAddress);

  


    const [owner, ...addresses] = await hre.ethers.getSigners();

    for (let index = 0; index < 10; index++) {
        await lottery.connect(addresses[index]).joinLottery({ value: hre.ethers.parseEther("0.01") });
        console.log(`Account ${index + 1} has joined the lottery`);

    }

    await lottery.connect(addresses[0]).joinLottery({ value: hre.ethers.parseEther("0.01") });
    console.log("reset confirmed");
    

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}
);