import { ethers } from "hardhat";
import { expect } from "chai";

describe("PermitAndSwap (Mainnet Fork)", function () {
  it("Should swap DAI → WETH using Permit2 in one transaction", async function () {
    const [owner] = await ethers.getSigners();

    const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const PermitAndSwap = await ethers.getContractFactory("PermitAndSwap");
    const swapContract = await PermitAndSwap.deploy(PERMIT2_ADDRESS, UNISWAP_V2_ROUTER);
    await swapContract.waitForDeployment();
    console.log("PermitAndSwap deployed to:", await swapContract.getAddress());


    const DAI_WHALE = "0x28C6c06298d514Db089934071355E5743bf21d60";
    await ethers.provider.send("hardhat_impersonateAccount", [DAI_WHALE]);
    const daiHolder = await ethers.getSigner(DAI_WHALE);


    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);

    const transferAmount = ethers.parseEther("1000");
    await dai.connect(daiHolder).transfer(owner.address, transferAmount);


    expect(await dai.balanceOf(owner.address)).to.be.gte(transferAmount);

    console.log("Owner DAI balance:", ethers.formatEther(await dai.balanceOf(owner.address)));
    console.log("Setup complete — now ready to execute permit2Swap with a signature.");
  });
});
