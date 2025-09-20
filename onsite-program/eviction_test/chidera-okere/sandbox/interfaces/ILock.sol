//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;


  interface IStorage {

     function create(string memory _name, uint256 _age) external;

     function update_student(uint256 _id, string memory _name, uint256 _age) external;

     function delete_student(uint256 _id) external;
  }
