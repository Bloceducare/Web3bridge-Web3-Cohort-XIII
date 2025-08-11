// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./PiggyBank.sol";

contract PiggyFactory {
    PiggyBank[] public accounts;

    function create_piggyBank() external {
        PiggyBank _newPiggy = new PiggyBank(address(this));

        accounts.push(_newPiggy);
    }

    function get_balances(
        address _user,
        uint256 _index
    ) external view returns (uint256) {
        require(_index < accounts.length, "Invalid Account");
        PiggyBank piggy = accounts[_index];
        return piggy.get_Balances(_user, _index);
    }
}
