// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;
import "../contracts/interfaces/IErc7432.sol";

error NO_ROLE_ASSIGNED();
error CAN_NOT_REVOKE_ROLE();

contract NftRoles is IErc7432 {

    mapping(address => uint256) tokenId;
    mapping(uint256 => Role[]) userRole;


    /// @notice Grants a role to a user.
    /// @dev Reverts if sender is not approved or the NFT owner.
    /// @param _role The role attributes.
    function grantRole(Role calldata _role) external{
       uint256 foundTokenId = tokenId[_role.recipient];
       if (foundTokenId == 0){
           tokenId[_role.recipient] = _role.tokenId;
           userRole[_role.tokenId].push(_role);
           return;
       }
        tokenId[_role.recipient] = _role.tokenId;
        userRole[_role.tokenId].push(_role);
    }
//    struct Role {
//        bytes32 roleId;
//        address tokenAddress;
//        uint256 tokenId;
//        address recipient;
//        uint64 expirationDate;
//        bool revocable;
//        bytes data;
//    }

    function grantRoleDao(bytes32 _roleId, address _tokenAddress, uint256 _tokenId, address _recipient, uint64 _expirationDate, bool _revocable, bytes memory _data) external  {
        Role memory role;
        role.roleId = _roleId;
        role.tokenAddress = _tokenAddress;
        role.tokenId = _tokenId;
        role.recipient =_recipient;
        role.expirationDate = _expirationDate;
        role.revocable = _revocable;
        role.data = _data;
        this.grantRole(role);
    }
   

    /// @notice Revokes a role from a user.
    /// @dev Reverts if sender is not approved or the original owner.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _roleId The role identifier.
    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external{
        for (uint i = 0; i < userRole[_tokenId].length; i++){
            uint256 arrayLength = userRole[_tokenId].length;
            if (userRole[_tokenId][i].roleId == _roleId){
                if(userRole[_tokenId][i].revocable == false)revert("CAN_NOT_REVOKE_ROLE");
                userRole[_tokenId][i] = userRole[_tokenId][arrayLength -1];
                userRole[_tokenId].pop();
                return;
            }
        }
        revert("role does not exist");
    }


    function revokeDaoRole(uint256 _tokenId, address _toRevoke, bytes32 _role) external {
        require( tokenId[_toRevoke] != 0, NO_ROLE_ASSIGNED());
        for (uint i;  i < userRole[_tokenId].length; i++ ){
            if (userRole[_tokenId][i].roleId == _role){
                Role memory role = userRole[_tokenId][i];
                this.revokeRole(role.tokenAddress, role.tokenId, role.roleId);
                return;
            }
        }

        revert("role does not exist");
    }

    /// @notice Unlocks NFT (transfer back to original owner or unfreeze it).
    /// @dev Reverts if sender is not approved or the original owner.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    function unlockToken(address _tokenAddress, uint256 _tokenId) external{

    }

    /// @notice Approves operator to grant and revoke roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _approved The approval status.
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external{

    }

    /** View Functions **/

    /// @notice Retrieves the original owner of the NFT.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @return owner_ The owner of the token.
    
    function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_){
        return address(0);
    }

    /// @notice Retrieves the recipient of an NFT role.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _roleId The role identifier.
    /// @return recipient_ The user that received the role.
    function recipientOf(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (address recipient_){
        return address(0);
    }

    /// @notice Retrieves the custom data of a role assignment.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _roleId The role identifier.
    /// @return data_ The custom data of the role.
    function roleData(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (bytes memory data_){
        return bytes("");
    }

    /// @notice Retrieves the expiration date of a role assignment.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _roleId The role identifier.
    /// @return expirationDate_ The expiration date of the role.
    function roleExpirationDate(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (uint64 expirationDate_){
        return 0;
    }

    /// @notice Verifies whether the role is revocable.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _roleId The role identifier.
    /// @return revocable_ Whether the role is revocable.
    function isRoleRevocable(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (bool revocable_){
        return false;
    }

    /// @notice Verifies if the owner approved the operator.
    /// @param _tokenAddress The token address.
    /// @param _owner The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    /// @return Whether the operator is approved.
    function isRoleApprovedForAll(
        address _tokenAddress,
        address _owner,
        address _operator
    ) external view returns (bool){
        return false;
    }

}
