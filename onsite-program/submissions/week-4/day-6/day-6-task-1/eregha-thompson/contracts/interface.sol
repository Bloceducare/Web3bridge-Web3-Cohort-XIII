// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./library.sol";

interface Ipractise {
    function register(string memory _name, uint256 _age) external ;
    function update(string memory _name, uint256 _age, uint UID) external;
    function get_by_address(address _address) external view returns(Storage.Student memory);
    function get_all() external view returns(Storage.Student[] memory);
    function pay_salary(address _address, uint256 _amount) external payable;
}
