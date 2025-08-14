// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
   
    error NotOwner();
    error ZeroAddress();

    error InvalidFee(uint256 expected, uint256 actual);

    error NoRewardsConfigured();
    error InvalidRewardIndex();
    error ZeroWeight();
    error EmptyArray();

    error ERC20TransferFailed(address token, address to, uint256 amount);
    error ERC721TransferFailed(address token, address to, uint256 tokenId);
    error ERC1155TransferFailed(address token, address to, uint256 id, uint256 amount);

    error VRFOnlyCoordinator();
}
