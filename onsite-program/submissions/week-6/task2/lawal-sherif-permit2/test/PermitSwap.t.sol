// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/PermitSwapEIP712.sol";
import "../src/mocks/ERC20Mock.sol";
import "../src/interfaces/IUniswapV2Router02.sol";
import "../src/interfaces/IPermit2.sol";

// Mock Uniswap V2 Router for testing
contract MockUniswapV2Router is IUniswapV2Router02 {
    mapping(address => uint256) public tokenPrices;
    
    constructor() {
        // Set some default exchange rates for testing
        // 1 TokenA = 2 TokenB, 1 TokenB = 0.5 TokenA
    }
    
    function setTokenPrice(address token, uint256 price) external {
        tokenPrices[token] = price;
    }
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "INVALID_PATH");
        
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // Simple mock: output 90% of input (simulate slippage/fees)
        uint256 amountOut = (amountIn * 90) / 100;
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Mock mint the output token
        ERC20Mock(path[path.length - 1]).mint(to, amountOut);
        
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
        
        return amounts;
    }
    
    // Minimal implementation for other required functions
    function factory() external pure override returns (address) { return address(0); }
    function WETH() external pure override returns (address) { return address(0); }
    
    function addLiquidity(address, address, uint, uint, uint, uint, address, uint) 
        external pure override returns (uint, uint, uint) { return (0, 0, 0); }
    function addLiquidityETH(address, uint, uint, uint, address, uint) 
        external payable override returns (uint, uint, uint) { return (0, 0, 0); }
    function removeLiquidity(address, address, uint, uint, uint, address, uint) 
        external pure override returns (uint, uint) { return (0, 0); }
    function removeLiquidityETH(address, uint, uint, uint, address, uint) 
        external pure override returns (uint, uint) { return (0, 0); }
    
    function swapTokensForExactTokens(uint, uint, address[] calldata, address, uint) 
        external pure override returns (uint[] memory) { return new uint[](0); }
    function swapExactETHForTokens(uint, address[] calldata, address, uint) 
        external payable override returns (uint[] memory) { return new uint[](0); }
    function swapTokensForExactETH(uint, uint, address[] calldata, address, uint) 
        external pure override returns (uint[] memory) { return new uint[](0); }
    function swapExactTokensForETH(uint, uint, address[] calldata, address, uint) 
        external pure override returns (uint[] memory) { return new uint[](0); }
    function swapETHForExactTokens(uint, address[] calldata, address, uint) 
        external payable override returns (uint[] memory) { return new uint[](0); }
    
    function quote(uint, uint, uint) external pure override returns (uint) { return 0; }
    function getAmountOut(uint, uint, uint) external pure override returns (uint) { return 0; }
    function getAmountIn(uint, uint, uint) external pure override returns (uint) { return 0; }
    function getAmountsOut(uint, address[] calldata) external pure override returns (uint[] memory) { 
        return new uint[](0); 
    }
    function getAmountsIn(uint, address[] calldata) external pure override returns (uint[] memory) { 
        return new uint[](0); 
    }
}

// Mock Permit2 contract for testing
contract MockPermit2 is IPermit2 {
    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external override {
        // Simple mock: just transfer the tokens
        IERC20(permit.permitted.token).transferFrom(owner, transferDetails.to, transferDetails.requestedAmount);
    }
    
    function permitTransferFrom(
        PermitBatchTransferFrom calldata,
        SignatureTransferDetails[] calldata,
        address,
        bytes calldata
    ) external pure override {
        revert("Batch not implemented in mock");
    }
    
    function DOMAIN_SEPARATOR() external pure override returns (bytes32) {
        return keccak256("MockPermit2");
    }
}

contract PermitSwapEIP712Test is Test {
    PermitSwapEIP712 public permitSwap;
    MockUniswapV2Router public mockRouter;
    MockPermit2 public mockPermit2;
    
    ERC20Mock public tokenA;
    ERC20Mock public tokenB;
    
    address public owner;
    address public relayer;
    address public recipient;
    uint256 public ownerPrivateKey;
    uint256 public relayerPrivateKey;
    
    // Test parameters
    uint256 constant INITIAL_BALANCE = 10000e18;
    uint256 constant SWAP_AMOUNT = 1000e18;
    uint256 constant MIN_OUTPUT = 900e18;
    uint256 constant DEADLINE = type(uint256).max;
    
    function setUp() public {
        // Setup test accounts
        ownerPrivateKey = 0x1234;
        relayerPrivateKey = 0x5678;
        owner = vm.addr(ownerPrivateKey);
        relayer = vm.addr(relayerPrivateKey);
        recipient = makeAddr("recipient");
        
        // Deploy mock contracts
        mockRouter = new MockUniswapV2Router();
        mockPermit2 = new MockPermit2();
        
        // Deploy main contract
        permitSwap = new PermitSwapEIP712(address(mockRouter), address(mockPermit2));
        
        // Deploy test tokens
        tokenA = new ERC20Mock("Token A", "TKNA", 18, 0);
        tokenB = new ERC20Mock("Token B", "TKNB", 18, 0);
        
        // Mint initial tokens
        tokenA.mint(owner, INITIAL_BALANCE);
        tokenB.mint(address(mockRouter), INITIAL_BALANCE); // Router needs tokens to "swap"
        
        // Setup labels for better trace output
        vm.label(owner, "Owner");
        vm.label(relayer, "Relayer");
        vm.label(recipient, "Recipient");
        vm.label(address(permitSwap), "PermitSwap");
        vm.label(address(tokenA), "TokenA");
        vm.label(address(tokenB), "TokenB");
    }
    
    function testDeployment() public view {
        assertEq(address(permitSwap.router()), address(mockRouter));
        assertEq(address(permitSwap.permit2()), address(mockPermit2));
        assertEq(permitSwap.nonces(owner), 0);
    }
    
    function testGetSwapRequestHash() public view {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        bytes32 hash = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            0
        );
        
        assertTrue(hash != bytes32(0), "Hash should not be zero");
    }
    
    function testExecuteSignedSwap_Success() public {
        // Arrange
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        
        // Owner approves the permit contract
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        // Create signature
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Record initial balances
        uint256 ownerInitialBalance = tokenA.balanceOf(owner);
        uint256 recipientInitialBalance = tokenB.balanceOf(recipient);
        
        // Act - Relayer executes the signed swap
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce,
            signature
        );
        
        // Assert
        assertEq(tokenA.balanceOf(owner), ownerInitialBalance - SWAP_AMOUNT, "Owner should have less tokenA");
        assertEq(tokenB.balanceOf(recipient), recipientInitialBalance + MIN_OUTPUT, "Recipient should have tokenB");
        assertEq(permitSwap.nonces(owner), nonce + 1, "Nonce should be incremented");
    }
    
    function testExecuteSignedSwap_InvalidSignature() public {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        
        // Owner approves the permit contract
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        // Create signature with wrong parameters (wrong amount)
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT + 1, // Wrong amount
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Should revert with invalid signature
        vm.expectRevert("Invalid signature");
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT, // Correct amount in call
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce,
            signature
        );
    }
    
    function testExecuteSignedSwap_InvalidNonce() public {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        
        // Owner approves the permit contract
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        // Create signature with wrong nonce
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce + 1 // Wrong nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Should revert with invalid nonce
        vm.expectRevert("Invalid nonce");
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce + 1, // Wrong nonce in call
            signature
        );
    }
    
    function testExecuteSignedSwap_ExpiredDeadline() public {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        uint256 expiredDeadline = block.timestamp - 1;
        
        // Owner approves the permit contract
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            expiredDeadline,
            nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Should revert with deadline exceeded
        vm.expectRevert("Deadline exceeded");
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            expiredDeadline,
            nonce,
            signature
        );
    }
    
    function testExecuteSignedSwapWithPermit2_Success() public {
        // Arrange
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        
        // Owner approves Permit2 contract (simulating gasless approval)
        vm.prank(owner);
        tokenA.approve(address(mockPermit2), SWAP_AMOUNT);
        
        // Create EIP-712 signature for swap authorization
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Create Permit2 permit data
        IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
            permitted: IPermit2.TokenPermissions({
                token: address(tokenA),
                amount: SWAP_AMOUNT
            }),
            nonce: nonce,
            deadline: DEADLINE
        });
        
        bytes memory permitSignature = "mock_permit_signature";
        
        // Record initial balances
        uint256 ownerInitialBalance = tokenA.balanceOf(owner);
        uint256 recipientInitialBalance = tokenB.balanceOf(recipient);
        
        // Act - Relayer executes the signed swap with Permit2
        vm.prank(relayer);
        permitSwap.executeSignedSwapWithPermit2(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce,
            signature,
            permit,
            permitSignature
        );
        
        // Assert
        assertEq(tokenA.balanceOf(owner), ownerInitialBalance - SWAP_AMOUNT, "Owner should have less tokenA");
        assertEq(tokenB.balanceOf(recipient), recipientInitialBalance + MIN_OUTPUT, "Recipient should have tokenB");
        assertEq(permitSwap.nonces(owner), nonce + 1, "Nonce should be incremented");
    }
    
    function testReplayProtection() public {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        
        // Owner approves the permit contract for 2x swap amount
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT * 2);
        
        // Create signature
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // First execution should succeed
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce,
            signature
        );
        
        // Second execution with same signature should fail
        vm.expectRevert("Invalid nonce");
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce, // Same nonce
            signature
        );
    }
    
    function testNonceProgression() public {
        assertEq(permitSwap.nonces(owner), 0, "Initial nonce should be 0");
        
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        // Execute multiple swaps and verify nonce progression
        for (uint256 i = 0; i < 3; i++) {
            uint256 currentNonce = permitSwap.nonces(owner);
            assertEq(currentNonce, i, "Nonce should progress linearly");
            
            // Setup for swap
            vm.prank(owner);
            tokenA.approve(address(permitSwap), SWAP_AMOUNT);
            
            bytes32 digest = permitSwap.getSwapRequestHash(
                owner,
                address(tokenA),
                SWAP_AMOUNT,
                MIN_OUTPUT,
                path,
                recipient,
                DEADLINE,
                currentNonce
            );
            
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
            bytes memory signature = abi.encodePacked(r, s, v);
            
            // Execute swap
            vm.prank(relayer);
            permitSwap.executeSignedSwap(
                owner,
                address(tokenA),
                SWAP_AMOUNT,
                MIN_OUTPUT,
                path,
                recipient,
                DEADLINE,
                currentNonce,
                signature
            );
            
            assertEq(permitSwap.nonces(owner), i + 1, "Nonce should be incremented");
        }
    }
    
    function testEventEmission() public {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256 nonce = permitSwap.nonces(owner);
        
        // Owner approves the permit contract
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        bytes32 digest = permitSwap.getSwapRequestHash(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Expect event emission - use the event signature directly
        vm.expectEmit(true, true, true, true, address(permitSwap));
        emit SwapExecuted(owner, address(tokenA), SWAP_AMOUNT, MIN_OUTPUT, recipient, nonce);
        
        vm.prank(relayer);
        permitSwap.executeSignedSwap(
            owner,
            address(tokenA),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            path,
            recipient,
            DEADLINE,
            nonce,
            signature
        );
    }
    
    // Define the event locally for testing
    event SwapExecuted(
        address indexed owner,
        address indexed token,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 nonce
    );
    
    // Utility function to help with debugging
    function logBalances(string memory label) internal view {
        console.log("=== %s ===", label);
        console.log("Owner TokenA balance:", tokenA.balanceOf(owner));
        console.log("Recipient TokenB balance:", tokenB.balanceOf(recipient));
        console.log("Contract TokenA balance:", tokenA.balanceOf(address(permitSwap)));
        console.log("Router TokenA balance:", tokenA.balanceOf(address(mockRouter)));
    }
}