// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./IERC20.sol";
import "./ERC20.sol";

contract ERC20Factory{
    address[] private allTokens;
    mapping (address=>IERC20) private allTokensMapping;
    function createToken(string memory name, string memory symbol, uint totalSupply ,uint8 decimals) external returns(address){
        IERC20 newToken = new ERC20(name, symbol, decimals, totalSupply);
        allTokens.push(address(newToken));
        return address(newToken);
    }
    function getTokenByAddress(address tokenAddress) external view returns (IERC20){
        return allTokensMapping[tokenAddress];
    }
    function getAllTokens() external view returns (address[] memory){
        return allTokens;
    }
}