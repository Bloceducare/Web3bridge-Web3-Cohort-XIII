// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TokenGatedDAO.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProposalManager is Ownable {
    TokenGatedDAO public dao;
    
    struct ProposalTemplate {
        string name;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        bool active;
    }
    
    mapping(uint256 => ProposalTemplate) public templates;
    uint256 public templateCounter;
    
    event TemplateCreated(uint256 indexed templateId, string name);
    event ProposalCreatedFromTemplate(uint256 indexed proposalId, uint256 indexed templateId);
    
    // Fixed: Changed from address to address payable
    constructor(address payable _dao) {
        dao = TokenGatedDAO(_dao);
    }
    
    function createTemplate(
        string memory name,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "ProposalManager: template name required");
        require(targets.length > 0, "ProposalManager: empty template");
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "ProposalManager: template parameter mismatch"
        );
        
        templateCounter++;
        uint256 templateId = templateCounter;
        
        ProposalTemplate storage template = templates[templateId];
        template.name = name;
        template.description = description;
        template.targets = targets;
        template.values = values;
        template.calldatas = calldatas;
        template.active = true;
        
        emit TemplateCreated(templateId, name);
        return templateId;
    }
    
    function createProposalFromTemplate(
        uint256 templateId,
        string memory customDescription
    ) external returns (uint256) {
        require(templateId > 0 && templateId <= templateCounter, "ProposalManager: invalid template");
        ProposalTemplate storage template = templates[templateId];
        require(template.active, "ProposalManager: template not active");
        
        string memory finalDescription = bytes(customDescription).length > 0 
            ? customDescription 
            : template.description;
            
        uint256 proposalId = dao.propose(
            template.targets,
            template.values,
            template.calldatas,
            finalDescription
        );
        
        emit ProposalCreatedFromTemplate(proposalId, templateId);
        return proposalId;
    }
    
    function deactivateTemplate(uint256 templateId) external onlyOwner {
        require(templateId > 0 && templateId <= templateCounter, "ProposalManager: invalid template");
        templates[templateId].active = false;
    }
    
    function getTemplate(uint256 templateId) external view returns (
        string memory name,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bool active
    ) {
        require(templateId > 0 && templateId <= templateCounter, "ProposalManager: invalid template");
        ProposalTemplate storage template = templates[templateId];
        
        return (
            template.name,
            template.description,
            template.targets,
            template.values,
            template.calldatas,
            template.active
        );
    }
}