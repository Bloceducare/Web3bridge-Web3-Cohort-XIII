// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

interface iSvgNft {
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external;
    function token_uri(uint256 tokenId) external view returns (string memory);
}