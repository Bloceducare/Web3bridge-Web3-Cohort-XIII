// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Test.sol";
import "../src/UniswapV2SwapWithPermit2.sol";
import "../src/interfaces/IPermit2.sol";

interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}


contract UniswapV2SwapWithPermit2Test is Test{
    address dummyUser;
    uint256 dummyPrivateKey;

address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3; // Example address, replace with actual if needed
// 0xf584F8728B874a6a5c7A8d4d387C9aae9172D621
    address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address HOLDER = 0xf584F8728B874a6a5c7A8d4d387C9aae9172D621;

    UniswapV2SwapWithPermit2 swapContract;
    IERC20Minimal usdc;
    IERC20Minimal dai;

    function setUp() public {
        dummyPrivateKey = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
        dummyUser = vm.addr(dummyPrivateKey);
        vm.createSelectFork(vm.envString("MAINNET_RPC_URL"));
        swapContract = new UniswapV2SwapWithPermit2();
        usdc = IERC20Minimal(USDC);
        dai = IERC20Minimal(DAI);

        vm.startPrank(HOLDER);
        usdc.transfer(address(this), 200e6);
        vm.stopPrank();
    }

    function testSwapWithPermit2() public{
        uint160 amountIn = 100e6;
        uint amountOutMin = 80e18;
        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = DAI;

        uint deadline = block.timestamp + 600;

        IPermit2.PermitSingle memory permitData = IPermit2.PermitSingle({
            token: USDC,
            amount: amountIn,
            expiration:0,
            nonce: 0,
            spender: address(swapContract),
            sigDeadline: deadline
        });
        bytes32 digest = getPermitDigest(permitData, dummyUser, address(PERMIT2));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(dummyPrivateKey, digest);

        bytes memory sig = abi.encodePacked(r, s, v);

        swapContract.swapWithPermit2(USDC, amountIn, amountOutMin, path, dummyUser, deadline, permitData, sig);
    }

    function getPermitDigest(
        IPermit2.PermitSingle memory permitData,
        address owner,
        address permit2Address
    ) internal pure returns(bytes32){
        return keccak256("Dummy digest");
    }

}