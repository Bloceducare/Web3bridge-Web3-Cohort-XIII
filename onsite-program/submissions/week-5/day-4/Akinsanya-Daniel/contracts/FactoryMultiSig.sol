// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;
import "./MultiSig.sol";
contract FactoryMultiSig{

    address[] allContracts;


    function createContract(address[] memory _owner,uint256 submissions)external{
        MultiSig newMultiSig = new MultiSig(_owner,submissions);
        allContracts.push(address(newMultiSig));
 }


   function getAllContract()external view returns(address [] memory){
    return allContracts;
   }



}