// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/RolesRegistry.sol";
import "../src/DAONFT.sol";
import "../src/DAO.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        RolesRegistry rolesRegistry = new RolesRegistry();
        DAONFT daonft = new DAONFT("Governance NFT", "GOV", address(rolesRegistry));
        DAO dao = new DAO(address(rolesRegistry), address(daonft));
        
        rolesRegistry.grantRole(dao.PROPOSER_ROLE(), vm.addr(deployerPrivateKey), 0);
        rolesRegistry.grantRole(dao.VOTER_ROLE(), vm.addr(deployerPrivateKey), 0);
        rolesRegistry.grantRole(dao.EXECUTOR_ROLE(), vm.addr(deployerPrivateKey), 0);
        
        daonft.mint(vm.addr(deployerPrivateKey));
        dao.registerAsVoter(0);
        
        vm.stopBroadcast();
        

    }
} 