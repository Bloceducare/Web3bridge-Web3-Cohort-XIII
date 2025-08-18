pragma solidity ^0.8.28;

import "./LudoToken.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MaryjaneBoardGameArena is ReentrancyGuard {
    enum PlayerColor { CRIMSON, EMERALD, SAPPHIRE, GOLDEN }
    enum MatchStatus { PENDING, RUNNING, COMPLETED }
    enum TokenStatus { BASE, MOVING, SECURED }

    struct Participant {
        address walletAddress;
        string playerName;
        PlayerColor assignedColor;
        uint256 currentScore;
        bool hasDeposited;
        uint256[4] tokenPositions;
        TokenStatus[4] tokenStates;
    }

    struct BoardMatch {
        uint256 matchIdentifier;
        Participant[4] participants;
        uint8 participantCount;
        MatchStatus currentStatus;
        uint8 activeParticipantIndex;
        uint256 totalDeposits;
        uint256 recentDiceValue;
        address matchWinner;
        uint256 matchCreationTime;
        bool[4] colorAssignments;
    }

    MaryjaneBoardGameToken public gameToken;
    uint256 public matchCounter;
    uint256 public constant DEPOSIT_REQUIREMENT = 100 * 10**18;
    uint256 public constant BOARD_SPACES = 52;
    uint256 public constant BASE_POSITIONS = 56;

    mapping(uint256 => BoardMatch) public boardMatches;
    mapping(address => uint256) public participantActiveMatch;
    mapping(uint256 => mapping(uint8 => uint256)) public matchParticipantMoves;

    event MatchCreated(uint256 indexed matchId, address indexed creator);
    event ParticipantJoined(uint256 indexed matchId, address indexed participant, string name, PlayerColor color);
    event MatchStarted(uint256 indexed matchId);
    event DiceThrown(uint256 indexed matchId, address indexed participant, uint256 result);
    event TokenMoved(uint256 indexed matchId, address indexed participant, uint8 tokenIndex, uint256 fromPosition, uint256 toPosition);
    event ParticipantVictorious(uint256 indexed matchId, address indexed winner, uint256 prize);
    event DepositMade(uint256 indexed matchId, address indexed participant, uint256 amount);

    modifier matchExists(uint256 matchId) {
        require(matchId < matchCounter, "Match does not exist");
        _;
    }

    modifier participantInMatch(uint256 matchId) {
        require(participantActiveMatch[msg.sender] == matchId, "Participant not in this match");
        _;
    }

    modifier matchActive(uint256 matchId) {
        require(boardMatches[matchId].currentStatus == MatchStatus.RUNNING, "Match is not active");
        _;
    }

    modifier participantTurn(uint256 matchId) {
        BoardMatch storage currentMatch = boardMatches[matchId];
        require(currentMatch.participants[currentMatch.activeParticipantIndex].walletAddress == msg.sender, "Not your turn");
        _;
    }

    constructor(address tokenContractAddress) {
        gameToken = MaryjaneBoardGameToken(tokenContractAddress);
    }
    
    function initializeMatch(string memory participantName) external nonReentrant returns (uint256) {
        require(bytes(participantName).length > 0, "Participant name cannot be empty");
        require(participantActiveMatch[msg.sender] == 0, "Participant already in a match");
        require(gameToken.checkStakeEligibility(msg.sender), "Insufficient tokens for deposit");

        uint256 matchId = matchCounter++;
        BoardMatch storage newMatch = boardMatches[matchId];

        newMatch.matchIdentifier = matchId;
        newMatch.currentStatus = MatchStatus.PENDING;
        newMatch.participantCount = 1;
        newMatch.matchCreationTime = block.timestamp;

        newMatch.participants[0] = Participant({
            walletAddress: msg.sender,
            playerName: participantName,
            assignedColor: PlayerColor.CRIMSON,
            currentScore: 0,
            hasDeposited: false,
            tokenPositions: [52, 53, 54, 55],
            tokenStates: [TokenStatus.BASE, TokenStatus.BASE, TokenStatus.BASE, TokenStatus.BASE]
        });

        newMatch.colorAssignments[0] = true;
        participantActiveMatch[msg.sender] = matchId;

        emit MatchCreated(matchId, msg.sender);
        emit ParticipantJoined(matchId, msg.sender, participantName, PlayerColor.CRIMSON);

        return matchId;
    }
    
    function enterMatch(uint256 matchId, string memory participantName) external matchExists(matchId) nonReentrant {
        require(bytes(participantName).length > 0, "Participant name cannot be empty");
        require(participantActiveMatch[msg.sender] == 0, "Participant already in a match");
        require(gameToken.checkStakeEligibility(msg.sender), "Insufficient tokens for deposit");

        BoardMatch storage currentMatch = boardMatches[matchId];
        require(currentMatch.currentStatus == MatchStatus.PENDING, "Match is not accepting participants");
        require(currentMatch.participantCount < 4, "Match is full");

        PlayerColor assignedColor;
        uint8 colorIndex;
        for (uint8 i = 0; i < 4; i++) {
            if (!currentMatch.colorAssignments[i]) {
                colorIndex = i;
                assignedColor = PlayerColor(i);
                break;
            }
        }

        uint8 participantIndex = currentMatch.participantCount;
        uint256[4] memory basePositions;

        if (assignedColor == PlayerColor.CRIMSON) {
            basePositions = [52, 53, 54, 55];
        } else if (assignedColor == PlayerColor.EMERALD) {
            basePositions = [56, 57, 58, 59];
        } else if (assignedColor == PlayerColor.SAPPHIRE) {
            basePositions = [60, 61, 62, 63];
        } else {
            basePositions = [64, 65, 66, 67];
        }

        currentMatch.participants[participantIndex] = Participant({
            walletAddress: msg.sender,
            playerName: participantName,
            assignedColor: assignedColor,
            currentScore: 0,
            hasDeposited: false,
            tokenPositions: basePositions,
            tokenStates: [TokenStatus.BASE, TokenStatus.BASE, TokenStatus.BASE, TokenStatus.BASE]
        });

        currentMatch.colorAssignments[colorIndex] = true;
        currentMatch.participantCount++;
        participantActiveMatch[msg.sender] = matchId;

        emit ParticipantJoined(matchId, msg.sender, participantName, assignedColor);
    }

    function makeDeposit(uint256 matchId) external matchExists(matchId) participantInMatch(matchId) nonReentrant {
        BoardMatch storage currentMatch = boardMatches[matchId];
        require(currentMatch.currentStatus == MatchStatus.PENDING, "Cannot deposit after match starts");

        uint8 participantIndex = 4;
        for (uint8 i = 0; i < currentMatch.participantCount; i++) {
            if (currentMatch.participants[i].walletAddress == msg.sender) {
                participantIndex = i;
                break;
            }
        }
        require(participantIndex < 4, "Participant not found");
        require(!currentMatch.participants[participantIndex].hasDeposited, "Already deposited");

        require(gameToken.transferFrom(msg.sender, address(this), DEPOSIT_REQUIREMENT), "Token transfer failed");

        currentMatch.participants[participantIndex].hasDeposited = true;
        currentMatch.totalDeposits += DEPOSIT_REQUIREMENT;

        emit DepositMade(matchId, msg.sender, DEPOSIT_REQUIREMENT);

        bool allDeposited = true;
        for (uint8 i = 0; i < currentMatch.participantCount; i++) {
            if (!currentMatch.participants[i].hasDeposited) {
                allDeposited = false;
                break;
            }
        }

        if (allDeposited && currentMatch.participantCount >= 2) {
            currentMatch.currentStatus = MatchStatus.RUNNING;
            currentMatch.activeParticipantIndex = 0;
            emit MatchStarted(matchId);
        }
    }

    function throwDice(uint256 matchId) external matchExists(matchId) matchActive(matchId) participantTurn(matchId) returns (uint256) {
        BoardMatch storage currentMatch = boardMatches[matchId];

        uint256 diceResult = generateRandomValue() % 6 + 1;
        currentMatch.recentDiceValue = diceResult;

        emit DiceThrown(matchId, msg.sender, diceResult);

        return diceResult;
    }

    function moveToken(uint256 matchId, uint8 tokenIndex, uint256 diceResult) external matchExists(matchId) matchActive(matchId) participantTurn(matchId) {
        require(tokenIndex < 4, "Invalid token index");
        require(diceResult >= 1 && diceResult <= 6, "Invalid dice result");

        BoardMatch storage currentMatch = boardMatches[matchId];
        Participant storage activeParticipant = currentMatch.participants[currentMatch.activeParticipantIndex];

        uint256 currentPosition = activeParticipant.tokenPositions[tokenIndex];
        TokenStatus currentState = activeParticipant.tokenStates[tokenIndex];

        uint256 newPosition;
        TokenStatus newState;

        if (currentState == TokenStatus.BASE) {
            require(diceResult == 6, "Need 6 to move out of base");
            newPosition = getStartingPosition(activeParticipant.assignedColor);
            newState = TokenStatus.MOVING;
        } else if (currentState == TokenStatus.MOVING) {
            newPosition = (currentPosition + diceResult) % BOARD_SPACES;
            newState = TokenStatus.MOVING;

            if (isInSecureZone(newPosition, activeParticipant.assignedColor)) {
                newState = TokenStatus.SECURED;
            }
        } else {
            newPosition = currentPosition + diceResult;
            require(newPosition <= getMaxSecurePosition(activeParticipant.assignedColor), "Cannot move beyond secure zone");
            newState = TokenStatus.SECURED;
        }

        uint256 oldPosition = currentPosition;
        activeParticipant.tokenPositions[tokenIndex] = newPosition;
        activeParticipant.tokenStates[tokenIndex] = newState;

        emit TokenMoved(matchId, msg.sender, tokenIndex, oldPosition, newPosition);

        if (checkVictoryCondition(activeParticipant)) {
            currentMatch.currentStatus = MatchStatus.COMPLETED;
            currentMatch.matchWinner = msg.sender;

            require(gameToken.transfer(msg.sender, currentMatch.totalDeposits), "Prize transfer failed");

            emit ParticipantVictorious(matchId, msg.sender, currentMatch.totalDeposits);

            for (uint8 i = 0; i < currentMatch.participantCount; i++) {
                participantActiveMatch[currentMatch.participants[i].walletAddress] = 0;
            }
        } else {
            if (diceResult != 6) {
                currentMatch.activeParticipantIndex = (currentMatch.activeParticipantIndex + 1) % currentMatch.participantCount;
            }
        }
    }

    function generateRandomValue() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            matchCounter
        )));
    }

    function getStartingPosition(PlayerColor color) private pure returns (uint256) {
        if (color == PlayerColor.CRIMSON) return 0;
        if (color == PlayerColor.EMERALD) return 13;
        if (color == PlayerColor.SAPPHIRE) return 26;
        return 39;
    }

    function isInSecureZone(uint256 position, PlayerColor color) private pure returns (bool) {
        uint256 secureZoneStart = getStartingPosition(color) + 50;
        return position >= secureZoneStart % BOARD_SPACES;
    }

    function getMaxSecurePosition(PlayerColor color) private pure returns (uint256) {
        return 68 + uint256(color) * 4;
    }

    function checkVictoryCondition(Participant storage participant) private view returns (bool) {
        for (uint8 i = 0; i < 4; i++) {
            if (participant.tokenStates[i] != TokenStatus.SECURED ||
                participant.tokenPositions[i] < getMaxSecurePosition(participant.assignedColor)) {
                return false;
            }
        }
        return true;
    }

    function getMatchDetails(uint256 matchId) external view matchExists(matchId) returns (
        uint256 id,
        uint8 participantCount,
        MatchStatus status,
        uint8 activeParticipantIndex,
        uint256 totalDeposits,
        uint256 recentDiceValue,
        address winner
    ) {
        BoardMatch storage currentMatch = boardMatches[matchId];
        return (
            currentMatch.matchIdentifier,
            currentMatch.participantCount,
            currentMatch.currentStatus,
            currentMatch.activeParticipantIndex,
            currentMatch.totalDeposits,
            currentMatch.recentDiceValue,
            currentMatch.matchWinner
        );
    }

    function getParticipantDetails(uint256 matchId, uint8 participantIndex) external view matchExists(matchId) returns (
        address walletAddress,
        string memory name,
        PlayerColor color,
        uint256 score,
        bool hasDeposited,
        uint256[4] memory tokenPositions,
        TokenStatus[4] memory tokenStates
    ) {
        require(participantIndex < boardMatches[matchId].participantCount, "Participant index out of bounds");
        Participant storage participant = boardMatches[matchId].participants[participantIndex];
        return (
            participant.walletAddress,
            participant.playerName,
            participant.assignedColor,
            participant.currentScore,
            participant.hasDeposited,
            participant.tokenPositions,
            participant.tokenStates
        );
    }

    function getActiveParticipant(uint256 matchId) external view matchExists(matchId) returns (address) {
        BoardMatch storage currentMatch = boardMatches[matchId];
        if (currentMatch.currentStatus != MatchStatus.RUNNING) return address(0);
        return currentMatch.participants[currentMatch.activeParticipantIndex].walletAddress;
    }

    function canMoveToken(uint256 matchId, uint8 tokenIndex, uint256 diceResult) external view matchExists(matchId) returns (bool) {
        BoardMatch storage currentMatch = boardMatches[matchId];
        if (currentMatch.currentStatus != MatchStatus.RUNNING) return false;

        Participant storage activeParticipant = currentMatch.participants[currentMatch.activeParticipantIndex];
        TokenStatus currentState = activeParticipant.tokenStates[tokenIndex];

        if (currentState == TokenStatus.BASE) {
            return diceResult == 6;
        }

        return true;
    }

    function exitMatch(uint256 matchId) external matchExists(matchId) participantInMatch(matchId) nonReentrant {
        BoardMatch storage currentMatch = boardMatches[matchId];
        require(currentMatch.currentStatus == MatchStatus.PENDING, "Cannot exit active match");

        uint8 participantIndex = 4;
        for (uint8 i = 0; i < currentMatch.participantCount; i++) {
            if (currentMatch.participants[i].walletAddress == msg.sender) {
                participantIndex = i;
                break;
            }
        }
        require(participantIndex < 4, "Participant not found");

        if (currentMatch.participants[participantIndex].hasDeposited) {
            require(gameToken.transfer(msg.sender, DEPOSIT_REQUIREMENT), "Deposit return failed");
            currentMatch.totalDeposits -= DEPOSIT_REQUIREMENT;
        }

        currentMatch.colorAssignments[uint8(currentMatch.participants[participantIndex].assignedColor)] = false;

        for (uint8 i = participantIndex; i < currentMatch.participantCount - 1; i++) {
            currentMatch.participants[i] = currentMatch.participants[i + 1];
        }

        currentMatch.participantCount--;
        participantActiveMatch[msg.sender] = 0;

        if (currentMatch.participantCount == 0) {
            currentMatch.currentStatus = MatchStatus.COMPLETED;
        }
    }

    function getMatchCount() external view returns (uint256) {
        return matchCounter;
    }

    function getParticipantMatch(address participant) external view returns (uint256) {
        return participantActiveMatch[participant];
    }
}
