// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

error NEVER();
contract Ether {
    address owner;

    constructor() {
        owner = msg.sender;
    }

    mapping (address=> uint256) balances;
    function get_balan() external view returns (uint256){
        return  balances[msg.sender];
    }

    receive() external payable {}

    fallback() external{}

    function get_balance() external view returns(uint256) {
        return address(this).balance;
    }

    // function name() external  view returns(uint256) {
    //     return  this.get_balance();
    // }
   

    function transfer(address payable _to, uint256 _amount) external {
        if(owner != msg.sender){
            revert NEVER();
        }
        _to.transfer(_amount);
    }
}