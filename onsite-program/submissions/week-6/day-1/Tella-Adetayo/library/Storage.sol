// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library Storage {

    struct Layout {
        address owner; 
        address admin; 
        address factory; 
        address token; // address(0) => ETH
        uint256 createdAt; 
        uint256 lockPeriodSeconds; 
        uint256 lockedUntil; 
        uint256 balance; 
        uint16 feeBps; // 300 => 3.00%
        bool active; 
        bool initialized; 

        IERC20 savingToken;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("piggyBank.storage"); 
    
    function layout() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT; 
        assembly {
            ds.slot := slot 
        }
    }
}