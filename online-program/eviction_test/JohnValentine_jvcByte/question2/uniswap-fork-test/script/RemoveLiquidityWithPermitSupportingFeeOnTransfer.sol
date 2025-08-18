// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/interfaces/IUniswapV2Router02.sol";
import "../src/interfaces/IUniswapV2Factory.sol";
import "../src/interfaces/IUniswapV2Pair.sol";

contract RemoveLiquidityWithPermitSupportingFeeOnTransfer is Script {
    // Mainnet addresses
    address constant ROUTER  = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant WETH    = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI     = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    // DAI whale address (for testing)
    address constant DAI_WHALE = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;
    
    // Helper function to get pair address
    function getPairAddress(address tokenA, address tokenB) internal view returns (address) {
        IUniswapV2Factory factory = IUniswapV2Factory(FACTORY);
        return factory.getPair(tokenA, tokenB);
    }
    
    // Helper function to format token amounts with decimals (simplified version)
    function formatTokenAmount(uint256 amount, uint8 decimals) internal pure returns (string memory) {
        if (amount == 0) {
            return "0";
        }
        
        string memory amountStr = Strings.toString(amount);
        uint256 len = bytes(amountStr).length;
        
        if (len <= decimals) {
            // Pad with leading zeros if needed
            string memory padding = "";
            for (uint256 i = 0; i < (decimals - len + 1); i++) {
                padding = string(abi.encodePacked(padding, "0"));
            }
            
            return string(abi.encodePacked("0.", padding, amountStr));
        } else {
            // For numbers larger than the decimal places, just return the string
            // This is a simplified version that doesn't handle decimal formatting
            return amountStr;
        }
    }
    
    // Example: Remove liquidity with permit supporting fee on transfer tokens (ETH version)
    function run() external {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        IERC20 weth = IERC20(WETH);
        
        console.log("\n");
        console.log("***********************************************************************************************************************************************");
        console.log("*** Function 10: Removing Liquidity with Permit Supporting Fee on Transfer Tokens (removeLiquidityETHWithPermitSupportingFeeOnTransferTokens) ***");
        console.log("***********************************************************************************************************************************************");
        
        console.log("\n");
        
        // Get the pair address and LP token for DAI-WETH
        address pair = getPairAddress(DAI, WETH);
        IUniswapV2Pair lpToken = IUniswapV2Pair(pair);
        
        // Get initial LP token balance of DAI_WHALE
        uint256 initialLPTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        // Calculate amount to remove (50% of LP tokens, but no more than 1 LP token for this example)
        uint256 lpAmountToRemove = (initialLPTokenBalance / 2) > 1e18 ? 1e18 : (initialLPTokenBalance / 2);
        
        if (lpAmountToRemove == 0) {
            console.log("No LP tokens to remove. Skipping removeLiquidityETHWithPermitSupportingFeeOnTransferTokens example.");
            return;
        }
        
        // Get reserves to calculate expected amounts
        (uint reserveA, uint reserveB,) = lpToken.getReserves();
        
        // Calculate expected amounts based on LP share
        uint256 totalSupply = lpToken.totalSupply();
        uint256 expectedDaiAmount = (reserveA * lpAmountToRemove) / totalSupply;
        uint256 expectedEthAmount = (reserveB * lpAmountToRemove) / totalSupply;
        
        // Get initial balances
        uint256 initialDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 initialEthBalance = DAI_WHALE.balance;
        
        console.log(string(abi.encodePacked("Initial DAI Balance: ", formatTokenAmount(initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Initial ETH Balance: ", formatTokenAmount(initialEthBalance, 18), " ETH")));
        console.log(string(abi.encodePacked("LP Tokens to Remove: ", formatTokenAmount(lpAmountToRemove, 18))));
        console.log(string(abi.encodePacked("Expected DAI to Receive: ~", formatTokenAmount(expectedDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("Expected ETH to Receive: ~", formatTokenAmount(expectedEthAmount, 18), " ETH")));
        
        // Check if PRIVATE_KEY is available for permit signature
        uint256 privateKey = 0;
        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            privateKey = pk;
        } catch {
            console.log("PRIVATE_KEY not set in .env file. Falling back to standard removeLiquidityETH.");
            
            // Fall back to standard removeLiquidityETH
            vm.startPrank(DAI_WHALE);
            lpToken.approve(address(router), lpAmountToRemove);
            
            (uint amountToken, uint amountETH) = router.removeLiquidityETH(
                DAI,
                lpAmountToRemove,
                (expectedDaiAmount * 95) / 100,  // 5% slippage
                (expectedEthAmount * 95) / 100,  // 5% slippage
                DAI_WHALE,
                block.timestamp + 300
            );
            
            // Stop the prank session
            vm.stopPrank();
            
            // Get final balances
            uint256 finalDaiBal = dai.balanceOf(DAI_WHALE);
            uint256 finalEthBal = DAI_WHALE.balance;
            uint256 finalLpTokenBal = lpToken.balanceOf(DAI_WHALE);
            
            console.log("\n=== Liquidity Removed (Standard) ===");
            console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(amountToken, 18), " DAI")));
            console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(amountETH, 18), " ETH")));
            
            console.log("\n=== Final Balances ===");
            console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(finalDaiBal, 18), " DAI")));
            console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(finalEthBal, 18), " ETH")));
            console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(finalLpTokenBal, 18))));
            
            return;
        }
        
        // If we have a private key, proceed with permit signature
        
        // Get the nonce for the permit
        uint256 nonce = lpToken.nonces(DAI_WHALE);
        
        // Set up permit parameters
        uint256 deadline = block.timestamp + 300;
        bytes32 domainSeparator = lpToken.DOMAIN_SEPARATOR();
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        
        // Create the permit hash
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                DAI_WHALE,
                address(router),
                lpAmountToRemove,
                nonce,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                structHash
            )
        );
        
        // Sign the digest
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        
        // Start a prank session for DAI_WHALE
        vm.startPrank(DAI_WHALE);
        
        // Remove liquidity with permit (no need for approve)
        uint256 amountETH = router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            DAI,                     // token
            lpAmountToRemove,        // liquidity
            (expectedDaiAmount * 95) / 100,  // amountTokenMin (5% slippage)
            (expectedEthAmount * 95) / 100,  // amountETHMin (5% slippage)
            DAI_WHALE,               // to (send tokens to DAI_WHALE)
            deadline,                // deadline
            true,                    // approveMax (unused in this context)
            v, r, s                  // signature
        );
        
        // Stop the prank session
        vm.stopPrank();
        
        // Get final balances
        uint256 finalDaiBal = dai.balanceOf(DAI_WHALE);
        uint256 finalEthBal = DAI_WHALE.balance;
        uint256 finalLpTokenBal = lpToken.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Removed (with Permit, Supporting Fee on Transfer) ===");
        console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(finalDaiBal - initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(amountETH, 18), " ETH")));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(finalDaiBal, 18), " DAI")));
        console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(finalEthBal, 18), " ETH")));
        console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(finalLpTokenBal, 18))));
    }
}
