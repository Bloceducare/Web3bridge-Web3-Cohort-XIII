// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {EngancheToken} from "./EngancheToken.sol";

contract EngancheTokenFactory {
    address[] public tokens;
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint8 decimals,
        uint256 totalSupply
    );

    function createToken(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) external returns (address) {
        EngancheToken newToken = new EngancheToken(
            name_,
            symbol_,
            decimals_,
            totalSupply_
        );
        tokens.push(address(newToken));
        emit TokenCreated(
            address(newToken),
            name_,
            symbol_,
            decimals_,
            totalSupply_
        );
        return address(newToken);
    }
    
}
