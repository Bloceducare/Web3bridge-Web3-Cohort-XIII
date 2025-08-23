// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./UniswapPermit.sol";

contract AdvancedPermitSwap is UniswapPermit{
    
    // Additional state for advanced features
    mapping(address => bool) public authorizedRelayers;
    uint256 public maxSlippage = 500; 
    
    event SlippageExceeded(address indexed user, uint256 expected, uint256 actual);
    event RelayerUpdated(address indexed relayer, bool authorized);
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender] || msg.sender == tx.origin, "Unauthorized relayer");
        _;
    }
    
    constructor(address _uniswapRouter) UniswapPermit(_uniswapRouter) {}
    
    
    function permitAndSwapWithSlippage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 slippageBps,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant onlyAuthorizedRelayer {
        require(slippageBps <= maxSlippage, "Slippage too high");
        
        // Get expected output
        uint256 expectedOut = this.getAmountOut(tokenIn, tokenOut, amountIn);
        
        // Calculate minimum output with slippage
        uint256 amountOutMin = expectedOut * (10000 - slippageBps) / 10000;
        
        // Execute the swap
        this.permitAndSwap(
            tokenIn,
            tokenOut,
            amountIn,
            amountOutMin,
            deadline,
            v,
            r,
            s
        );
    }
    
    
    function setAuthorizedRelayer(address relayer, bool authorized) external {
        // Add proper access control in production
        authorizedRelayers[relayer] = authorized;
        emit RelayerUpdated(relayer, authorized);
    }
    
    
    function setMaxSlippage(uint256 _maxSlippage) external {
        require(_maxSlippage <= 1000, "Slippage too high"); 
        maxSlippage = _maxSlippage;
    }
}