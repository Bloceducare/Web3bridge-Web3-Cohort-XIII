import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";

describe("Lock", function () {
  let MartinsToken, token, owner, addr1, addr2, addrs;
  
  const TOKEN_NAME = "MartinsToken";
  const TOKEN_SYMBOL = "MTK";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    MartinsToken = await hre.ethers("MartinsToken");
    [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();
    token = await MartinsToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY);
    await token.deployed();
  }
});
