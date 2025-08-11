// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IPiggyBank {
    function depositEther() external payable;
    function depositToken(address token, uint amount) external;
    function withdraw() external;
    function getBalance() external view returns (uint);
}
