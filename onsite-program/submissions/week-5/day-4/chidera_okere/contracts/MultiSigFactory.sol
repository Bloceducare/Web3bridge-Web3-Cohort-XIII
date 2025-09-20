// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "./MultiSig.sol";
import "../interfaces/IMultiSig.sol";

contract MultiSigFactory is IMultiSigFactory {
    struct MultiSigInfo {
        address multiSigAddress;
        address[] owners;
        uint256 required;
        uint256 createdAt;
        address creator;
        string name; // Optional name for the multisig
    }

    // State variables
    mapping(address => MultiSigInfo[]) public userMultiSigs;
    mapping(address => bool) public isMultiSig;
    MultiSigInfo[] public allMultiSigs;
    
    // Events
    event MultiSigCreated(
        address indexed multiSigAddress,
        address indexed creator,
        address[] owners,
        uint256 required,
        uint256 timestamp,
        string name
    );

    // Custom errors
    error InvalidOwnersLength();
    error InvalidRequiredSignatures();
    error ZeroAddress();
    error DuplicateOwner();
    error EmptyName();

    function createMultiSig(
        address[] memory _owners,
        uint256 _required
    ) external override returns (address) {
        return _createMultiSig(_owners, _required, "");
    }

    function createNamedMultiSig(
        address[] memory _owners,
        uint256 _required,
        string memory _name
    ) external returns (address) {
        if(bytes(_name).length == 0) {
            revert EmptyName();
        }
        return _createMultiSig(_owners, _required, _name);
    }

    function _createMultiSig(
        address[] memory _owners,
        uint256 _required,
        string memory _name
    ) internal returns (address) {
        // Validation
        if(_owners.length == 0) {
            revert InvalidOwnersLength();
        }
        if(_required == 0 || _required > _owners.length) {
            revert InvalidRequiredSignatures();
        }

        // Check for zero addresses and duplicates
        for(uint256 i = 0; i < _owners.length; i++) {
            if(_owners[i] == address(0)) {
                revert ZeroAddress();
            }
            for(uint256 j = i + 1; j < _owners.length; j++) {
                if(_owners[i] == _owners[j]) {
                    revert DuplicateOwner();
                }
            }
        }

        // Deploy new MultiSig contract
        MultiSig newMultiSig = new MultiSig(_owners, _required);
        address multiSigAddress = address(newMultiSig);

        // Store MultiSig info
        MultiSigInfo memory info = MultiSigInfo({
            multiSigAddress: multiSigAddress,
            owners: _owners,
            required: _required,
            createdAt: block.timestamp,
            creator: msg.sender,
            name: _name
        });

        // Update mappings
        isMultiSig[multiSigAddress] = true;
        allMultiSigs.push(info);

        // Add to each owner's list
        for(uint256 i = 0; i < _owners.length; i++) {
            userMultiSigs[_owners[i]].push(info);
        }

        // Add to creator's list if not already an owner
        bool creatorIsOwner = false;
        for(uint256 i = 0; i < _owners.length; i++) {
            if(_owners[i] == msg.sender) {
                creatorIsOwner = true;
                break;
            }
        }
        if(!creatorIsOwner) {
            userMultiSigs[msg.sender].push(info);
        }

        emit MultiSigCreated(
            multiSigAddress,
            msg.sender,
            _owners,
            _required,
            block.timestamp,
            _name
        );

        return multiSigAddress;
    }
         function getUserMultiSigs(address _user) external view returns (MultiSigInfo[] memory) {
        return userMultiSigs[_user];
    }

    function getAllMultiSigs() external view returns (MultiSigInfo[] memory) {
        return allMultiSigs;
    }

    function getTotalMultiSigs() external view returns (uint256) {
        return allMultiSigs.length;
    }
    }