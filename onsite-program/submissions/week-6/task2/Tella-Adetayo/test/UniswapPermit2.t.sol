// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/UniswapPermit2Swap.sol";


contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockPermit2 is IPermit2 {
    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata /*signature*/
    ) external override {
        // Simply transfer tokens directly for the test
        IERC20(permit.permitted.token).transferFrom(owner, transferDetails.to, transferDetails.requestedAmount);
    }
}

contract MockRouter is IUniswapV2Router {
    address public tokenOut;

    constructor(address _tokenOut) {
        tokenOut = _tokenOut;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 /*deadline*/
    ) external override returns (uint256[] memory amounts) {
        // Just mint the output token for the recipient
        MockERC20(tokenOut).mint(to, amountOutMin);
        amounts = new uint256 ;
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;
    }
}


contract UniswapPermit2SwapTest is Test {
    MockERC20 tokenA;
    MockERC20 tokenB;
    MockPermit2 permit2;
    MockRouter router;
    UniswapPermit2Swap swapper;

    address user = address(0x123);

    function setUp() public {
        tokenA = new MockERC20("Token A", "TKA");
        tokenB = new MockERC20("Token B", "TKB");
        permit2 = new MockPermit2();
        router = new MockRouter(address(tokenB));

        swapper = new UniswapPermit2Swap(IPermit2(address(permit2)), IUniswapV2Router(address(router)));

        // Give user some TokenA
        tokenA.mint(user, 1000 ether);

        // Approve Permit2 to spend user's TokenA
        vm.prank(user);
        tokenA.approve(address(permit2), type(uint256).max);
    }

    function testPermitAndSwap() public {
        uint256 amountIn = 100 ether;
        uint256 amountOutMin = 50 ether;
        uint256 deadline = block.timestamp + 1 hours;

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

        bytes memory signature = hex"00"; // Dummy signature

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

        assertEq(tokenB.balanceOf(user), amountOutMin, "User should receive TokenB");
    }
}
