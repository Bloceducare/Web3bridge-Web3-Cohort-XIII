// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPiggyBankFactory {
    function admin() external view returns (address);
    function notifyNewSavingsPlan(address user) external;
}
