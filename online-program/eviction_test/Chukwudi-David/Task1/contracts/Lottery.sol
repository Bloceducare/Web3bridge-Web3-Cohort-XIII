// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

  error NotOwner();
  error WrongFee();
  error AlreadyJoined();
  error TransferFailed();
  error RoundNotEmpty();
  error EntryFeeMustBeGreaterThanZero();

contract Lottery {

    uint256 public constant MAX_PLAYERS = 10;

    address public owner;
    uint256 public entryFee;          // e.g., 0.01 ether (set in constructor)
    uint256 public roundId = 1;       // starts at round 1

    address[] private _players;       // players for the current round
    mapping(address => bool) private _hasJoined; // per-round membership

    mapping(uint256 => address) public winnerOf; // roundId => winner
    mapping(uint256 => uint256) public prizeOf;  // roundId => prize paid

    event PlayerJoined(address indexed player, uint256 indexed round, uint256 totalPlayers);


    event WinnerSelected(address indexed winner, uint256 prize, uint256 indexed round);
    event RoundReset(uint256 indexed newRoundId);
    event EntryFeeUpdated(uint256 oldFee, uint256 newFee);


    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 _entryFee) {
        if(_entryFee <= 0) revert EntryFeeMustBeGreaterThanZero();
        owner = msg.sender;
        entryFee = _entryFee;
    }

    function joinLottery(address player) external payable {
        if (msg.value != entryFee) revert WrongFee();
        if (_hasJoined[player]) revert AlreadyJoined();

        _players.push(player);
        _hasJoined[player] = true;

        emit PlayerJoined(player, roundId, _players.length);

        if (_players.length == MAX_PLAYERS) {
            _selectWinnerAndReset();
        }
    }

    function setEntryFee(uint256 newFee) external onlyOwner {
        if (_players.length != 0) revert RoundNotEmpty();
        require(newFee > 0, "fee=0");
        uint256 old = entryFee;
        entryFee = newFee;
        emit EntryFeeUpdated(old, newFee);
    }



    function _selectWinnerAndReset() private {
        uint256 rand = uint256(
            keccak256(
                abi.encode(block.prevrandao, block.timestamp, _players, address(this), roundId)
            )
        );
        uint256 winnerIndex = rand % _players.length;
        address winner = _players[winnerIndex];

        uint256 prize = address(this).balance;

        winnerOf[roundId] = winner;
        prizeOf[roundId] = prize;

        (bool ok, ) = payable(winner).call{value: prize}("");
        if (!ok) revert TransferFailed();
        emit WinnerSelected(winner, prize, roundId);

        for (uint256 i = 0; i < _players.length; i++) {
            _hasJoined[_players[i]] = false;
        }
        delete _players;

        unchecked {
            roundId += 1;
        }
        emit RoundReset(roundId);
    }


    function players() external view returns (address[] memory) {
        return _players;
    }

    function playersCount() external view returns (uint256) {
        return _players.length;
    }

    function getWinnerById(uint256 id) external view returns (address) {
        return winnerOf[id];
    }

    receive() external payable {
        revert WrongFee();
    }

    fallback() external payable {
        revert WrongFee();
    }
}
