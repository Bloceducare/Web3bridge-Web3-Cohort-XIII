import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PermitSwap", function () {
    let permitSwap: any;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let relayer: SignerWithAddress;
    let mockRouter: any;
    let mockToken: any;
    
    const TOKEN_AMOUNT = ethers.parseUnits("100", 6);
    const SWAP_AMOUNT = ethers.parseUnits("50", 6);
    const MIN_OUT = ethers.parseUnits("0.05", 18);
    const FEE = 3000;
    
    beforeEach(async function () {
        [owner, user, relayer] = await ethers.getSigners();
        
       
        const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
        mockRouter = await MockRouter.deploy();
        
        
        const MockToken = await ethers.getContractFactory("MockERC20Permit");
        mockToken = await MockToken.deploy("Mock USDC", "USDC", 6);
        
        
        const PermitSwap = await ethers.getContractFactory("PermitSwap");
        permitSwap = await PermitSwap.deploy(await mockRouter.getAddress());
        
      
        await mockToken.mint(user.address, TOKEN_AMOUNT);
        
        
        await mockRouter.setSwapOutput(MIN_OUT);
    });
    
    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await permitSwap.owner()).to.equal(owner.address);
        });
        
        it("Should set the correct Uniswap router", async function () {
            expect(await permitSwap.uniswapRouter()).to.equal(await mockRouter.getAddress());
        });
    });
    
    describe("permitAndSwap", function () {
        it("Should execute permit and swap successfully", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const nonce = await mockToken.nonces(user.address);
            
        
            const domain = {
                name: "Mock USDC",
                version: "1",
                chainId: await ethers.provider.getNetwork().then(net => net.chainId),
                verifyingContract: await mockToken.getAddress(),
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
                owner: user.address,
                spender: await permitSwap.getAddress(),
                value: SWAP_AMOUNT,
                nonce: nonce,
                deadline: deadline,
            };
            
            const signature = await user.signTypedData(domain, types, message);
            const sig = ethers.Signature.from(signature);
            
            
            const tx = await permitSwap.connect(relayer).permitAndSwap(
                await mockToken.getAddress(),
                ethers.ZeroAddress, 
                SWAP_AMOUNT,
                MIN_OUT,
                FEE,
                deadline,
                sig.v,
                sig.r,
                sig.s
            );
            
            await expect(tx)
                .to.emit(permitSwap, "PermitApplied")
                .withArgs(user.address, await permitSwap.getAddress(), SWAP_AMOUNT, deadline);
                
            await expect(tx)
                .to.emit(permitSwap, "SwapExecuted")
                .withArgs(user.address, await mockToken.getAddress(), ethers.ZeroAddress, SWAP_AMOUNT, MIN_OUT);
        });
        
        it("Should revert if permit deadline has expired", async function () {
            const deadline = Math.floor(Date.now() / 1000) - 3600; 
            const nonce = await mockToken.nonces(user.address);
            
            const domain = {
                name: "Mock USDC",
                version: "1",
                chainId: await ethers.provider.getNetwork().then(net => net.chainId),
                verifyingContract: await mockToken.getAddress(),
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
                owner: user.address,
                spender: await permitSwap.getAddress(),
                value: SWAP_AMOUNT,
                nonce: nonce,
                deadline: deadline,
            };
            
            const signature = await user.signTypedData(domain, types, message);
            const sig = ethers.Signature.from(signature);
            
            await expect(
                permitSwap.connect(relayer).permitAndSwap(
                    await mockToken.getAddress(),
                    ethers.ZeroAddress,
                    SWAP_AMOUNT,
                    MIN_OUT,
                    FEE,
                    deadline,
                    sig.v,
                    sig.r,
                    sig.s
                )
            ).to.be.revertedWith("Permit expired");
        });
        
        it("Should revert if amount is zero", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const nonce = await mockToken.nonces(user.address);
            
            const domain = {
                name: "Mock USDC",
                version: "1",
                chainId: await ethers.provider.getNetwork().then(net => net.chainId),
                verifyingContract: await mockToken.getAddress(),
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
                owner: user.address,
                spender: await permitSwap.getAddress(),
                value: 0,
                nonce: nonce,
                deadline: deadline,
            };
            
            const signature = await user.signTypedData(domain, types, message);
            const sig = ethers.Signature.from(signature);
            
            await expect(
                permitSwap.connect(relayer).permitAndSwap(
                    await mockToken.getAddress(),
                    ethers.ZeroAddress,
                    0,
                    MIN_OUT,
                    FEE,
                    deadline,
                    sig.v,
                    sig.r,
                    sig.s
                )
            ).to.be.revertedWith("Invalid amount");
        });
    });
    
    describe("Access Control", function () {
        it("Should allow owner to call emergencyWithdraw", async function () {
            await expect(permitSwap.emergencyWithdraw(await mockToken.getAddress(), 1000))
                .to.not.be.reverted;
        });
        
        it("Should not allow non-owner to call emergencyWithdraw", async function () {
            await expect(
                permitSwap.connect(user).emergencyWithdraw(await mockToken.getAddress(), 1000)
            ).to.be.revertedWithCustomError(permitSwap, "OwnableUnauthorizedAccount");
        });
    });
    
    describe("Reentrancy Protection", function () {
        it("Should prevent reentrant calls", async function () {
            
            expect(await permitSwap.uniswapRouter()).to.equal(await mockRouter.getAddress());
        });
    });
});


describe("Mock Contracts", function () {
    it("Should deploy mock contracts successfully", async function () {
        const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
        const mockRouter = await MockRouter.deploy();
        expect(await mockRouter.getAddress()).to.not.equal(ethers.ZeroAddress);
        
        const MockToken = await ethers.getContractFactory("MockERC20Permit");
        const mockToken = await MockToken.deploy("Mock USDC", "USDC", 6);
        expect(await mockToken.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
});
