// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Multisig {
    uint private _requiredSignatures;
    address[] private _owners;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        mapping(address => bool) signatures;
    }

    // Helper function to check if an address is an owner
    function isOwner(address account) internal view returns (bool) {
        for (uint i = 0; i < _owners.length; i++) {
            if (_owners[i] == account) {
                return true;
            }
        }
        return false;
    }

    Transaction[] private _transactions;

    event transactionCreated(
        uint256 transactionId,
        address to,
        uint256 value,
        bytes data
    );
    event transactionSigned(uint256 transactionId, address signer);
    event transactionExecuted(uint256 transactionId, address executer);

    constructor(address[] memory owners, uint requiredSignatures) {
        require(owners.length >= 3, "At least three owners required");
        require(
            requiredSignatures >= 3 && requiredSignatures <= owners.length,
            "Invalid number of signatures"
        );
        require(
            requiredSignatures <= owners.length,
            "Required signatures cannot exceed number of owners"
        );

        _owners = owners;
        _requiredSignatures = 3;
    }

    function submitTransaction(
        address to,
        uint256 value,
        bytes memory data
    ) public {
        require(isOwner(msg.sender), "Not an owner!");
        require(to != address(0), "Invalid destination address");
        require(value >= 0, "Invalid value");

        uint256 transactionId = _transactions.length;
        _transactions.push();
        Transaction storage transaction = _transactions[transactionId];
        transaction.to = to;
        transaction.value = value;
        transaction.data = data;
        transaction.executed = false;

        emit transactionCreated(transactionId, to, value, data);
    }

    function signTransaction(uint256 transactionId) public {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(isOwner(msg.sender), "Only owners can sign transactions");
        require(
            !transaction.signatures[msg.sender],
            "Transaction already signed by this owner"
        );

        transaction.signatures[msg.sender] = true;
        emit transactionSigned(transactionId, msg.sender);
        if (countSignatures(transaction) >= _requiredSignatures) {
            executeTransaction(transactionId);
        }
    }

    // Helper function to count valid signatures for a transaction
    function countSignatures(
        Transaction storage transaction
    ) internal view returns (uint count) {
        for (uint i = 0; i < _owners.length; i++) {
            if (transaction.signatures[_owners[i]]) {
                count++;
            }
        }
    }

    function executeTransaction(uint256 transactionId) private {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(
            countSignatures(transaction) >= _requiredSignatures,
            "Insufficient valid signatures"
        );

        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Transaction execution failed");
        emit transactionExecuted(transactionId, msg.sender);
    }


    function getTransactionCount() public view returns (uint256) {
        return _transactions.length;
    }
}





// // Import your Multisig contract
// import "./Multisig.sol";

// contract MultisigFactory {
//     // Array to store all deployed multisig contracts
//     address[] public deployedMultisigs;

//     // Mapping to track if an address is a deployed multisig
//     mapping(address => bool) public isMultisig;

//     // Mapping to track multisigs created by each user
//     mapping(address => address[]) public userMultisigs;

//     // Events
//     event MultisigCreated(
//         address indexed multisigAddress,
//         address indexed creator,
//         address[] owners,
//         uint requiredSignatures,
//         uint timestamp
//     );

//     struct MultisigInfo {
//         address multisigAddress;
//         address creator;
//         address[] owners;
//         uint requiredSignatures;
//         uint createdAt;
//     }

//     // Mapping to store multisig information
//     mapping(address => MultisigInfo) public multisigInfo;

//     function createMultisig(
//         address[] memory owners,
//         uint requiredSignatures
//     ) public returns (address) {
//         // Validation
//         require(owners.length >= 3, "At least 3 owners required");
//         require(requiredSignatures >= 3, "At least 3 signatures required");
//         require(
//             requiredSignatures <= owners.length,
//             "Required signatures cannot exceed owners count"
//         );

//         // Check for duplicate owners
//         for (uint i = 0; i < owners.length; i++) {
//             require(owners[i] != address(0), "Owner cannot be zero address");
//             for (uint j = i + 1; j < owners.length; j++) {
//                 require(owners[i] != owners[j], "Duplicate owner address");
//             }
//         }

//         // Deploy new Multisig contract
//         Multisig newMultisig = new Multisig(owners, requiredSignatures);
//         address multisigAddress = address(newMultisig);

//         // Store the deployed contract address
//         deployedMultisigs.push(multisigAddress);
//         isMultisig[multisigAddress] = true;
//         userMultisigs[msg.sender].push(multisigAddress);

//         // Store multisig information
//         multisigInfo[multisigAddress] = MultisigInfo({
//             multisigAddress: multisigAddress,
//             creator: msg.sender,
//             owners: owners,
//             requiredSignatures: requiredSignatures,
//             createdAt: block.timestamp
//         });

//         // Emit event
//         emit MultisigCreated(
//             multisigAddress,
//             msg.sender,
//             owners,
//             requiredSignatures,
//             block.timestamp
//         );

//         return multisigAddress;
//     }

//     function createStandardMultisig(
//         address owner1,
//         address owner2,
//         address owner3
//     ) public returns (address) {
//         address[] memory owners = new address[](3);
//         owners[0] = owner1;
//         owners[1] = owner2;
//         owners[2] = owner3;

//         return createMultisig(owners, 3);
//     }

//     function getAllMultisigs() public view returns (address[] memory) {
//         return deployedMultisigs;
//     }

//     function getUserMultisigs(
//         address user
//     ) public view returns (address[] memory) {
//         return userMultisigs[user];
//     }

//     function getMultisigCount() public view returns (uint) {
//         return deployedMultisigs.length;
//     }

//     function getMultisigDetails(
//         address multisigAddress
//     ) public view returns (MultisigInfo memory) {
//         require(isMultisig[multisigAddress], "Not a valid multisig address");
//         return multisigInfo[multisigAddress];
//     }

//     function isFactoryMultisig(address addr) public view returns (bool) {
//         return isMultisig[addr];
//     }

//     function getMultisigsForOwner(
//         address owner
//     ) public view returns (address[] memory) {
//         // First count how many multisigs the owner is part of
//         uint count = 0;
//         for (uint i = 0; i < deployedMultisigs.length; i++) {
//             address[] memory owners = multisigInfo[deployedMultisigs[i]].owners;
//             for (uint j = 0; j < owners.length; j++) {
//                 if (owners[j] == owner) {
//                     count++;
//                     break;
//                 }
//             }
//         }

//         // Create array and populate it
//         address[] memory result = new address[](count);
//         uint index = 0;
//         for (uint i = 0; i < deployedMultisigs.length; i++) {
//             address[] memory owners = multisigInfo[deployedMultisigs[i]].owners;
//             for (uint j = 0; j < owners.length; j++) {
//                 if (owners[j] == owner) {
//                     result[index] = deployedMultisigs[i];
//                     index++;
//                     break;
//                 }
//             }
//         }

//         return result;
//     }
// }
