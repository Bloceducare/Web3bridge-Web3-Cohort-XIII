// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {PermitSwapScript} from "../script/PermitSwap.s.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
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

contract PermitSwapTest is Test {
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant DAI_WHALE = 0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf;
    
    bytes32 constant PERMIT_TYPEHASH = keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");
    bytes32 constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    
    PermitSwapScript public script;
    uint256 public userPrivateKey;
    address public user;
    
    function setUp() public {
        userPrivateKey = 0xA11CE;
        user = vm.addr(userPrivateKey);
        
        script = new PermitSwapScript();
        
        vm.deal(user, 10 ether);
        vm.deal(DAI_WHALE, 100 ether);
        
        console.log("Test setup complete");
        console.log("User address:", user);
        console.log("DAI Whale balance:", IERC20(DAI).balanceOf(DAI_WHALE));
    }
    function testDAIPermitSignature() public {
        uint256 amount = 1000 * 1e18; // 1000 DAI
        uint256 deadline = block.timestamp + 3600;
        
        vm.startPrank(DAI_WHALE);
        IERC20(DAI).transfer(user, amount);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        uint256 nonce = IERC20Permit(DAI).nonces(user);
        bytes32 domainSeparator = getDomainSeparator();
        
        bytes32 structHash = keccak256(abi.encode(
            PERMIT_TYPEHASH,
            user,
            UNISWAP_V2_ROUTER,
            nonce,
            deadline,
            true
        ));
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
        
        IERC20Permit(DAI).permit(user, UNISWAP_V2_ROUTER, nonce, deadline, v, r, s);
        
        uint256 allowance = IERC20(DAI).allowance(user, UNISWAP_V2_ROUTER);
        assertGt(allowance, 0, "Permit should have set allowance");
        
        vm.stopPrank();
        
        console.log("DAI permit test passed");
        console.log("Allowance set:", allowance);
    }
    
    function testDAIToWETHSwap() public {
        uint256 amountIn = 1000 * 1e18; // 1000 DAI
        
        vm.startPrank(DAI_WHALE);
        IERC20(DAI).transfer(user, amountIn);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        uint256 initialDAIBalance = IERC20(DAI).balanceOf(user);
        uint256 initialWETHBalance = IERC20(WETH).balanceOf(user);
        
        console.log("Initial DAI balance:", initialDAIBalance);
        console.log("Initial WETH balance:", initialWETHBalance);
        
        IERC20(DAI).approve(UNISWAP_V2_ROUTER, amountIn);
        
        address[] memory path = new address[](2);
        path[0] = DAI;
        path[1] = WETH;
        
        uint256[] memory expectedAmounts = IUniswapV2Router(UNISWAP_V2_ROUTER).getAmountsOut(amountIn, path);
        console.log("Expected WETH out:", expectedAmounts[1]);
        
        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER).swapExactTokensForTokens(
            amountIn,
            0, // Accept any amount of WETH
            path,
            user,
            block.timestamp + 1800
        );
        
        uint256 finalDAIBalance = IERC20(DAI).balanceOf(user);
        uint256 finalWETHBalance = IERC20(WETH).balanceOf(user);
        
        console.log("Final DAI balance:", finalDAIBalance);
        console.log("Final WETH balance:", finalWETHBalance);
        console.log("WETH received:", amounts[1]);
        
        assertEq(finalDAIBalance, initialDAIBalance - amountIn, "DAI should be deducted");
        assertGt(finalWETHBalance, initialWETHBalance, "Should receive WETH");
        assertEq(amounts[1], finalWETHBalance - initialWETHBalance, "Amounts should match");
        
        vm.stopPrank();
    }

    function getDomainSeparator() public view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("Dai Stablecoin")),
            keccak256(bytes("1")),
            block.chainid,
            DAI
        ));
    }
    
}