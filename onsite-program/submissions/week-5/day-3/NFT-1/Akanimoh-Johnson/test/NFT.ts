import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";
const { expect } = require('chai');
describe('MyNFT', function () {
    it('should mint an NFT', async function () {
        const MyNFT = await ethers.getContractFactory('MyNFT');
        const myNFT = await MyNFT.deploy('ipfs://QmABC/');
        await myNFT.deployed();
        await myNFT.mint('0x123...', 1, '');
        expect(await myNFT.ownerOf(1)).to.equal('0x123...');
    });
});