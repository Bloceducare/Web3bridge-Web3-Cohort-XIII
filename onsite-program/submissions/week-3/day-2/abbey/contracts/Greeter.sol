// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Greeter {
    string public text;

    function setText(string memory _text) public {
        text = _text;
    }
    function getText() public view returns(string memory){
        return text;
    }
}
