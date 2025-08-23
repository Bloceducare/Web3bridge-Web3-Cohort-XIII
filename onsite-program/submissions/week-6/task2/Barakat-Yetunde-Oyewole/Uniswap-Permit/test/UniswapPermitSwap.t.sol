// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/UniswapPermit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockERC20Permit is ERC20Permit {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockUniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Mock implementation - transfers tokens
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // Calculate mock output (90% of input for simplicity)
        uint256 amountOut = (amountIn * 90) / 100;
        MockERC20Permit(path[1]).mint(to, amountOut);
        
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }
    
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * 90) / 100; // Mock 90% return
    }
    
    function WETH() external pure returns (address) {
        return address(0x1234); // Mock WETH address
    }
}

contract UniswapPermitSwapTest is Test {
    UniswapPermit public permitSwap;
    MockERC20Permit public tokenA;
    MockERC20Permit public tokenB;
    MockUniswapRouter public mockRouter;
    
    address public user = address(0x123);
    uint256 public userPrivateKey = 0x456;
    
    function setUp() public {
        // Deploy mock contracts
        mockRouter = new MockUniswapRouter();
        permitSwap = new UniswapPermit(address(mockRouter));
        
        // Deploy mock tokens
        tokenA = new MockERC20Permit("Token A", "TKNA", 1000000 * 1e18);
        tokenB = new MockERC20Permit("Token B", "TKNB", 1000000 * 1e18);
        
        // Setup user
        vm.deal(user, 1 ether);
        tokenA.mint(user, 10000 * 1e18);
    }
    
    function testPermitAndSwap() public {
        uint256 amountIn = 1000 * 1e18;
        uint256 amountOutMin = 800 * 1e18;
        uint256 deadline = block.timestamp + 3600;
        
        // Create permit signature
        bytes32 domainSeparator = tokenA.DOMAIN_SEPARATOR();
        uint256 nonce = tokenA.nonces(user);
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user,
                address(permitSwap),
                amountIn,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
        
        // Execute permit and swap
        vm.prank(user);
        permitSwap.permitAndSwap(
            address(tokenA),
            address(tokenB),
            amountIn,
            amountOutMin,
            deadline,
            v,
            r,
            s
        );
        
        // Verify results
        assertEq(tokenA.balanceOf(user), 9000 * 1e18); // 10000 - 1000
        assertGt(tokenB.balanceOf(user), amountOutMin); // Should have received tokens
    }
    
    function testGetAmountOut() public view {
        uint256 amountIn = 1000 * 1e18;
        uint256 amountOut = permitSwap.getAmountOut(
            address(tokenA),
            address(tokenB),
            amountIn
        );
        
        assertEq(amountOut, 900 * 1e18); // Mock returns 90%
    }
    
    function testSupportsPermit() public view {
        bool support = permitSwap.supportsPermit(address(tokenA));
        assertTrue(support);
    }
}