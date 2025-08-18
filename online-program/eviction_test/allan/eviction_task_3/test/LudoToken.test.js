const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LudoToken", function () {
	it("deploys with correct name, symbol and initial supply to deployer", async function () {
		const [deployer] = await ethers.getSigners();
		const initialSupply = ethers.parseUnits("1000000", 18);

		const LudoToken = await ethers.getContractFactory("LudoToken");
		const token = await LudoToken.deploy(initialSupply);
		await token.waitForDeployment();

		expect(await token.name()).to.equal("Ludo Token");
		expect(await token.symbol()).to.equal("LUDO");
		expect(await token.totalSupply()).to.equal(initialSupply);
		expect(await token.balanceOf(await deployer.getAddress())).to.equal(initialSupply);
	});

	it("transfers tokens between accounts", async function () {
		const [deployer, alice, bob] = await ethers.getSigners();
		const initialSupply = ethers.parseUnits("1000", 18);

		const LudoToken = await ethers.getContractFactory("LudoToken");
		const token = await LudoToken.deploy(initialSupply);
		await token.waitForDeployment();

		const amountToAlice = ethers.parseUnits("100", 18);
		await token.transfer(await alice.getAddress(), amountToAlice);
		expect(await token.balanceOf(await alice.getAddress())).to.equal(amountToAlice);

		const amountToBob = ethers.parseUnits("40", 18);
		await token.connect(alice).transfer(await bob.getAddress(), amountToBob);
		expect(await token.balanceOf(await bob.getAddress())).to.equal(amountToBob);
		expect(await token.balanceOf(await alice.getAddress())).to.equal(amountToAlice - amountToBob);
	});

	it("supports approvals and allowances", async function () {
		const [deployer, alice, spender] = await ethers.getSigners();
		const initialSupply = ethers.parseUnits("500", 18);

		const LudoToken = await ethers.getContractFactory("LudoToken");
		const token = await LudoToken.deploy(initialSupply);
		await token.waitForDeployment();

		const grantToAlice = ethers.parseUnits("200", 18);
		await token.transfer(await alice.getAddress(), grantToAlice);
		expect(await token.balanceOf(await alice.getAddress())).to.equal(grantToAlice);

		const allowance = ethers.parseUnits("50", 18);
		await token.connect(alice).approve(await spender.getAddress(), allowance);
		expect(await token.allowance(await alice.getAddress(), await spender.getAddress())).to.equal(allowance);

		await token.connect(spender).transferFrom(await alice.getAddress(), await deployer.getAddress(), allowance);
		expect(await token.balanceOf(await deployer.getAddress())).to.equal(initialSupply - grantToAlice + allowance);
		expect(await token.balanceOf(await alice.getAddress())).to.equal(grantToAlice - allowance);
		expect(await token.allowance(await alice.getAddress(), await spender.getAddress())).to.equal(0n);
	});
}); 