import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SwapPermit Test", function () {
  async function deployedSwapPermit() {
    const SwapPermitContract = await hre.ethers.getContractFactory(
      "swapPermit"
    );

    const [owner, relayer, recipient] = await hre.ethers.getSigners();

    // Token addresses (Ethereum Mainnet)
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    // Test amounts
    const AMOUNT_IN = hre.ethers.parseEther("100"); // 100 DAI
    const DEADLINE = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Deploy contract
    const swapPermitContract = await SwapPermitContract.deploy();
    await swapPermitContract.waitForDeployment();

    // Get token contracts
    const daiPermit = await hre.ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol:IERC20Permit",
      DAI_ADDRESS
    );
    const dai = await hre.ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      DAI_ADDRESS
    );
    const usdc = await hre.ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      USDC_ADDRESS
    );

    // Setup DAI whale for testing
    const whaleAddress = "0x28c6c06298d514db089934071355e5743bf21d60";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [whaleAddress],
    });
    const whale = await hre.ethers.getSigner(whaleAddress);

    // Give owner some DAI
    await dai.connect(whale).transfer(owner.address, AMOUNT_IN);

    return {
      swapPermitContract,
      dai,
      daiPermit,
      usdc,
      owner,
      relayer,
      recipient,
      DAI_ADDRESS,
      USDC_ADDRESS,
      AMOUNT_IN,
      DEADLINE,
    };
  }

  // Helper function to create permit signature
  async function createPermitSignature(
    daiPermit,
    owner,
    spender,
    amount,
    deadline
  ) {
    const domain = {
      name: await daiPermit.name(),
      version: "1",
      chainId: (await hre.ethers.provider.getNetwork()).chainId,
      verifyingContract: await daiPermit.getAddress(),
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: owner.address,
      spender: spender,
      value: amount,
      nonce: await daiPermit.nonces(owner.address),
      deadline: deadline,
    };

    const signature = await owner.signTypedData(domain, types, message);
    return hre.ethers.Signature.from(signature);
  }

  describe("Contract Deployment", function () {
    it("should deploy the contract successfully", async function () {
      const { swapPermitContract } = await loadFixture(deployedSwapPermit);

      const contractAddress = await swapPermitContract.getAddress();
      expect(contractAddress).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("should have correct Uniswap router address", async function () {
      const { swapPermitContract } = await loadFixture(deployedSwapPermit);

      const routerAddress = await swapPermitContract.SWAP_ROUTER();
      expect(routerAddress).to.equal(
        "0xE592427A0AEce92De3Edee1F18E0157C05861564"
      );
    });
  });

  describe("Basic Swap with Permit", function () {
    it("should allow owner to swap DAI to USDC using permit", async function () {
      const {
        swapPermitContract,
        dai,
        daiPermit,
        usdc,
        owner,
        recipient,
        AMOUNT_IN,
        DEADLINE,
      } = await loadFixture(deployedSwapPermit);

      // Check initial balances
      const initialDAI = await dai.balanceOf(owner.address);
      expect(initialDAI).to.equal(AMOUNT_IN);

      // Create permit signature
      const contractAddress = await swapPermitContract.getAddress();
      const { v, r, s } = await createPermitSignature(
        daiPermit,
        owner,
        contractAddress,
        AMOUNT_IN,
        DEADLINE
      );

      // Execute swap using the simple DAI->USDC function
      await swapPermitContract.connect(owner).swapWithPermit(
        owner.address,
        {
          token: DAI_ADDRESS,
          amount: AMOUNT_IN,
          nonce: await daiPermit.nonces(owner.address),
          deadline: DEADLINE,
        },
        recipient.address,
        0,
        DEADLINE,
        v,
        r,
        s
      );

      // Check that recipient got USDC
      const usdcBalance = await usdc.balanceOf(recipient.address);
      expect(usdcBalance).to.be.gt(0);
    });
  });

  describe("Relayer Execution", function () {
    it("should allow relayer to execute swap for owner", async function () {
      const {
        swapPermitContract,
        dai,
        daiPermit,
        usdc,
        owner,
        relayer,
        recipient,
        AMOUNT_IN,
        DEADLINE,
      } = await loadFixture(deployedSwapPermit);

      // Owner creates permit signature
      const contractAddress = await swapPermitContract.getAddress();
      const { v, r, s } = await createPermitSignature(
        daiPermit,
        owner,
        contractAddress,
        AMOUNT_IN,
        DEADLINE
      );

      // Relayer submits the transaction (pays gas)
      const tx = await swapPermitContract.connect(relayer).swapWithPermit(
        owner.address,
        {
          token: DAI_ADDRESS,
          amount: AMOUNT_IN,
          nonce: await daiPermit.nonces(owner.address),
          deadline: DEADLINE,
        },
        recipient.address,
        0,
        DEADLINE,
        v,
        r,
        s
      );

      // Wait for transaction
      await tx.wait();

      // Verify recipient got USDC
      const usdcBalance = await usdc.balanceOf(recipient.address);
      expect(usdcBalance).to.be.gt(0);
    });
  });

  describe("Advanced Swap Function", function () {
    it("should work with the full swapWithPermit function", async function () {
      const {
        swapPermitContract,
        dai,
        daiPermit,
        usdc,
        owner,
        recipient,
        DAI_ADDRESS,
        USDC_ADDRESS,
        AMOUNT_IN,
        DEADLINE,
      } = await loadFixture(deployedSwapPermit);

      // Create permit signature
      const contractAddress = await swapPermitContract.getAddress();
      const { v, r, s } = await createPermitSignature(
        daiPermit,
        owner,
        contractAddress,
        AMOUNT_IN,
        DEADLINE
      );

      // Execute swap with full function
      const tx = await swapPermitContract.connect(owner).swapWithPermit(
        owner.address,
        {
          token: DAI_ADDRESS,
          amount: AMOUNT_IN,
          nonce: await daiPermit.nonces(owner.address),
          deadline: DEADLINE,
        },
        recipient.address,
        0,
        DEADLINE,
        v,
        r,
        s
      );

      const receipt = await tx.wait();

      // Check for SwapExecuted event
      const swapEvent = await receipt.getEvent("SwapExecuted");
      expect(swapEvent).to.exist;

      // Verify recipient got USDC
      const usdcBalance = await usdc.balanceOf(recipient.address);
      expect(usdcBalance).to.be.gt(0);
    });
  });
});
