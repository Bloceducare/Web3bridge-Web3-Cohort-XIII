// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

interface IMultisig {
    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data
    ) external;

    function revokeConfirmation(uint _txIndex) external;

    function confirmTransaction(uint _txIndex) external;

    function executeTransaction(uint _txIndex) external;

    function getOwners() external view returns (address[] memory);

    function getTransactionCount() public view returns (uint);

    function getTransaction(
        uint _txIndex
    )
        public
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        );

    function getBalance() public view returns (uint);
}
