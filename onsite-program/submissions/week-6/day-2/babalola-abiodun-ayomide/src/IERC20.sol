// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
interface IERC20Permit is IERC20 {
    function permit(address owner, address spender,uint amount, uint deadline, uint v, bytes32 r, bytes32 s) external;
}