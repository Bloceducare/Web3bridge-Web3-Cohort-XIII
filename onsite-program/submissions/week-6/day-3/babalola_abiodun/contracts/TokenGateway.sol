// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ITokenGateway} from "./ITokenGateway.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {DAOMembershipNFT} from "./AdminNFT.sol";
contract TokenGateway is ITokenGateway{

    DAOMembershipNFT  private token;
    mapping(address => Role) private userRoles;
    mapping(address=> bool) private userActivityStatus;

    uint private counter;
    address private owner;

    constructor(address contractAddress) {
        token = DAOMembershipNFT(contractAddress);
        owner= msg.sender;
    }

    function mint(
        address userCreated,
        string memory roleId,
        bool isRecovable,
        bytes memory data
    ) external {
        uint64 date = uint64(block.timestamp + (1_000_000 days));
        require(userRoles[userCreated].tokenId == 0, "user is a memnber");
        counter = counter += 1;
        token.mintMembership(userCreated);
        userRoles[userCreated] = Role({
            roleId: keccak256(abi.encodePacked(address(this), roleId)),
            tokenAddress: token.ownerOf(counter),
            tokenId: counter,
            recipient: userCreated,
            expirationDate: date,
            revocable: isRecovable,
            data: data
        });
        userActivityStatus[userCreated] = true;
    }

    function isUser(address userAddress) public view returns (bool) {
        Role memory userRole = userRoles[userAddress];
        return userRole.tokenId != 0;
    }

    function revokeUserRole(address userAddress) external returns(bool){
        Role memory role = userRoles[userAddress];
        require(role.revocable , "role is not revocable");
        userActivityStatus[userAddress] = false;
        return true;
    }
    function unlockToken(address userAddress) public {
        Role memory role = userRoles[userAddress];
        require(userActivityStatus[userAddress], "user is not Revoked");
        require(role.revocable , "role is not revocable");
        userActivityStatus[userAddress] = false;
        emit TokenUnlocked(owner,token.ownerOf(1),userRoles[userAddress].tokenId);
    }
    function grantRole(Role calldata _role) external{
        unlockToken(_role.recipient);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external{
        require(token.ownerOf(1) ==_tokenAddress, "Invalid token address");
        require(isUser(_operator), "Invalid user");
        token.setApprovalForAll(_operator, _approved);
    }

}
