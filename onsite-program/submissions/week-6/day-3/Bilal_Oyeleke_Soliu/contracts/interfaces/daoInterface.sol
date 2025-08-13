// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface daoInterface {
    enum RoleType {
        protocolWorker,
        protocolContributor
    }

    struct Member {
        string name;
        uint age;
        address user;
        uint expirationDate;
        string data;
        RoleType role;
    }

    struct RoleData {   
        uint256 expires;
        bytes data;
    }

    struct Proposal {
        string name;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votesTrue;
        uint256 votesFalse;
        bool isActive;
    }
}
