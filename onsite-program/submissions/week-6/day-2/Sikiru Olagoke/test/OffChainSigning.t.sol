// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {OffChainSigning} from "../src/OffChainSigning.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IUniswapV2Router02} from "v2-periphery/interfaces/IUniswapV2Router02.sol";

contract OffChainSigningTest is Test {
    OffChainSigning  UNISWAP;
    address ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address AssetHolder = 0xf584F8728B874a6a5c7A8d4d387C9aae9172D621;
    address USDCAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address WETHAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;



    function setUp() public {
      vm.createSelectFork("https://eth-mainnet.g.alchemy.com/v2/qvCM-n-M-5vnI80Ybtrsi2ZN2qmgFhcL");
      
      UNISWAP = new OffChainSigning(ROUTER);
        
    }

    function testSwapWithPermit() public {
       uint256 PRIVATE_KEY = 0x69936b6d2cd7b90d2b46302f1ce500955f8c0ba81610eab68d57af866510f5b9;
       address userAddress = vm.addr(PRIVATE_KEY);
       uint256 amountIn = 20000000;

       //Transfer USDC to userAddress
       vm.prank(AssetHolder);
       IERC20(USDCAddress).transfer(userAddress, amountIn);

       //Prepare perpare
       uint256 nonce = IERC20Permit(USDCAddress).nonces(userAddress);
       uint256 permitDeadline = block.timestamp + 1 hours;
       bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
       bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, userAddress, address(UNISWAP), amountIn, nonce, permitDeadline));
       bytes32 domainSeparator = IERC20Permit(USDCAddress).DOMAIN_SEPARATOR();
       bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
       (uint8 v, bytes32 r, bytes32 s) = vm.sign(PRIVATE_KEY, digest);

       //PREPARE SWAP PARAMS
       address[] memory path = new address[](2);
       path[0] = USDCAddress;
       path[1]= WETHAddress;
       uint256 amountOutMin = 1;
       uint256 swapDeadline = block.timestamp + 1 hours;

       uint256 balanceBefore = IERC20(WETHAddress).balanceOf(userAddress);

       //Execute swap with permit 
       UNISWAP.swapWithPermit(
         USDCAddress,
         amountIn,
         amountOutMin,
         path,
         userAddress,
         swapDeadline,
         OffChainSigning.Permit(userAddress, amountIn, permitDeadline, v, r, s)
       );

       uint256 balanceAfter = IERC20(USDCAddress).balanceOf(userAddress);
       assertGt(balanceAfter, balanceBefore, "Swap failed to increase USDC balance");
    }

}
