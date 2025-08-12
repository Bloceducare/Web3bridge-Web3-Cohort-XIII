// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/PermitSwapEIP712.sol";
import "../src/mocks/ERC20Mock.sol";

// Base contract with shared constants and utilities
contract DeployBase is Script {
    // Known router addresses for different networks
    address constant UNISWAP_V2_ROUTER_MAINNET = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant UNISWAP_V2_ROUTER_SEPOLIA = 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008;
    address constant UNISWAP_V2_ROUTER_GOERLI = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    // Permit2 addresses
    address constant PERMIT2_MAINNET = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant PERMIT2_SEPOLIA = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant PERMIT2_GOERLI = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function getRouterAddress(uint256 chainId) internal pure returns (address) {
        if (chainId == 1) { // Mainnet
            return UNISWAP_V2_ROUTER_MAINNET;
        } else if (chainId == 5) { // Goerli
            return UNISWAP_V2_ROUTER_GOERLI;
        } else if (chainId == 11155111) { // Sepolia
            return UNISWAP_V2_ROUTER_SEPOLIA;
        } else if (chainId == 31337) { // Anvil/Local
            // For local testing, use a placeholder address
            return address(0x1234567890123456789012345678901234567890);
        } else {
            revert("Unsupported chain ID for router");
        }
    }
    
    function getPermit2Address(uint256 chainId) internal pure returns (address) {
        if (chainId == 1) { // Mainnet
            return PERMIT2_MAINNET;
        } else if (chainId == 5) { // Goerli
            return PERMIT2_GOERLI;
        } else if (chainId == 11155111) { // Sepolia
            return PERMIT2_SEPOLIA;
        } else if (chainId == 31337) { // Anvil/Local
            // For local testing, Permit2 might not be deployed
            return address(0);
        } else {
            // For other chains, try the canonical address
            return PERMIT2_MAINNET;
        }
    }

    function deployMockTokens() internal {
        console.log("\n=== Deploying Mock Tokens for Testing ===");

        // Deploy mock USDC (6 decimals)
        ERC20Mock mockUSDC = new ERC20Mock("Mock USDC", "USDC", 6, 1000000 * 10**6);
        console.log("Mock USDC deployed at:", address(mockUSDC));
        
        // Deploy mock WETH (18 decimals)
        ERC20Mock mockWETH = new ERC20Mock("Mock WETH", "WETH", 18, 1000 * 10**18);
        console.log("Mock WETH deployed at:", address(mockWETH));
        
        // Deploy mock DAI (18 decimals)
        ERC20Mock mockDAI = new ERC20Mock("Mock DAI", "DAI", 18, 1000000 * 10**18);
        console.log("Mock DAI deployed at:", address(mockDAI));
        
        // Deploy mock UNI (18 decimals)
        ERC20Mock mockUNI = new ERC20Mock("Mock UNI", "UNI", 18, 100000 * 10**18);
        console.log("Mock UNI deployed at:", address(mockUNI));
    }
    
    function logDeploymentInfo(address permitSwap, address router, address permit2) internal view {
        console.log("\n=== Deployment Summary ===");
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("Deployer:", msg.sender);
        console.log("PermitSwapEIP712:", permitSwap);
        console.log("Uniswap V2 Router:", router);
        console.log("Permit2:", permit2);
        
        console.log("\n=== Integration Info ===");
        console.log("Contract name: PermitSwapEIP712");
        console.log("Contract version: 1");
        console.log("SWAP_REQUEST_TYPEHASH:");
        console.log("SwapRequest(address owner,address token,uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline,uint256 nonce)");
    }
}

// Main deployment script - auto-detects network
contract DeployScript is DeployBase {
    function setUp() public {}

    function run() public {
        // Get chain ID to determine which addresses to use
        uint256 chainId = block.chainid;
        
        // Determine router and permit2 addresses based on chain
        address routerAddress = getRouterAddress(chainId);
        address permit2Address = getPermit2Address(chainId);
        
        console.log("Deploying to chain ID:", chainId);
        console.log("Using router:", routerAddress);
        console.log("Using Permit2:", permit2Address);
        
        // Start broadcasting transactions
        vm.startBroadcast();
        
        // Deploy the main PermitSwapEIP712 contract
        PermitSwapEIP712 permitSwap = new PermitSwapEIP712(routerAddress, permit2Address);
        
        console.log("PermitSwapEIP712 deployed at:", address(permitSwap));
        
        // Deploy mock tokens for testing (only on testnets or local)
        if (chainId == 31337 || chainId == 5 || chainId == 11155111) { // Anvil, Goerli, Sepolia
            deployMockTokens();
        }
        
        vm.stopBroadcast();
        
        // Log deployment info
        logDeploymentInfo(address(permitSwap), routerAddress, permit2Address);
    }
}

// Deployment script for local/anvil environment
contract DeployLocal is DeployBase {
    function run() public {
        console.log("Deploying for local/anvil environment");
        
        vm.startBroadcast();
        
        // For local testing, use placeholder addresses
        address mockRouter = address(0x1234567890123456789012345678901234567890);
        address mockPermit2 = address(0);
        
        PermitSwapEIP712 permitSwap = new PermitSwapEIP712(mockRouter, mockPermit2);
        
        console.log("Local PermitSwapEIP712 deployed at:", address(permitSwap));
        
        // Deploy mock tokens for testing
        deployMockTokens();
        
        vm.stopBroadcast();
        
        logDeploymentInfo(address(permitSwap), mockRouter, mockPermit2);
    }
}

// Deployment script for testnets
contract DeployTestnet is DeployBase {
    function run() public {
        vm.startBroadcast();
        
        uint256 chainId = block.chainid;
        address router = getRouterAddress(chainId);
        address permit2 = getPermit2Address(chainId);
        
        console.log("Deploying to testnet, chain ID:", chainId);
        
        PermitSwapEIP712 permitSwap = new PermitSwapEIP712(router, permit2);
        
        console.log("Testnet PermitSwapEIP712 deployed at:", address(permitSwap));
        
        // Deploy mock tokens for testing
        deployMockTokens();
        
        vm.stopBroadcast();
        
        logDeploymentInfo(address(permitSwap), router, permit2);
    }
}

// Deployment script for mainnet
contract DeployMainnet is DeployBase {
    function run() public {
        require(block.chainid == 1, "This script is only for mainnet");
        
        vm.startBroadcast();
        
        PermitSwapEIP712 permitSwap = new PermitSwapEIP712(
            UNISWAP_V2_ROUTER_MAINNET,
            PERMIT2_MAINNET
        );
        
        console.log("Mainnet PermitSwapEIP712 deployed at:", address(permitSwap));
        
        vm.stopBroadcast();
        
        logDeploymentInfo(address(permitSwap), UNISWAP_V2_ROUTER_MAINNET, PERMIT2_MAINNET);
    }
}