// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IPiggyBank {

    enum AssetType { ETH, ERC20 }

    function saveETH(uint256 _lockPeriod) external payable;

    function saveERC20(address _token, uint256 _amount, uint256 _lockPeriod) external;

    function withdraw(uint256 _planId) external;

    function getBalance() external view returns (uint256);

    function getERC20Balance(address _token) external view returns (uint256);

    function getPlan(uint256 _planId) 
        external 
        view 
        returns (
            uint256 amount,
            address token,
            AssetType assetType,
            uint256 unlockTime,
            uint256 lockPeriod,
            bool withdrawn
        );

    receive() external payable;
}
