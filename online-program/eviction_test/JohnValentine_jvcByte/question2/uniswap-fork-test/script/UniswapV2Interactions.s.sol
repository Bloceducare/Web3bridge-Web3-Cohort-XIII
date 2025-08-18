// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../src/interfaces/IUniswapV2Factory.sol";
import "../src/interfaces/IUniswapV2Pair.sol";
import "../src/interfaces/IUniswapV2Router02.sol";
import "../src/interfaces/IERC20.sol";
import "../src/interfaces/IWETH.sol";




contract UniswapV2Interactions is Script {

    address constant ROUTER  = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant WETH    = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI     = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    address constant DAI_WHALE = 0x28C6c06298d514Db089934071355E5743bf21d60; // Binance hot wallet

    
    error DAI_APPROVAL_FAILED();
    error WETH_APPROVAL_FAILED();
    
    function padLeft(string memory _str, uint256 _length, bytes1 _padChar) internal pure returns (string memory) {
        bytes memory _bytes = bytes(_str);
        if (_bytes.length >= _length) {
            return _str;
        }
        bytes memory _padded = new bytes(_length);
        uint256 _start = _length - _bytes.length;
        for (uint256 i = 0; i < _length; i++) {
            _padded[i] = i < _start ? _padChar : _bytes[i - _start];
        }
        return string(_padded);
    }

    function formatTokenAmount(uint256 amount, uint8 decimals) public pure returns (string memory) {
        uint256 whole = amount / 10**decimals;
        uint256 fractional = amount % 10**decimals;
        return string(abi.encodePacked(
            Strings.toString(whole),
            ".",
            padLeft(Strings.toString(fractional), decimals, "0")
        ));
    }

    function getPairAddress(address tokenA, address tokenB) public view returns (address) {
        return IUniswapV2Factory(FACTORY).getPair(tokenA, tokenB);
    }

    function addLiquidityFunction() internal {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        
        console.log("\n=== 5. addLiquidity Function ===");
        
        (uint reserveA, uint reserveB,) = IUniswapV2Pair(getPairAddress(DAI, WETH)).getReserves();
        
        uint256 daiAmount = (reserveA * 1) / 1000; 
        uint256 wethAmount = (reserveB * daiAmount) / reserveA; 

        uint256 whaleWETHBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        if (wethAmount > whaleWETHBalance) {
            uint256 reductionFactor = (whaleWETHBalance * 1e18) / wethAmount;
            wethAmount = whaleWETHBalance;
            daiAmount = (daiAmount * reductionFactor) / 1e18;
        }
        
        uint256 initialWETHBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        uint256 initialDAIBalance = dai.balanceOf(DAI_WHALE);
        
        console.log(string(abi.encodePacked("Initial WETH Balance of DAI_WHALE: ", formatTokenAmount(initialWETHBalance, 18), " WETH")));
        console.log(string(abi.encodePacked("Initial DAI Balance of DAI_WHALE: ", formatTokenAmount(initialDAIBalance, 18), " DAI")));
        
        vm.startPrank(DAI_WHALE);
        
        require(dai.approve(address(router), daiAmount), "DAI approval failed");
        
        IWETH(WETH).approve(address(router), wethAmount);
        
        console.log("\n=== Calculated Liquidity Amounts ===");
        console.log(string(abi.encodePacked("DAI Amount: ", formatTokenAmount(daiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Amount: ", formatTokenAmount(wethAmount, 18), " WETH")));
        
        (uint addLiquidityFinalDaiAmount, uint addLiquidityFinalWethAmount, uint addLiquidityFinalLiquidity) = router.addLiquidity(
            DAI,                     
            WETH,                    
            daiAmount,               
            wethAmount,             
            (daiAmount * 95) / 100,  
            (wethAmount * 95) / 100, 
            DAI_WHALE,               
            block.timestamp + 300    
        );
        
        vm.stopPrank();
        
        address pair = getPairAddress(DAI, WETH);
        
        uint256 lpTokenBalance = IERC20(pair).balanceOf(DAI_WHALE);
        
        uint256 finalWETHBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        uint256 finalDAIBalance = dai.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Added ===");
        console.log(string(abi.encodePacked("DAI Added: ", formatTokenAmount(addLiquidityFinalDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Added: ", formatTokenAmount(addLiquidityFinalWethAmount, 18), " WETH")));
        console.log(string(abi.encodePacked("LP Tokens Received: ", formatTokenAmount(addLiquidityFinalLiquidity, 18))));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final WETH Balance of DAI_WHALE: ", formatTokenAmount(finalWETHBalance, 18), " WETH")));
        console.log(string(abi.encodePacked("Final DAI Balance of DAI_WHALE: ", formatTokenAmount(finalDAIBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("LP Token Balance of DAI_WHALE: ", formatTokenAmount(lpTokenBalance, 18))));
    }
    
    function removeLiquidityFunction() internal {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        
        console.log("\n=== 6. removeLiquidity Function ===");
        
        address pair = getPairAddress(DAI, WETH);
        IERC20 lpToken = IERC20(pair);
        
        uint256 initialLPTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        uint256 lpAmountToRemove = initialLPTokenBalance / 2;
        
        if (lpAmountToRemove == 0) {
            console.log("No LP tokens to remove. Skipping removeLiquidity Function.");
            return;
        }
        
        (uint reserveA, uint reserveB,) = IUniswapV2Pair(pair).getReserves();
        
        uint256 totalSupply = IUniswapV2Pair(pair).totalSupply();
        uint256 expectedDaiAmount = (reserveA * lpAmountToRemove) / totalSupply;
        uint256 expectedWethAmount = (reserveB * lpAmountToRemove) / totalSupply;
        
        uint256 initialDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 initialWethBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        
        console.log(string(abi.encodePacked("Initial DAI Balance: ", formatTokenAmount(initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Initial WETH Balance: ", formatTokenAmount(initialWethBalance, 18), " WETH")));
        console.log(string(abi.encodePacked("LP Tokens to Remove: ", formatTokenAmount(lpAmountToRemove, 18))));
        console.log(string(abi.encodePacked("Expected DAI to Receive: ~", formatTokenAmount(expectedDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("Expected WETH to Receive: ~", formatTokenAmount(expectedWethAmount, 18), " WETH")));
        
        vm.startPrank(DAI_WHALE);
        
        lpToken.approve(address(router), lpAmountToRemove);
        
        (uint removeLiquidityFinalDaiAmount, uint removeLiquidityFinalWethAmount) = router.removeLiquidity(
            DAI,                     
            WETH,                    
            lpAmountToRemove,        
            (expectedDaiAmount * 95) / 100,  
            (expectedWethAmount * 95) / 100, 
            DAI_WHALE,               
            block.timestamp + 300    
        );
        
        vm.stopPrank();
        
        uint256 removeLiquidityFinalDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 removeLiquidityFinalWethBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        uint256 removeLiquidityFinalLpTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Removed ===");
        console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(removeLiquidityFinalDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Received: ", formatTokenAmount(removeLiquidityFinalWethAmount, 18), " WETH")));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(removeLiquidityFinalDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Final WETH Balance: ", formatTokenAmount(removeLiquidityFinalWethBalance, 18), " WETH")));
        console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(removeLiquidityFinalLpTokenBalance, 18))));
    }
    
    function removeLiquidityETHFunction() internal {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        
        console.log("\n=== 7. removeLiquidityETH Function ===");
        
        address pair = getPairAddress(DAI, WETH);
        IERC20 lpToken = IERC20(pair);
        
        uint256 initialLPTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        uint256 ethLpAmountToRemove = (initialLPTokenBalance / 2) > 1e18 ? 1e18 : (initialLPTokenBalance / 2);
        
        if (ethLpAmountToRemove == 0) {
            console.log("No LP tokens to remove. Skipping removeLiquidityETH Function.");
            return;
        }
        
        (uint reserveA, uint reserveB,) = IUniswapV2Pair(pair).getReserves();
        
        uint256 totalSupply = IUniswapV2Pair(pair).totalSupply();
        uint256 expectedDaiAmount = (reserveA * ethLpAmountToRemove) / totalSupply;
        uint256 expectedEthAmount = (reserveB * ethLpAmountToRemove) / totalSupply;
        
        uint256 initialDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 initialEthBalance = DAI_WHALE.balance;
        
        console.log(string(abi.encodePacked("Initial DAI Balance: ", formatTokenAmount(initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Initial ETH Balance: ", formatTokenAmount(initialEthBalance, 18), " ETH")));
        console.log(string(abi.encodePacked("LP Tokens to Remove: ", formatTokenAmount(ethLpAmountToRemove, 18))));
        console.log(string(abi.encodePacked("Expected DAI to Receive: ~", formatTokenAmount(expectedDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("Expected ETH to Receive: ~", formatTokenAmount(expectedEthAmount, 18), " ETH")));
        
        vm.startPrank(DAI_WHALE);
        
        lpToken.approve(address(router), ethLpAmountToRemove);
        
        (uint removeLiquidityETHFinalDaiAmount, uint removeLiquidityETHFinalEthAmount) = router.removeLiquidityETH(
            DAI,                     
            ethLpAmountToRemove,        
            (expectedDaiAmount * 95) / 100,  
            (expectedEthAmount * 95) / 100, 
            DAI_WHALE,               
            block.timestamp + 300    
        );
        
        vm.stopPrank();
        
        uint256 removeLiquidityETHFinalDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 removeLiquidityETHFinalEthBalance = DAI_WHALE.balance;
        uint256 removeLiquidityETHFinalLpTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Removed (with ETH) ===");
        console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(removeLiquidityETHFinalDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(removeLiquidityETHFinalEthAmount, 18), " ETH")));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(removeLiquidityETHFinalDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(removeLiquidityETHFinalEthBalance, 18), " ETH")));
        console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(removeLiquidityETHFinalLpTokenBalance, 18))));
    }
    
    function removeLiquidityWithPermitFunction() internal {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        
        console.log("\n=== 8. removeLiquidityWithPermit Function ===");
        
        address pair = getPairAddress(DAI, WETH);
        IUniswapV2Pair lpToken = IUniswapV2Pair(pair);
        
        uint256 initialLPTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        uint256 permitLpAmountToRemove = (initialLPTokenBalance / 2) > 1e18 ? 1e18 : (initialLPTokenBalance / 2);
        
        if (permitLpAmountToRemove == 0) {
            console.log("No LP tokens to remove. Skipping removeLiquidityWithPermit Function.");
            return;
        }
        
        (uint reserveA, uint reserveB,) = lpToken.getReserves();
        
        uint256 totalSupply = lpToken.totalSupply();
        uint256 expectedDaiAmount = (reserveA * permitLpAmountToRemove) / totalSupply;
        uint256 expectedWethAmount = (reserveB * permitLpAmountToRemove) / totalSupply;
        
        uint256 initialDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 initialWethBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        
        console.log(string(abi.encodePacked("Initial DAI Balance: ", formatTokenAmount(initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Initial WETH Balance: ", formatTokenAmount(initialWethBalance, 18), " WETH")));
        console.log(string(abi.encodePacked("LP Tokens to Remove: ", formatTokenAmount(permitLpAmountToRemove, 18))));
        console.log(string(abi.encodePacked("Expected DAI to Receive: ~", formatTokenAmount(expectedDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("Expected WETH to Receive: ~", formatTokenAmount(expectedWethAmount, 18), " WETH")));
        
        uint256 privateKey = 0;
        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            privateKey = pk;
        } catch {
            console.log("PRIVATE_KEY not set in .env file. Falling back to standard removeLiquidity.");
            
            vm.startPrank(DAI_WHALE);
            lpToken.approve(address(router), permitLpAmountToRemove);
            
            (uint removeLiquidityWithPermitFinalDaiAmount, uint removeLiquidityWithPermitFinalWethAmount) = router.removeLiquidity(
                DAI,
                WETH,
                permitLpAmountToRemove,
                (expectedDaiAmount * 95) / 100,  
                (expectedWethAmount * 95) / 100, 
                DAI_WHALE,
                block.timestamp + 300
            );
            
            vm.stopPrank();
            
            uint256 removeLiquidityWithPermitFinalDaiBalance = dai.balanceOf(DAI_WHALE);
            uint256 removeLiquidityWithPermitFinalWethBalance = IERC20(WETH).balanceOf(DAI_WHALE);
            uint256 removeLiquidityWithPermitFinalLpTokenBalance = lpToken.balanceOf(DAI_WHALE);
            
            console.log("\n=== Liquidity Removed (Standard) ===");
            console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(removeLiquidityWithPermitFinalDaiAmount, 18), " DAI")));
            console.log(string(abi.encodePacked("WETH Received: ", formatTokenAmount(removeLiquidityWithPermitFinalWethAmount, 18), " WETH")));
            
            console.log("\n=== Final Balances ===");
            console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(removeLiquidityWithPermitFinalDaiBalance, 18), " DAI")));
            console.log(string(abi.encodePacked("Final WETH Balance: ", formatTokenAmount(removeLiquidityWithPermitFinalWethBalance, 18), " WETH")));
            console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(removeLiquidityWithPermitFinalLpTokenBalance, 18))));
            
            return;
        }
        
        uint256 nonce = lpToken.nonces(DAI_WHALE);
        
        uint256 deadline = block.timestamp + 300;
        bytes32 domainSeparator = lpToken.DOMAIN_SEPARATOR();
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                DAI_WHALE,
                address(router),
                permitLpAmountToRemove,
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
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        
        vm.startPrank(DAI_WHALE);
        
        (uint permitAmountA, uint permitAmountB) = router.removeLiquidityWithPermit(
            DAI,                     
            WETH,                    
            permitLpAmountToRemove,        
            (expectedDaiAmount * 95) / 100,  
            (expectedWethAmount * 95) / 100, 
            DAI_WHALE,               
            deadline,                
            true,                    
            v, r, s                  
        );
        
        vm.stopPrank();
        
        uint256 permitFinalDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 permitFinalWethBalance = IERC20(WETH).balanceOf(DAI_WHALE);
        uint256 permitFinalLpTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Removed (with Permit) ===");
        console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(permitAmountA, 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Received: ", formatTokenAmount(permitAmountB, 18), " WETH")));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(permitFinalDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Final WETH Balance: ", formatTokenAmount(permitFinalWethBalance, 18), " WETH")));
        console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(permitFinalLpTokenBalance, 18))));
    }
    
    function removeLiquidityETHWithPermitFunction() internal {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        
        console.log("\n=== 9. removeLiquidityETHWithPermit Function ===");
        
        address pair = getPairAddress(DAI, WETH);
        IUniswapV2Pair lpToken = IUniswapV2Pair(pair);
        
        uint256 initialLPTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        uint256 permitEthLpAmountToRemove = (initialLPTokenBalance / 2) > 1e18 ? 1e18 : (initialLPTokenBalance / 2);
        
        if (permitEthLpAmountToRemove == 0) {
            console.log("No LP tokens to remove. Skipping removeLiquidityETHWithPermit Function.");
            return;
        }
        
        (uint reserveA, uint reserveB,) = lpToken.getReserves();
        
        uint256 totalSupply = lpToken.totalSupply();
        uint256 expectedDaiAmount = (reserveA * permitEthLpAmountToRemove) / totalSupply;
        uint256 expectedEthAmount = (reserveB * permitEthLpAmountToRemove) / totalSupply;
        
        uint256 initialDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 initialEthBalance = DAI_WHALE.balance;
        
        console.log(string(abi.encodePacked("Initial DAI Balance: ", formatTokenAmount(initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Initial ETH Balance: ", formatTokenAmount(initialEthBalance, 18), " ETH")));
        console.log(string(abi.encodePacked("LP Tokens to Remove: ", formatTokenAmount(permitEthLpAmountToRemove, 18))));
        console.log(string(abi.encodePacked("Expected DAI to Receive: ~", formatTokenAmount(expectedDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("Expected ETH to Receive: ~", formatTokenAmount(expectedEthAmount, 18), " ETH")));
        
        uint256 privateKey = 0;
        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            privateKey = pk;
        } catch {
            console.log("PRIVATE_KEY not set in .env file. Falling back to standard removeLiquidityETH.");
            
            vm.startPrank(DAI_WHALE);
            lpToken.approve(address(router), permitEthLpAmountToRemove);
            
            (uint amountA, uint amountB) = router.removeLiquidityETH(
                DAI,
                permitEthLpAmountToRemove,
                (expectedDaiAmount * 95) / 100,  
                (expectedEthAmount * 95) / 100, 
                DAI_WHALE,
                block.timestamp + 300
            );
            
            vm.stopPrank();
            
            uint256 removeLiquidityETHFinalDaiBalance = dai.balanceOf(DAI_WHALE);
            uint256 removeLiquidityETHFinalEthBalance = DAI_WHALE.balance;
            uint256 removeLiquidityETHFinalLpTokenBalance = lpToken.balanceOf(DAI_WHALE);
            
            console.log("\n=== Liquidity Removed (Standard) ===");
            console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(amountA, 18), " DAI")));
            console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(amountB, 18), " ETH")));
            
            console.log("\n=== Final Balances ===");
            console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(removeLiquidityETHFinalDaiBalance, 18), " DAI")));
            console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(removeLiquidityETHFinalEthBalance, 18), " ETH")));
            console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(removeLiquidityETHFinalLpTokenBalance, 18))));
            
            return;
        }
        
        uint256 nonce = lpToken.nonces(DAI_WHALE);
        
        uint256 deadline = block.timestamp + 300;
        bytes32 domainSeparator = lpToken.DOMAIN_SEPARATOR();
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                DAI_WHALE,
                address(router),
                permitEthLpAmountToRemove,
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
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        
        vm.startPrank(DAI_WHALE);
        
        (uint amountToken, uint amountEther) = router.removeLiquidityETHWithPermit(
            DAI,                     
            permitEthLpAmountToRemove,        
            (expectedDaiAmount * 95) / 100,  
            (expectedEthAmount * 95) / 100, 
            DAI_WHALE,               
            deadline,                
            true,                    
            v, r, s                  
        );
        
        vm.stopPrank();
        
        uint256 removeLiquidityETHWithPermitFinalDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 removeLiquidityETHWithPermitFinalEthBalance = DAI_WHALE.balance;
        uint256 removeLiquidityETHWithPermitFinalLpTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Removed (with Permit) ===");
        console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(amountToken, 18), " DAI")));
        console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(amountEther, 18), " ETH")));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(removeLiquidityETHWithPermitFinalDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(removeLiquidityETHWithPermitFinalEthBalance, 18), " ETH")));
        console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(removeLiquidityETHWithPermitFinalLpTokenBalance, 18))));
    }
    
    function removeLiquidityETHWithPermitSupportingFeeOnTransferFunction() internal {
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        IERC20 dai = IERC20(DAI);
        
        console.log("\n=== 10. removeLiquidityETHWithPermitSupportingFeeOnTransferTokens Function ===");
        
        address pair = getPairAddress(DAI, WETH);
        IUniswapV2Pair lpToken = IUniswapV2Pair(pair);
        
        uint256 initialLPTokenBalance = lpToken.balanceOf(DAI_WHALE);
        
        uint256 lpAmountToRemove = (initialLPTokenBalance / 2) > 1e18 ? 1e18 : (initialLPTokenBalance / 2);
        
        if (lpAmountToRemove == 0) {
            console.log("No LP tokens to remove. Skipping removeLiquidityETHWithPermitSupportingFeeOnTransferTokens example.");
            return;
        }
        
        (uint reserveA, uint reserveB,) = lpToken.getReserves();
        
        uint256 totalSupply = lpToken.totalSupply();
        uint256 expectedDaiAmount = (reserveA * lpAmountToRemove) / totalSupply;
        uint256 expectedEthAmount = (reserveB * lpAmountToRemove) / totalSupply;
        
        uint256 initialDaiBalance = dai.balanceOf(DAI_WHALE);
        uint256 initialEthBalance = DAI_WHALE.balance;
        
        console.log(string(abi.encodePacked("Initial DAI Balance: ", formatTokenAmount(initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("Initial ETH Balance: ", formatTokenAmount(initialEthBalance, 18), " ETH")));
        console.log(string(abi.encodePacked("LP Tokens to Remove: ", formatTokenAmount(lpAmountToRemove, 18))));
        console.log(string(abi.encodePacked("Expected DAI to Receive: ~", formatTokenAmount(expectedDaiAmount, 18), " DAI")));
        console.log(string(abi.encodePacked("Expected ETH to Receive: ~", formatTokenAmount(expectedEthAmount, 18), " ETH")));
        
        uint256 privateKey = 0;
        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            privateKey = pk;
        } catch {
            console.log("PRIVATE_KEY not set in .env file. Falling back to standard removeLiquidityETH.");
            
            vm.startPrank(DAI_WHALE);
            lpToken.approve(address(router), lpAmountToRemove);
            
            (uint amountTK, uint amountETH) = router.removeLiquidityETH(
                DAI,
                lpAmountToRemove,
                (expectedDaiAmount * 95) / 100,  
                (expectedEthAmount * 95) / 100, 
                DAI_WHALE,
                block.timestamp + 300
            );
            
            vm.stopPrank();
            
            uint256 permitFinalDaiBal = dai.balanceOf(DAI_WHALE);
            uint256 finalEthBal = DAI_WHALE.balance;
            uint256 finalLpTkBal = lpToken.balanceOf(DAI_WHALE);
            
            console.log("\n=== Liquidity Removed (Standard) ===");
            console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(amountTK, 18), " DAI")));
            console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(amountETH, 18), " ETH")));
            
            console.log("\n=== Final Balances ===");
            console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(permitFinalDaiBal, 18), " DAI")));
            console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(finalEthBal, 18), " ETH")));
            console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(finalLpTkBal, 18))));
            
            return;
        }
        
        
        uint256 nonce = lpToken.nonces(DAI_WHALE);
        
        uint256 deadline = block.timestamp + 300;
        bytes32 domainSeparator = lpToken.DOMAIN_SEPARATOR();
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        
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
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        
        vm.startPrank(DAI_WHALE);
        
        uint256 EthAmount = router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            DAI,                     
            lpAmountToRemove,        
            (expectedDaiAmount * 95) / 100,  
            (expectedEthAmount * 95) / 100, 
            DAI_WHALE,               
            deadline,                
            true,                    
            v, r, s                  
        );
        
        vm.stopPrank();
        
        uint256 finalDaiBal = dai.balanceOf(DAI_WHALE);
        uint256 fEthBal = DAI_WHALE.balance;
        uint256 finalLpTokenBal = lpToken.balanceOf(DAI_WHALE);
        
        console.log("\n=== Liquidity Removed (with Permit, Supporting Fee on Transfer) ===");
        console.log(string(abi.encodePacked("DAI Received: ", formatTokenAmount(finalDaiBal - initialDaiBalance, 18), " DAI")));
        console.log(string(abi.encodePacked("ETH Received: ", formatTokenAmount(EthAmount, 18), " ETH")));
        
        console.log("\n=== Final Balances ===");
        console.log(string(abi.encodePacked("Final DAI Balance: ", formatTokenAmount(finalDaiBal, 18), " DAI")));
        console.log(string(abi.encodePacked("Final ETH Balance: ", formatTokenAmount(fEthBal, 18), " ETH")));
        console.log(string(abi.encodePacked("Remaining LP Tokens: ", formatTokenAmount(finalLpTokenBal, 18))));
    }
    
    function run() external {
        console.log("Current fork block:", block.number);
        console.log("Block timestamp:", block.timestamp);
        
        IERC20 dai = IERC20(DAI);
        IERC20 weth = IERC20(WETH);
        IUniswapV2Router02 router = IUniswapV2Router02(ROUTER);
        
        console.log("\n=== Initial Balances ===");
        console.log(string(abi.encodePacked("DAI Balance of DAI_WHALE: ", formatTokenAmount(dai.balanceOf(DAI_WHALE), 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Balance of DAI_WHALE: ", formatTokenAmount(weth.balanceOf(DAI_WHALE), 18), " WETH")));
        
        vm.startPrank(DAI_WHALE);
        
        console.log("\n");
        console.log("*******************************************************************************");
        console.log("*** Function 1/2: Pool Address (getPairAddress) / Create Pair (createPair) ***");
        console.log("*******************************************************************************");
        address pair = getPairAddress(WETH, DAI);
        
        if (pair == address(0)) {
            console.log("Creating new DAI-WETH pair...");
            IUniswapV2Factory factory = IUniswapV2Factory(FACTORY);
            pair = factory.createPair(WETH, DAI);
            console.log("New pair created:", pair);
            
            console.log("\n=== Adding Initial Liquidity ===");
            uint256 amountADesired = 10 * 1e18; 
            uint256 amountBDesired = 0.01 * 1e18; 
            
            require(dai.approve(address(router), amountADesired), DAI_APPROVAL_FAILED());
            require(weth.approve(address(router), amountBDesired), WETH_APPROVAL_FAILED());
            
            (uint addLiquidityAmountA, uint addLiquidityAmountB, uint liquidity) = router.addLiquidity(
                DAI,
                WETH,
                amountADesired,
                amountBDesired,
                (amountADesired * 99) / 100,
                (amountBDesired * 99) / 100,
                DAI_WHALE,
                block.timestamp + 300
            );
            
            console.log(string(abi.encodePacked("Added ", formatTokenAmount(addLiquidityAmountA, 18), " DAI and ", 
                formatTokenAmount(addLiquidityAmountB, 18), " WETH as initial liquidity")));
            console.log("Liquidity tokens minted:", liquidity);
            
        } else {
            console.log("Using existing DAI-WETH pair:", pair);
        }
        
        console.log("\n");
        console.log("**************************************************");
        console.log("*** Function 2/3: Pool Reserves (getReserves) ***");
        console.log("**************************************************");
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pair).getReserves();
        console.log(string(abi.encodePacked("DAI Reserve: ", formatTokenAmount(reserve0, 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Reserve: ", formatTokenAmount(reserve1, 18), " WETH")));
        
        console.log("\n");
        console.log("*****************************************************");
        console.log("*** Function 3/4: Calculate Swap (getAmountsOut) ***");
        console.log("*****************************************************");
        uint256 amountIn = 1000 * 1e18; // 1000 DAI
        address[] memory path = new address[](2);
        path[0] = DAI;
        path[1] = WETH;
        
        uint256[] memory amounts = router.getAmountsOut(amountIn, path);
        uint256 expectedAmountOut = amounts[1];
        
        console.log(string(abi.encodePacked("Swapping ", formatTokenAmount(amountIn, 18), " DAI for ~", formatTokenAmount(expectedAmountOut, 18), " WETH")));
        
        console.log("\n");
        console.log("***************************************************************");
        console.log("*** Function 4/5: Execute Swap (swapExactTokensForTokens) ***");
        console.log("***************************************************************");
        uint256 minAmountOut = (expectedAmountOut * 95) / 100;
        
        require(dai.approve(address(router), amountIn), DAI_APPROVAL_FAILED());
        
        uint256[] memory swapResult = router.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            DAI_WHALE,
            block.timestamp + 300
        );
        
        console.log(string(abi.encodePacked("Received: ", formatTokenAmount(swapResult[1], 18), " WETH")));
        
        console.log("\n=== Reserves Balance After Swap ===");
        (uint112 finalReserve0, uint112 finalReserve1,) = IUniswapV2Pair(pair).getReserves();
        console.log(string(abi.encodePacked("DAI Reserve: ", formatTokenAmount(finalReserve0, 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Reserve: ", formatTokenAmount(finalReserve1, 18), " WETH")));
        
        console.log("\n=== Balances After Swap ===");
        console.log(string(abi.encodePacked("DAI Balance: ", formatTokenAmount(dai.balanceOf(DAI_WHALE), 18), " DAI")));
        console.log(string(abi.encodePacked("WETH Balance: ", formatTokenAmount(weth.balanceOf(DAI_WHALE), 18), " WETH")));
        
        console.log("\n");
        console.log("****************************************************************");
        console.log("*** Function 5/6: Adding Liquidity with WETH (addLiquidity) ***");
        console.log("****************************************************************");
        
        addLiquidityFunction();
        
        console.log("\n");
        console.log("***********************************************************");
        console.log("*** Function 6/7: Removing Liquidity (removeLiquidity) ***");
        console.log("***********************************************************");
        
        removeLiquidityFunction();
        
        console.log("\n");
        console.log("**********************************************************************");
        console.log("*** Function 7/8: Removing Liquidity with ETH (removeLiquidityETH) ***");
        console.log("**********************************************************************");
        
        removeLiquidityETHFunction();

        console.log("\n");
        console.log("****************************************************************");
        console.log("*** Function 8/9: Removing Liquidity with Permit (removeLiquidityWithPermit) ***");
        console.log("****************************************************************");
        
        removeLiquidityWithPermitFunction();
        
        console.log("\n");
        console.log("****************************************************************");
        console.log("*** Function 9: Removing Liquidity with ETH and Permit (removeLiquidityETHWithPermit) ***");
        console.log("****************************************************************");
        
        removeLiquidityETHWithPermitFunction();
        
        console.log("\n");
        console.log("***********************************************************************************************************************************************");
        console.log("*** Function 10: Removing Liquidity with Permit Supporting Fee on Transfer Tokens (removeLiquidityETHWithPermitSupportingFeeOnTransferTokens) ***");
        console.log("***********************************************************************************************************************************************");
        
        console.log("\n");
        console.log("Check RemoveLiquidityWithPermitSupportingFeeOnTransfer.sol for implementation");
        console.log("\n");
        
        vm.stopPrank();
    }
}