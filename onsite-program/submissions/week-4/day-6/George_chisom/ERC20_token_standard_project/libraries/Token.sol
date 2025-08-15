// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


library Token {

    struct TokenInfo {
        string name;
        string symbol;
        uint16 digits;
    }

    error INSUFFICIENT_FUND();

    error SENDER_OR_RECEIVER_CANNOT_BE_ZERO_ADDRESS();

    error Balance_Must_Be_Greater_Amount();

    error Amount_Must_Be_Greater_Allowance();

    error Mint_Must_Be_Greater_Than_0();

    error MINTER_CANNOT_BE_ZERO_ADDRESS();

    error BURNER_CANNOT_BE_ZERO_ADDRESS();

    error Burner_Must_Be_Greater_Than_0();

    error Amount_Is_Greater_Allowance();

}