// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

contract PermitSwapScript is Script {
    bytes32 public constant DAI_PERMIT_TYPEHASH = keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant DAI_WHALE = 0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(privateKey);

        console.log("Starting PermitSwap script...");
        console.log("User address:", user);
        console.log("Block number:", block.number);
        console.log("Chain ID:", block.chainid);

   
        vm.deal(user, 10 ether);
        vm.deal(DAI_WHALE, 100 ether);

        // Step 1: Transfer DAI from whale to user
        vm.startPrank(DAI_WHALE);
        uint256 whaleDaiBalance = IERC20(DAI).balanceOf(DAI_WHALE);
        console.log("Whale DAI balance:", whaleDaiBalance);

        uint256 amountIn = whaleDaiBalance > 1000e18 ? 1000e18 : 0.2 ether;
        console.log("Amount to transfer:", amountIn);
        
        require(whaleDaiBalance >= amountIn, "Whale doesn't have enough DAI");
        IERC20(DAI).transfer(user, amountIn);
        vm.stopPrank();

     
        uint256 swapResult = _executePermitAndSwap(user, privateKey, amountIn);
        console.log("Script completed successfully!");
        console.log("WETH received:", swapResult);
    }

   
    function _executePermitAndSwap(address user, uint256 privateKey, uint256 amountIn) internal returns (uint256) {
        vm.startPrank(user);
        
        uint256 userDaiBalance = IERC20(DAI).balanceOf(user);
        uint256 userWethBalance = IERC20(WETH).balanceOf(user);
        console.log("User DAI balance after transfer:", userDaiBalance);
        console.log("User WETH balance before swap:", userWethBalance);

       
        _executePermit(user, privateKey);
    
        uint256 wethReceived = _executeSwap(user, amountIn);
        
        vm.stopPrank();
        
  
        _logSwapResults(userDaiBalance, userWethBalance, amountIn, wethReceived);
        
        return wethReceived;
    }
    
    function _executePermit(address user, uint256 privateKey) internal {
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = IERC20Permit(DAI).nonces(user);
        
        console.log("Creating permit signature...");
        console.log("Nonce:", nonce);
        console.log("Deadline:", deadline);

        bytes32 domainSeparator = getDomainSeparator();
        bytes32 structHash = getDAIPermitHash(user, UNISWAP_V2_ROUTER, nonce, deadline, true);
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        console.log("Executing permit...");
        IERC20Permit(DAI).permit(user, UNISWAP_V2_ROUTER, nonce, deadline, true, v, r, s);
        
        uint256 allowance = IERC20(DAI).allowance(user, UNISWAP_V2_ROUTER);
        console.log("Allowance after permit:", allowance);
        require(allowance > 0, "Permit failed");
    }
    
    function _executeSwap(address user, uint256 amountIn) internal returns (uint256) {
        console.log("Setting up swap...");
        address[] memory path = new address[](2);
        path[0] = DAI;
        path[1] = WETH;
        
        uint256[] memory expectedAmounts = IUniswapV2Router(UNISWAP_V2_ROUTER).getAmountsOut(amountIn, path);
        console.log("Expected WETH output:", expectedAmounts[1]);
        
        console.log("Executing swap...");
        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER).swapExactTokensForTokens(
            amountIn,
            0,
            path,
            user,
            block.timestamp + 3600
        );
        
        return amounts[1];
    }
    
    function _logSwapResults(uint256 initialDai, uint256 initialWeth, uint256 amountIn, uint256 wethReceived) internal view {
        uint256 finalUserDaiBalance = IERC20(DAI).balanceOf(msg.sender);
        uint256 finalUserWethBalance = IERC20(WETH).balanceOf(msg.sender);
        
        console.log("=== SWAP COMPLETED ===");
        console.log("DAI spent:", amountIn);
        console.log("WETH received:", wethReceived);
        console.log("Final DAI balance:", finalUserDaiBalance);
        console.log("Final WETH balance:", finalUserWethBalance);
        console.log("WETH gained:", finalUserWethBalance - initialWeth);
        
        require(finalUserDaiBalance == initialDai - amountIn, "DAI balance mismatch");
        require(finalUserWethBalance > initialWeth, "Should have received WETH");
        require(wethReceived == finalUserWethBalance - initialWeth, "Amount mismatch");
    }

    // Get DAI domain separator
    function getDomainSeparator() public view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("Dai Stablecoin")),
            keccak256(bytes("1")),
            block.chainid,
            DAI
        ));
    }

    // Get DAI permit hash (different from standard ERC20Permit)
    function getDAIPermitHash(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(
            DAI_PERMIT_TYPEHASH,
            holder,
            spender,
            nonce,
            expiry,
            allowed
        ));
    }
}

// Interface definitions
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function decimals() external view returns (uint8);
}

interface IERC20Permit {
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external view returns (uint256[] memory amounts);
}