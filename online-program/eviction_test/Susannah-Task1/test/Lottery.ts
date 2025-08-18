import { expect } from "chai";
import { network } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const { ethers } = await network.connect();



describe ("Lottery", function () {
    async function deployContractAndSetVariables(){
        const Lottery = await ethers.getContractFactory('Lottery');
        const lottery = await Lottery.deploy();
        const [Nneka] = await ethers.getSigners();
        const[Joseph] = await ethers.getSigners();
        const playerCount = 9;
        const playerCount2 = 10;
        
    }
    it ("Should have users enter with only 0.1 ETH", async function (){
         const { lottery, Nneka } = await loadFixture(deployContractAndSetVariables);
        await expect(lottery.connect(Nneka).payFeeandCreatePlayer({ value: ethers.utils.parseEther("0.2") })
        ).to.be.revertedWith("Incorrect amount has been paid");
    });
    it ("Should only pick a winner after 10 players have registered", async function (){
        const {lottery, playerCount} = await loadFixture(deployContractAndSetVariables);
        await expect (lottery.connect().playLottery().to.be.revertedWith("There needs to be ten players in this game"));
    });
})

