// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBank {
    function createSavingsPlan(
        address token,
        uint256 lockPeriod
    ) external returns (uint256);

    function depositETH(uint256 planId) external payable;

    function depositERC20(uint256 planId, uint256 amount) external;

    function withdraw(uint256 planId, uint256 amount) external;

    function withdrawAll(uint256 planId) external;

    function getPlanDetails(
        uint256 planId
    )
        external
        view
        returns (
            uint256 amount,
            address token,
            uint256 lockPeriod,
            uint256 unlockTime,
            bool isActive,
            bool isETH
        );

    function getAllPlans()
        external
        view
        returns (
            uint256[] memory planIds,
            uint256[] memory amounts,
            address[] memory tokens,
            uint256[] memory lockPeriods,
            uint256[] memory unlockTimes,
            bool[] memory isActiveArray,
            bool[] memory isETHArray
        );

    function getTotalBalance()
        external
        view
        returns (
            uint256 ethTotal,
            address[] memory tokenAddresses,
            uint256[] memory tokenBalances
        );

    function getPlanCount() external view returns (uint256);

    function isLocked(uint256 planId) external view returns (bool);

    function getTimeRemaining(uint256 planId) external view returns (uint256);
}
