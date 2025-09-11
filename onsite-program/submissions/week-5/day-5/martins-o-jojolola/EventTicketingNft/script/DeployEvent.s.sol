// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Event.sol";
import "../src/EventToken.sol";
import "../src/EventNFTs.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        EventToken eventToken = new EventToken(
            "EventTicketToken",
            "ETT",
            1_000_000
        );

        console.log("EventToken deployed at:", address(eventToken));

        EventNFTs eventNFTs = new EventNFTs();

        console.log("EventNFTs deployed at:", address(eventNFTs));

        Event eventContract = new Event(
            address(eventToken),
            address(eventNFTs)
        );

        console.log("Event contract deployed at:", address(eventContract));

        eventNFTs.transferOwnership(address(eventContract));

        console.log("EventNFTs ownership transferred to Event contract");

        eventContract.addValidator(msg.sender);

        console.log("Deployer added as validator");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("EventToken:", address(eventToken));
        console.log("EventNFTs:", address(eventNFTs));
        console.log("Event Contract:", address(eventContract));
        console.log("Deployer/Owner:", msg.sender);

        string memory deploymentInfo = string(
            abi.encodePacked(
                "EventToken=",
                vm.toString(address(eventToken)),
                "\n",
                "EventNFTs=",
                vm.toString(address(eventNFTs)),
                "\n",
                "EventContract=",
                vm.toString(address(eventContract)),
                "\n",
                "Owner=",
                vm.toString(msg.sender)
            )
        );

        vm.writeFile("./broadcast/deployment.json", deploymentInfo);
        console.log("Deployment info saved to deployment file");
    }
}

contract VerifyScript is Script {
    function run() public view {
        address eventTokenAddress = vm.envAddress("EVENT_TOKEN_ADDRESS");
        address eventNFTsAddress = vm.envAddress("EVENT_NFTS_ADDRESS");
        address eventContractAddress = vm.envAddress("EVENT_CONTRACT_ADDRESS");

        EventToken eventToken = EventToken(eventTokenAddress);
        EventNFTs eventNFTs = EventNFTs(eventNFTsAddress);
        Event eventContract = Event(eventContractAddress);

        console.log("=== Contract Verification ===");

        console.log("EventToken name:", eventToken.name());
        console.log("EventToken symbol:", eventToken.symbol());
        console.log("EventToken total supply:", eventToken.totalSupply());
        console.log("EventToken owner:", eventToken.owner());

        console.log("EventNFTs name:", eventNFTs.name());
        console.log("EventNFTs symbol:", eventNFTs.symbol());
        console.log("EventNFTs owner:", eventNFTs.owner());
        console.log("EventNFTs total supply:", eventNFTs.totalSupply());

        console.log(
            "Event contract token:",
            address(eventContract.eventToken())
        );
        console.log("Event contract NFTs:", address(eventContract.eventNFTs()));
        console.log("Event contract owner:", eventContract.owner());
        console.log("Total events:", eventContract.getTotalEvents());

        require(
            eventNFTs.owner() == eventContractAddress,
            "EventNFTs ownership not transferred"
        );
        require(
            address(eventContract.eventToken()) == eventTokenAddress,
            "Wrong token address"
        );
        require(
            address(eventContract.eventNFTs()) == eventNFTsAddress,
            "Wrong NFTs address"
        );

        console.log("All contracts verified successfully!");
    }
}
