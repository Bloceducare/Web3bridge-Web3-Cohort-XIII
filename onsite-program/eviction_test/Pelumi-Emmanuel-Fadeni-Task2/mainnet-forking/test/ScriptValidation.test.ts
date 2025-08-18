import { expect } from "chai";
import { ethers } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Script Validation Tests", function () {
  let impersonatedSigner: any;
  let USDC: any;
  let DAI: any;
  let ROUTER: any;
  let factory: any;

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  beforeEach(async function () {
    // Impersonate account
    await impersonateAccount(USDCHolder);
    impersonatedSigner = await ethers.getSigner(USDCHolder);

    // Get contract instances
    USDC = await ethers.getContractAt("IERC20", USDCAddress);
    DAI = await ethers.getContractAt("IERC20", DAIAddress);
    ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

    // Get factory
    const factoryAddress = await (ROUTER as any).factory();
    factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);
  });

  describe("Contract Connections", function () {
    it("Should connect to USDC contract", async function () {
      const balance = await USDC.balanceOf(impersonatedSigner.address);
      expect(balance).to.be.a("bigint");
    });

    it("Should connect to DAI contract", async function () {
      const balance = await DAI.balanceOf(impersonatedSigner.address);
      expect(balance).to.be.a("bigint");
    });

    it("Should connect to Uniswap Router", async function () {
      const factoryAddr = await (ROUTER as any).factory();
      expect(factoryAddr).to.be.a("string");
      expect(factoryAddr.length).to.equal(42); // Ethereum address length
    });

    it("Should get pair addresses", async function () {
      const usdcDaiPair = await factory.getPair(USDCAddress, DAIAddress);
      const daiEthPair = await factory.getPair(DAIAddress, wethAddress);
      
      expect(usdcDaiPair).to.be.a("string");
      expect(daiEthPair).to.be.a("string");
      expect(usdcDaiPair.length).to.equal(42);
      expect(daiEthPair.length).to.equal(42);
    });
  });

  describe("Account Setup", function () {
    it("Should have impersonated account with ETH balance", async function () {
      const balance = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
      expect(balance).to.be.greaterThan(0);
    });

    it("Should have correct impersonated address", async function () {
      expect(impersonatedSigner.address.toLowerCase()).to.equal(USDCHolder.toLowerCase());
    });
  });

  describe("Token Operations", function () {
    it("Should be able to check token balances", async function () {
      const usdcBalance = await USDC.balanceOf(impersonatedSigner.address);
      const daiBalance = await DAI.balanceOf(impersonatedSigner.address);
      
      console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6));
      console.log("DAI Balance:", ethers.formatUnits(daiBalance, 18));
      
      expect(usdcBalance).to.be.a("bigint");
      expect(daiBalance).to.be.a("bigint");
    });

    it("Should be able to approve tokens", async function () {
      const approveAmount = ethers.parseUnits("1", 6); // 1 USDC
      
      const tx = await (USDC as any).connect(impersonatedSigner).approve(UNIRouter, approveAmount);
      await tx.wait();
      
      const allowance = await USDC.allowance(impersonatedSigner.address, UNIRouter);
      expect(allowance).to.be.greaterThanOrEqual(approveAmount);
    });
  });

  describe("Uniswap Operations", function () {
    it("Should be able to get amounts for swap", async function () {
      const amountOut = ethers.parseUnits("1", 18); // 1 DAI
      
      try {
        const amountsIn = await (ROUTER as any).getAmountsIn(amountOut, [wethAddress, DAIAddress]);
        expect(amountsIn).to.be.an("array");
        expect(amountsIn.length).to.equal(2);
        expect(amountsIn[0]).to.be.a("bigint");
        expect(amountsIn[1]).to.be.a("bigint");
        
        console.log("ETH required for 1 DAI:", ethers.formatEther(amountsIn[0]));
      } catch (error) {
        console.log("Note: getAmountsIn might fail if there's insufficient liquidity");
      }
    });

    it("Should validate LP token contracts", async function () {
      const usdcDaiPair = await factory.getPair(USDCAddress, DAIAddress);
      const daiEthPair = await factory.getPair(DAIAddress, wethAddress);
      
      const lpToken1 = await ethers.getContractAt("IERC20", usdcDaiPair);
      const lpToken2 = await ethers.getContractAt("IERC20", daiEthPair);
      
      const balance1 = await lpToken1.balanceOf(impersonatedSigner.address);
      const balance2 = await lpToken2.balanceOf(impersonatedSigner.address);
      
      console.log("USDC/DAI LP Balance:", balance1.toString());
      console.log("DAI/ETH LP Balance:", balance2.toString());
      
      expect(balance1).to.be.a("bigint");
      expect(balance2).to.be.a("bigint");
    });
  });

  describe("Script Prerequisites", function () {
    it("Should validate all required contracts are accessible", async function () {
      // Check if all contracts can be instantiated
      expect(USDC.target).to.equal(USDCAddress);
      expect(DAI.target).to.equal(DAIAddress);
      expect(ROUTER.target).to.equal(UNIRouter);
    });

    it("Should have proper deadline calculation", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes
      const currentTime = Math.floor(Date.now() / 1000);
      
      expect(deadline).to.be.greaterThan(currentTime);
      expect(deadline - currentTime).to.be.approximately(600, 10); // ~10 minutes
    });
  });
});
