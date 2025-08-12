// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/PermitSwapExecutor.sol";
//import "../src/interfaces/IERC20Permit.sol";
import "../src/interfaces/IERC20PermitAllowed.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EIP712UniswapPermitSwapTest is Test {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI  = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    address constant SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    address constant USDC_WHALE = 0x28C6c06298d514Db089934071355E5743bf21d60;
    address constant DAI_WHALE  = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;

    IERC20Permit usdc;
    IERC20PermitAllowed daiAllowed;
    IERC20 wethERC;
    ISwapRouter swapRouter;
    PermitSwapExecutor permitHelper;

    address testUser;
    uint256 testUserPrivateKey;

    uint256 constant USDC_AMOUNT = 1000 * 1e6;
    uint256 constant DAI_AMOUNT  = 1000 * 1e18;

    function setUp() public {
        string memory rpcUrl = vm.envOr("MAINNET_RPC_URL", string("https://eth-mainnet.alchemyapi.io/v2/demo"));
        vm.createFork(rpcUrl);

        usdc = IERC20Permit(USDC);
        daiAllowed = IERC20PermitAllowed(DAI);
        wethERC = IERC20(WETH);
        swapRouter = ISwapRouter(SWAP_ROUTER);

        permitHelper = new PermitSwapExecutor(SWAP_ROUTER);

        testUserPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        testUser = vm.addr(testUserPrivateKey);

        _fundTestUser();

        console.log("=== Setup Complete ===");
        console.log("Test User:", testUser);
        console.log("USDC Balance:", IERC20(USDC).balanceOf(testUser));
        console.log("DAI Balance:", IERC20(DAI).balanceOf(testUser));
        console.log("PermitHelper:", address(permitHelper));
    }

    function _fundTestUser() internal {
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).transfer(testUser, USDC_AMOUNT);
        vm.stopPrank();

        vm.startPrank(DAI_WHALE);
        IERC20(DAI).transfer(testUser, DAI_AMOUNT);
        vm.stopPrank();
    }

    function testPermitSignatureValidation() public {
        uint256 amountIn = 100 * 1e6;
        uint256 deadline = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _createPermitSignature(
            USDC,
            testUser,
            SWAP_ROUTER,
            amountIn,
            deadline,
            testUserPrivateKey
        );

        uint256 initialAllowance = IERC20(USDC).allowance(testUser, SWAP_ROUTER);

        vm.startPrank(testUser);
        usdc.permit(testUser, SWAP_ROUTER, amountIn, deadline, v, r, s);
        vm.stopPrank();

        uint256 finalAllowance = IERC20(USDC).allowance(testUser, SWAP_ROUTER);

        console.log("Initial allowance:", initialAllowance);
        console.log("Final allowance:", finalAllowance);

        assertEq(finalAllowance, amountIn, "Permit should set correct allowance");
    }

    function testBasicPermitAndSwap() public {
        uint256 amountIn = 100 * 1e6;
        uint256 deadline = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _createPermitSignature(
            USDC,
            testUser,
            SWAP_ROUTER,
            amountIn,
            deadline,
            testUserPrivateKey
        );

        uint256 initialUSDC = IERC20(USDC).balanceOf(testUser);
        uint256 initialWETH = wethERC.balanceOf(testUser);

        vm.startPrank(testUser);
        usdc.permit(testUser, SWAP_ROUTER, amountIn, deadline, v, r, s);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC,
            tokenOut: WETH,
            fee: 3000,
            recipient: testUser,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);
        vm.stopPrank();

        uint256 finalUSDC = IERC20(USDC).balanceOf(testUser);
        uint256 finalWETH = wethERC.balanceOf(testUser);

        console.log("USDC spent:", initialUSDC - finalUSDC);
        console.log("WETH received:", finalWETH - initialWETH);

        assertEq(finalUSDC, initialUSDC - amountIn, "USDC balance incorrect");
        assertGt(finalWETH, initialWETH, "Should receive WETH");
        assertEq(amountOut, finalWETH - initialWETH, "AmountOut should match balance change");
    }

    function testDAIPermitSwap() public {
        uint256 amountIn = 100 * 1e18;
        uint256 deadline = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _createPermitSignature(
            DAI,
            testUser,
            SWAP_ROUTER,
            amountIn,
            deadline,
            testUserPrivateKey
        );

        uint256 initialDAI = IERC20(DAI).balanceOf(testUser);
        uint256 initialWETH = wethERC.balanceOf(testUser);

        vm.startPrank(testUser);
        IERC20PermitAllowed(DAI).permit(
            testUser,
            SWAP_ROUTER,
            IERC20(DAI).balanceOf(testUser) > 0 ? IERC20Permit(DAI).nonces(testUser) : 0,
            deadline,
            true,
            v, r, s
        );

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: DAI,
            tokenOut: WETH,
            fee: 3000,
            recipient: testUser,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);
        vm.stopPrank();

        uint256 finalDAI = IERC20(DAI).balanceOf(testUser);
        uint256 finalWETH = wethERC.balanceOf(testUser);

        console.log("DAI spent:", initialDAI - finalDAI);
        console.log("WETH received:", finalWETH - initialWETH);

        assertEq(finalDAI, initialDAI - amountIn, "DAI balance incorrect");
        assertEq(finalWETH, initialWETH + amountOut, "WETH balance incorrect");
    }

    function _createPermitSignature(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint256 privateKey
    ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bool ok;
        bytes memory res;

        (ok, res) = token.staticcall(abi.encodeWithSignature("DOMAIN_SEPARATOR()"));
        bytes32 domainSeparator;
        if (ok && res.length == 32) {
            domainSeparator = abi.decode(res, (bytes32));
        } else {
            string memory name = "Unknown";
            (ok, res) = token.staticcall(abi.encodeWithSignature("name()"));
            if (ok && res.length > 0) {
                name = abi.decode(res, (string));
            }
            uint256 chainIdLocal = block.chainid;
            domainSeparator = keccak256(
                abi.encode(
                    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                    keccak256(bytes(name)),
                    keccak256(bytes("1")),
                    chainIdLocal,
                    token
                )
            );
        }

        (ok, res) = token.staticcall(abi.encodeWithSignature("nonces(address)", owner));
        uint256 nonce;
        if (ok && res.length >= 32) {
            nonce = abi.decode(res, (uint256));
        } else {
            nonce = 0;
        }

        if (token == DAI) {
            bool allowed = true;
            bytes32 structHash = keccak256(
                abi.encode(
                    keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)"),
                    owner,
                    spender,
                    nonce,
                    deadline,
                    allowed
                )
            );
            bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
            (v, r, s) = vm.sign(privateKey, digest);
            return (v, r, s);
        } else {
            bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
            bytes32 structHash = keccak256(
                abi.encode(
                    PERMIT_TYPEHASH,
                    owner,
                    spender,
                    value,
                    nonce,
                    deadline
                )
            );
            bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
            (v, r, s) = vm.sign(privateKey, digest);
            return (v, r, s);
        }
    }
}
