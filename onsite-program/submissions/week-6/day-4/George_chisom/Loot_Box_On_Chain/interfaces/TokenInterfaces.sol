// SPDX-License-Identifier: License
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IRewardERC20 is IERC20 {
    function transferReward(address to, uint256 amount) external;
}

interface IRewardERC721 is IERC721 {
    function safeMint(address to) external;
}

interface IRewardERC1155 is IERC1155 {
    function transferReward(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;
}