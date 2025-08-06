// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface iERC20Token {

    function total_supply() external view returns (uint256);

	function balanceOf(address account) external view returns (uint256);

	function transfer(address payable receiver, uint _amount) external returns (bool);

	function allowance(address payable owner, address payable spender) external view returns (uint);

	function approve(address payable owner, uint amount) external returns(bool);

	function transferFrom(address payable owner, address payable spender, uint amount) external returns (bool);

    function mint_token(address _minter, uint _amount) external;

    function burn_token(uint _amount) external;


	function view_admin() external view returns (address);

}