// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./interfaces/IPermit2.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router.sol"; 

contract UniswapPermit2Swap {
    bool private _reentrancyGuard;
    IPermit2 public immutable PERMIT2;
    IUniswapV2Router public immutable ROUTER;

    event SwappedWithPermit(
        address indexed owner,
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut,
        address recipient
    );

    constructor(IPermit2 permit2_, IUniswapV2Router router_) {
        PERMIT2 = permit2_;
        ROUTER = router_;
    }

    modifier nonReentrant() {
        require(!_reentrancyGuard, "No reentrancy");
        _reentrancyGuard = true;
        _;
        _reentrancyGuard = false;
    }


function testPermitAndSwap() public {
    uint256 amountIn = 100 ether;
    uint256 amountOutMin = 50 ether;
    uint256 deadline = block.timestamp + 1 hours;

    // Create Permit2 structs
    IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
        permitted: IPermit2.TokenPermissions({
            token: IERC20(address(tokenA)),
            amount: amountIn
        }),
        nonce: 0,
        deadline: deadline
    });

    IPermit2.SignatureTransferDetails memory details = IPermit2.SignatureTransferDetails({
        to: address(swapper),
        requestedAmount: amountIn
    });

    bytes memory signature = hex"00"; // Fake signature for mock

    // ✅ Properly declare and initialize the swap path
    address ;
    path[0] = address(tokenA);
    path[1] = address(tokenB);

    vm.prank(user);
    swapper.permitAndSwap(
        permit,
        details,
        user,
        signature,
        amountOutMin,
        path,
        user,
        deadline
    );

    // Assertions: check balances
    assertEq(tokenB.balanceOf(user), router.mockOutputAmount());
    }

}
