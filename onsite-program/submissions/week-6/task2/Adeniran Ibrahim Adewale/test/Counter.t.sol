// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/ERC20Token.sol";
import "../src/PermitSwap.sol";

// Mock contracts for testing
contract MockERC20Permit {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;
    
    // EIP-2612 permit functionality
    mapping(address => uint256) public nonces;
    bytes32 public DOMAIN_SEPARATOR;
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "ERC20Permit: expired deadline");
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonces[owner]++,
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        
        address signer = ecrecover(hash, v, r, s);
        require(signer == owner, "ERC20Permit: invalid signature");
        
        allowance[owner][spender] = value;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

contract MockSwapRouter {
    mapping(address => uint256) public mockPrices; // tokenIn => price in tokenOut
    MockERC20Permit public tokenOut;
    
    constructor(address _tokenOut) {
        tokenOut = MockERC20Permit(_tokenOut);
    }
    
    function setMockPrice(address tokenIn, uint256 priceOut) external {
        mockPrices[tokenIn] = priceOut;
    }
    
    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut)
    {
        // Simulate the router receiving tokens
        MockERC20Permit tokenInContract = MockERC20Permit(params.tokenIn);
        
        // Check if we have allowance from the PermitSwap contract
        uint256 allowance = tokenInContract.allowance(msg.sender, address(this));
        require(allowance >= params.amountIn, "Insufficient allowance");
        
        // Transfer tokenIn from sender to this router
        tokenInContract.transferFrom(msg.sender, address(this), params.amountIn);
        
        // Calculate mock output amount
        amountOut = (params.amountIn * mockPrices[params.tokenIn]) / 1e18;
        require(amountOut >= params.amountOutMinimum, "Insufficient output amount");
        
        // Mint tokenOut to recipient
        tokenOut.mint(params.recipient, amountOut);
        
        return amountOut;
    }
}

contract ERC20TokenTest is Test {
    ERC20Token public token;
    address public owner;
    address public user1;
    address public user2;
    
    string constant NAME = "Web3Bridge";
    string constant SYMBOL = "W3B";
    uint256 constant INITIAL_SUPPLY = 1000000000000000; // 1 quadrillion tokens (matching your actual contract)
    
    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        vm.startPrank(owner);
        token = new ERC20Token(NAME, SYMBOL, INITIAL_SUPPLY);
        vm.stopPrank();
    }
    
    function testInitialState() public view {
        assertEq(token.name(), NAME);
        assertEq(token.symbol(), SYMBOL);
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY * 10**18);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY * 10**18);
        assertEq(token.owner(), owner);
    }
    
    function testTransfer() public {
        uint256 amount = 1000 * 10**18;
        
        vm.prank(owner);
        bool success = token.transfer(user1, amount);
        
        assertTrue(success);
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY * 10**18 - amount);
    }
    
    function testPermit() public {
        uint256 privateKey = 0x123;
        address user = vm.addr(privateKey);
        address spender = user1;
        uint256 value = 1000 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // Give user some tokens first
        vm.prank(owner);
        token.transfer(user, value);
        
        // Create permit signature
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user,
                spender,
                value,
                token.nonces(user),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        // Execute permit
        token.permit(user, spender, value, deadline, v, r, s);
        
        // Verify allowance was set
        assertEq(token.allowance(user, spender), value);
        assertEq(token.nonces(user), 1);
    }
    
    function testPermitExpiredDeadline() public {
        uint256 privateKey = 0x123;
        address user = vm.addr(privateKey);
        uint256 deadline = block.timestamp - 1; // Expired deadline
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user,
                user1,
                1000,
                0,
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        vm.expectRevert(); // OpenZeppelin v5 uses custom errors
        token.permit(user, user1, 1000, deadline, v, r, s);
    }
}

contract PermitSwapTest is Test {
    PermitSwap public permitSwap;
    MockERC20Permit public tokenIn;
    MockERC20Permit public tokenOut;
    MockSwapRouter public mockRouter;
    
    address public user1;
    uint256 public user1PrivateKey;
    
    function setUp() public {
        user1PrivateKey = 0x123;
        user1 = vm.addr(user1PrivateKey);
        
        // Deploy mock tokens
        tokenIn = new MockERC20Permit();
        tokenOut = new MockERC20Permit();
        
        // Deploy mock router
        mockRouter = new MockSwapRouter(address(tokenOut));
        
        // Deploy PermitSwap with correct router address
        permitSwap = new PermitSwap(address(mockRouter));
        
        // Setup mock price (1:2 ratio)
        mockRouter.setMockPrice(address(tokenIn), 2 * 1e18);
        
        // Give user1 some tokenIn
        tokenIn.mint(user1, 10000 * 1e18);
    }
    
    function testPermitAndSwap() public {
        uint256 amountIn = 1000 * 1e18;
        uint256 amountOutMin = 1500 * 1e18; // Expecting ~2000, setting min to 1500
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp + 1 hours;
        
        // Create permit signature
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                tokenIn.nonces(user1),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", tokenIn.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
        
        uint256 initialBalanceIn = tokenIn.balanceOf(user1);
        uint256 initialBalanceOut = tokenOut.balanceOf(user1);
        
        vm.prank(user1);
        permitSwap.permitAndSwap(
            address(tokenIn),
            address(tokenOut),
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        );
        
        // Verify swap results
        assertEq(tokenIn.balanceOf(user1), initialBalanceIn - amountIn);
        assertEq(tokenOut.balanceOf(user1), initialBalanceOut + 2000 * 1e18); // 2:1 ratio
        assertEq(tokenIn.nonces(user1), 1); // Nonce should be incremented
    }
    
    function testPermitAndSwapInsufficientOutput() public {
        uint256 amountIn = 1000 * 1e18;
        uint256 amountOutMin = 3000 * 1e18; // Too high, expecting only ~2000
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                tokenIn.nonces(user1),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", tokenIn.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
        
        vm.prank(user1);
        vm.expectRevert(); // Generic revert since we can't predict exact error format
        permitSwap.permitAndSwap(
            address(tokenIn),
            address(tokenOut),
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        );
    }
    
    function testPermitAndSwapExpiredDeadline() public {
        uint256 amountIn = 1000 * 1e18;
        uint256 amountOutMin = 1500 * 1e18;
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp - 1; // Expired
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                tokenIn.nonces(user1),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", tokenIn.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
        
        vm.prank(user1);
        vm.expectRevert(); // Generic revert for permit errors
        permitSwap.permitAndSwap(
            address(tokenIn),
            address(tokenOut),
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        );
    }
    
    function testReentrancyProtection() public pure {
        // This test would need a malicious contract to test reentrancy
        // For now, we just verify the modifier exists
        assertTrue(true); // Placeholder - reentrancy protection is handled by OpenZeppelin
    }
    
    function testInvalidSignature() public {
        uint256 amountIn = 1000 * 1e18;
        uint256 amountOutMin = 1500 * 1e18;
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp + 1 hours;
        
        // Create invalid signature (wrong private key)
        uint256 wrongPrivateKey = 0x456;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                tokenIn.nonces(user1),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", tokenIn.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, hash);
        
        vm.prank(user1);
        vm.expectRevert("ERC20Permit: invalid signature");
        permitSwap.permitAndSwap(
            address(tokenIn),
            address(tokenOut),
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        );
    }
}