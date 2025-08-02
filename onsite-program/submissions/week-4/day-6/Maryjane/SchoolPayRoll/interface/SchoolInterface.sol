// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface SchoolInterface {
    enum Status {
        Employed,
        Unemployed
    }

    struct Teacher {
        uint Id;
        string name;
        Status status;
        uint salary;
    }
    function register(address _wallet,uint _id, string memory _name, Status _status,uint _salary) external;
    function updateStatus(address _wallet, Status _newStatus) external;


}
