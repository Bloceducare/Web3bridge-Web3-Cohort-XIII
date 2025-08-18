// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;



contract Lottery {
    struct Participants{
        address user;
    }

    Participants[] private PARTICIPANTS;
    address[] public participants;
    
    uint256 private entryFee = 0.01 ether;
    address private owner;
    bool private lotteryActive;

    event PlayerJoined(address player);
    event WinnerChosen(address winner, uint256 prize);

    constructor() {
        owner = msg.sender;
        lotteryActive = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function joinLottery() public payable {
        require(lotteryActive, "Lottery is not active");
        require(msg.value == entryFee, "Entry fee is 0.01 ETH");
        require(!hasJoined(msg.sender), "You have already joined this round");
        Participants memory newparticipants;
        newparticipants.user = msg.sender;

        participants.push(msg.sender);
        PARTICIPANTS.push(newparticipants);
        emit PlayerJoined(msg.sender);

        if (participants.length == 10) {
            selectWinner();
        }
    }

    function hasJoined(address _player) internal view returns (bool) {
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == _player) {
                return true;
            }
        }
        return false;
    }

    function selectWinner() internal {
        require(participants.length == 10, "Need exactly 10 players");
        lotteryActive = false;

        uint winnerIndex = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, participants))) % 10;
        address winner = participants[winnerIndex];

        uint256 prize = address(this).balance;
        payable(winner).transfer(prize);

        emit WinnerChosen(winner, prize);
        resetLottery();
    }

    function resetLottery() internal {
        delete participants;
        lotteryActive = true;
    }

    function withdrawFunds() public onlyOwner {
        require(!lotteryActive, "Cannot withdraw during active lottery");
        payable(owner).transfer(address(this).balance);
    }

    function getAllParticipants() external view returns(Participants[] memory){
        return PARTICIPANTS;
        
    }

    receive() external payable {}
}