import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { ERC20 } from "../typechain-types";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("ERC20", () => {
  let ERC20Factory;
  let ERC20Instance: ERC20;

  beforeEach(async () => {
    ERC20Factory = await ethers.getContractFactory("ERC20");
    ERC20Instance = await ERC20Factory.deploy("Praise", "PR", 8);

    await ERC20Instance.waitForDeployment();
  });

  describe("constructor", async () => {
    it("Should have deployed successfully", async () => {
      expect(await ERC20Instance.decimals()).to.equal(8);
      expect(await ERC20Instance.name()).to.equal("Praise");
      expect(await ERC20Instance.symbol()).to.equal("PR");
    });
  });

  describe("burn", async () => {
    it("Should burn when called by owner", async () => {
      const [_, jake, sandra] = await ethers.getSigners();

      const amountToMint = 1e8;
      await ERC20Instance.mint(jake.address, amountToMint);
      await ERC20Instance.mint(sandra.address, amountToMint);

      // assert totalSupply before burning
      expect(await ERC20Instance.totalSupply()).to.equal(amountToMint * 2);

      // assert that transfer event is emitted when token is burnt
      expect(await ERC20Instance.burn(jake.address, amountToMint))
        .to.emit(ERC20Instance, "Transfer")
        .withArgs(jake.address, ethers.ZeroAddress, amountToMint);

      // test totalSupply after burning
      expect(await ERC20Instance.totalSupply()).to.equal(amountToMint);
    });

    it("Should not burn when called by non-owner", async () => {
      const [_, jake, sandra] = await ethers.getSigners();

      const amountToMint = 1e8;
      await ERC20Instance.mint(jake.address, amountToMint);
      await ERC20Instance.mint(sandra.address, amountToMint);

      // try burning as jake
      await expect(
        ERC20Instance.connect(jake).burn(sandra.address, amountToMint)
      ).to.revertedWithCustomError(ERC20Instance, "UnAuthorized");

      // ensure that it wasn't burnt successfully
      expect(await ERC20Instance.totalSupply()).to.equal(amountToMint * 2);
    });
  });

  describe("mint", async () => {
    it("Should mint when called by owner", async () => {
      const [_, jake] = await ethers.getSigners();

      expect(await ERC20Instance.mint(jake.address, 1e8))
        .to.emit(ERC20Instance, "Transfer")
        .withArgs(ethers.ZeroAddress, jake.address, 1e8);

      expect(await ERC20Instance.balanceOf(jake.address)).to.equal(1e8);
      expect(await ERC20Instance.totalSupply()).to.equal(1e8);
    });

    it("Should not mint when called by non-owner", async () => {
      const [_, jake] = await ethers.getSigners();

      await expect(
        ERC20Instance.connect(jake).mint(jake.address, 1e8)
      ).to.revertedWithCustomError(ERC20Instance, "UnAuthorized");
    });
  });

  describe("allowance", async () => {
    it("should be 0 when not approved", async () => {
      const [_, jake, john] = await ethers.getSigners();

      expect(
        await ERC20Instance.allowance(jake.address, john.address)
      ).to.equal(0);
    });

    it("should be a non zero value when approved with a non-zero value", async () => {
      const [_, jake, john] = await ethers.getSigners();

      const amountToMint = 1e8;

      // mint some tokens to jake and then approve john to spend it
      await ERC20Instance.mint(jake.address, amountToMint);
      await ERC20Instance.connect(jake).approve(john.address, amountToMint / 2);

      expect(
        await ERC20Instance.allowance(jake.address, john.address)
      ).to.equal(amountToMint / 2);
    });
  });

  describe("transfer", async () => {
    it("should increment recipient's balance and decrease the sender's balance", async () => {
      const [_, jake, john] = await ethers.getSigners();
      const amountToMint = 1e8;

      // give jake some tokens
      await ERC20Instance.mint(jake.address, amountToMint);

      const jakesOldBalance = await ERC20Instance.balanceOf(jake.address);
      const johnsOldBalance = await ERC20Instance.balanceOf(john.address);

      // jake transfers to john
      // test that the right event is emitted
      expect(
        await ERC20Instance.connect(jake).transfer(
          john.address,
          amountToMint / 2
        )
      )
        .to.emit(ERC20Instance, "Transfer")
        .withArgs(jake.address, john.address, amountToMint / 2);

      const jakesNewBalance = await ERC20Instance.balanceOf(jake.address);
      const johnsNewBalance = await ERC20Instance.balanceOf(john.address);
      // ensure jake's balance reduces by the amount he transferred
      expect(Number(jakesOldBalance) - amountToMint / 2).to.equal(
        jakesNewBalance
      );

      // ensure john's balance increases
      expect(Number(johnsNewBalance) - Number(johnsOldBalance)).to.equal(
        amountToMint / 2
      );
    });

    it("should fail if sender has insufficient balance", async () => {});

    it("should not be able to transfer to Zero-address", async () => {});
  });
    
    describe("approve", async () => {
      it("should emit Approval event when approved", async () => {
        const [_, jake, john] = await ethers.getSigners();

        const amountToMint = 1e8;

        // mint some tokens to jake and then approve john to spend it
        await ERC20Instance.mint(jake.address, amountToMint);
        expect(await ERC20Instance.connect(jake).approve(
          john.address,
          amountToMint / 2
        )).to
            .emit(ERC20Instance, "Approval")
            .withArgs(jake.address, john.address, (amountToMint/2));
      });
  })
});
