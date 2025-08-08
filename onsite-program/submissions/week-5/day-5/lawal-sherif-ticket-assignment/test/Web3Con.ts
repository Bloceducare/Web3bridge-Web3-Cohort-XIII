const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Web3Con", function () {
  let web3ConSystem;
  let token;
  let owner;
  let user1;
  let user2;
  let user3;

  const REGISTRATION_REWARD = ethers.parseEther("100000"); // 100k tokens
  const NFT_COST = ethers.parseEther("10000"); // 10k tokens

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy the Web3ConSystem contract
    const Web3ConSystem = await ethers.getContractFactory("Web3ConSystem");
    web3ConSystem = await Web3ConSystem.deploy();
    await web3ConSystem.waitForDeployment();

    // Get the token contract address
    const tokenAddress = await web3ConSystem.token();
    const Web3ConToken = await ethers.getContractFactory("Web3ConToken");
    token = Web3ConToken.attach(tokenAddress);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await web3ConSystem.owner()).to.equal(owner.address);
    });

    it("Should deploy with correct token contract", async function () {
      expect(await web3ConSystem.token()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct constants", async function () {
      expect(await web3ConSystem.REGISTRATION_REWARD()).to.equal(
        REGISTRATION_REWARD
      );
      expect(await web3ConSystem.NFT_COST()).to.equal(NFT_COST);
    });
  });

  describe("User Registration", function () {
    it("Should register a new user successfully", async function () {
      await expect(web3ConSystem.connect(user1).registerUser("Alice"))
        .to.emit(web3ConSystem, "UserRegistered")
        .withArgs(user1.address, "Alice");

      const userInfo = await web3ConSystem.getUserInfo(user1.address);
      expect(userInfo.name).to.equal("Alice");
      expect(userInfo.walletAddress).to.equal(user1.address);
      expect(userInfo.isRegistered).to.be.true;
    });

    it("Should give 100k tokens to new user", async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");

      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(REGISTRATION_REWARD);
    });

    it("Should not allow empty name", async function () {
      await expect(
        web3ConSystem.connect(user1).registerUser("")
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should not allow duplicate registration", async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");

      await expect(
        web3ConSystem.connect(user1).registerUser("Alice Again")
      ).to.be.revertedWith("User already registered");
    });

    it("Should allow multiple different users to register", async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");
      await web3ConSystem.connect(user2).registerUser("Bob");

      expect(await web3ConSystem.isUserRegistered(user1.address)).to.be.true;
      expect(await web3ConSystem.isUserRegistered(user2.address)).to.be.true;
    });
  });

  describe("Token Approval", function () {
    beforeEach(async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");
    });

    it("Should allow registered user to approve token spending directly on token contract", async function () {
      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);

      const allowance = await token.allowance(
        user1.address,
        web3ConSystem.target
      );
      expect(allowance).to.equal(ethers.MaxUint256);
    });

    it("Should check if user has approved enough tokens", async function () {
      expect(await web3ConSystem.hasApprovedTokens(user1.address)).to.be.false;

      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);
      expect(await web3ConSystem.hasApprovedTokens(user1.address)).to.be.true;
    });

    it("Should return token contract address", async function () {
      const tokenAddress = await web3ConSystem.getTokenAddress();
      expect(tokenAddress).to.equal(token.target);
    });
  });

  describe("NFT Minting", function () {
    beforeEach(async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");
      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);
    });

    it("Should mint NFT successfully for registered user", async function () {
      await expect(web3ConSystem.connect(user1).mintNFT())
        .to.emit(web3ConSystem, "NFTMinted")
        .withArgs(user1.address, 0);

      expect(await web3ConSystem.ownerOf(0)).to.equal(user1.address);
      expect(await web3ConSystem.balanceOf(user1.address)).to.equal(1);
    });

    it("Should deduct correct amount of tokens when minting", async function () {
      const balanceBefore = await token.balanceOf(user1.address);

      await web3ConSystem.connect(user1).mintNFT();

      const balanceAfter = await token.balanceOf(user1.address);
      expect(balanceBefore - balanceAfter).to.equal(NFT_COST);
    });

    it("Should increment token ID for each mint", async function () {
      await web3ConSystem.connect(user2).registerUser("Bob");
      await token
        .connect(user2)
        .approve(web3ConSystem.target, ethers.MaxUint256);

      await web3ConSystem.connect(user1).mintNFT();
      await web3ConSystem.connect(user2).mintNFT();

      expect(await web3ConSystem.ownerOf(0)).to.equal(user1.address);
      expect(await web3ConSystem.ownerOf(1)).to.equal(user2.address);
      expect(await web3ConSystem.nextTokenId()).to.equal(2);
    });

    it("Should not allow unregistered user to mint", async function () {
      await expect(web3ConSystem.connect(user2).mintNFT()).to.be.revertedWith(
        "User must be registered first"
      );
    });

    it("Should not allow minting with insufficient tokens", async function () {
      // Mint 10 NFTs to exhaust tokens (100k tokens / 10k per NFT = 10 max)
      for (let i = 0; i < 10; i++) {
        await web3ConSystem.connect(user1).mintNFT();
      }

      // 11th mint should fail
      await expect(web3ConSystem.connect(user1).mintNFT()).to.be.revertedWith(
        "Insufficient tokens"
      );
    });

    it("Should allow multiple NFT mints for same user", async function () {
      await web3ConSystem.connect(user1).mintNFT();
      await web3ConSystem.connect(user1).mintNFT();
      await web3ConSystem.connect(user1).mintNFT();

      expect(await web3ConSystem.balanceOf(user1.address)).to.equal(3);
      expect(await web3ConSystem.ownerOf(0)).to.equal(user1.address);
      expect(await web3ConSystem.ownerOf(1)).to.equal(user1.address);
      expect(await web3ConSystem.ownerOf(2)).to.equal(user1.address);
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");
      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);
      await web3ConSystem.connect(user1).mintNFT();
    });

    it("Should return correct IPFS URI for existing token", async function () {
      const tokenURI = await web3ConSystem.tokenURI(0);
      const expectedURI =
        "https://bronze-ready-tarsier-679.mypinata.cloud/ipfs/bafybeiaeml3capus4fkpiy52tmve27es4vclvttakftxj5bapvlsjuxina/0.json";
      expect(tokenURI).to.equal(expectedURI);
    });

    it("Should revert for non-existent token", async function () {
      await expect(web3ConSystem.tokenURI(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");
    });

    it("Should return correct user info", async function () {
      const userInfo = await web3ConSystem.getUserInfo(user1.address);
      expect(userInfo.name).to.equal("Alice");
      expect(userInfo.walletAddress).to.equal(user1.address);
      expect(userInfo.isRegistered).to.be.true;
    });

    it("Should return correct token balance", async function () {
      const balance = await web3ConSystem.getUserTokenBalance(user1.address);
      expect(balance).to.equal(REGISTRATION_REWARD);
    });

    it("Should return correct registration status", async function () {
      expect(await web3ConSystem.isUserRegistered(user1.address)).to.be.true;
      expect(await web3ConSystem.isUserRegistered(user2.address)).to.be.false;
    });
  });

  describe("Owner Functions", function () {
    beforeEach(async function () {
      await web3ConSystem.connect(user1).registerUser("Alice");
      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);
      await web3ConSystem.connect(user1).mintNFT(); // This sends tokens to the contract
    });

    it("Should allow owner to withdraw tokens", async function () {
      const contractBalance = await token.balanceOf(web3ConSystem.target);
      expect(contractBalance).to.equal(NFT_COST);

      await web3ConSystem.connect(owner).withdrawTokens();

      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(NFT_COST);
      expect(await token.balanceOf(web3ConSystem.target)).to.equal(0);
    });

    it("Should not allow non-owner to withdraw tokens", async function () {
      await expect(
        web3ConSystem.connect(user1).withdrawTokens()
      ).to.be.revertedWithCustomError(
        web3ConSystem,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should revert when trying to withdraw with no tokens", async function () {
      await web3ConSystem.connect(owner).withdrawTokens(); // Withdraw first

      await expect(
        web3ConSystem.connect(owner).withdrawTokens()
      ).to.be.revertedWith("No tokens to withdraw");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete user journey", async function () {
      // 1. User registers
      await web3ConSystem.connect(user1).registerUser("Alice");
      expect(await web3ConSystem.isUserRegistered(user1.address)).to.be.true;
      expect(await token.balanceOf(user1.address)).to.equal(
        REGISTRATION_REWARD
      );

      // 2. User approves token spending directly on token contract
      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);

      // 3. User mints multiple NFTs
      await web3ConSystem.connect(user1).mintNFT();
      await web3ConSystem.connect(user1).mintNFT();
      await web3ConSystem.connect(user1).mintNFT();

      // 4. Check final state
      expect(await web3ConSystem.balanceOf(user1.address)).to.equal(3);
      expect(await token.balanceOf(user1.address)).to.equal(
        REGISTRATION_REWARD - NFT_COST * 3n
      );
      expect(await token.balanceOf(web3ConSystem.target)).to.equal(
        NFT_COST * 3n
      );
    });

    it("Should handle multiple users independently", async function () {
      // Register multiple users
      await web3ConSystem.connect(user1).registerUser("Alice");
      await web3ConSystem.connect(user2).registerUser("Bob");
      await web3ConSystem.connect(user3).registerUser("Charlie");

      // All users approve and mint
      await token
        .connect(user1)
        .approve(web3ConSystem.target, ethers.MaxUint256);
      await token
        .connect(user2)
        .approve(web3ConSystem.target, ethers.MaxUint256);
      await token
        .connect(user3)
        .approve(web3ConSystem.target, ethers.MaxUint256);

      await web3ConSystem.connect(user1).mintNFT();
      await web3ConSystem.connect(user2).mintNFT();
      await web3ConSystem.connect(user3).mintNFT();

      // Check each user has their NFT
      expect(await web3ConSystem.ownerOf(0)).to.equal(user1.address);
      expect(await web3ConSystem.ownerOf(1)).to.equal(user2.address);
      expect(await web3ConSystem.ownerOf(2)).to.equal(user3.address);

      // Check token balances
      const expectedBalance = REGISTRATION_REWARD - NFT_COST;
      expect(await token.balanceOf(user1.address)).to.equal(expectedBalance);
      expect(await token.balanceOf(user2.address)).to.equal(expectedBalance);
      expect(await token.balanceOf(user3.address)).to.equal(expectedBalance);
    });
  });
});
