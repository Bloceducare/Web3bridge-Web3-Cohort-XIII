// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/PermitAndSwap.sol";

contract PermitAndSwapTest is Test {
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant PERMIT2_ADDRESS   = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant DAI               = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant WETH              = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address daiWhale = 0x28C6c06298d514Db089934071355E5743bf21d60; 

    PermitAndSwap swapContract;

    function setUp() public {
        vm.createSelectFork(vm.envString("ALCHEMY_MAINNET_URL"));

        swapContract = new PermitAndSwap(PERMIT2_ADDRESS, UNISWAP_V2_ROUTER);

        vm.startPrank(daiWhale);
        IERC20(DAI).transfer(address(this), 1000e18);
        vm.stopPrank();
    }

    function testBasicBalance() public {
        uint256 daiBal = IERC20(DAI).balanceOf(address(this));
        assertGt(daiBal, 0, "Should have DAI for testing");
    }

    function testSwapStub() public {
        IERC20(DAI).approve(address(swapContract), 500e18);
        assertEq(IERC20(DAI).allowance(address(this), address(swapContract)), 500e18);
    }
}
