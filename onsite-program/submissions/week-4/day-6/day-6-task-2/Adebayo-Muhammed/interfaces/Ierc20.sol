// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface Ierc20 {
    function mintToken(address _owner, uint _tokenAmount) external;
    function balanceOf (address _user) external view returns (uint);
    function approve(address _spender, uint _amount) external returns (bool);
    function allowance(address _spender) external view returns (uint);
    function trasfer(address _receiver, uint _amount) external returns (bool);
    function transFrom (address _from, address _to, uint _amount) external returns (bool);
    function _totalSupply() external view returns (uint);

}