import { expect } from "chai";
import { ethers } from "hardhat";
import { PiggyBank } from "../typechain-types";


describe("PiggyBank", function () {
  let piggyBank: PiggyBank;
  let owner: ;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBankFactory.deploy();
    await piggyBank.deployed();
  });



