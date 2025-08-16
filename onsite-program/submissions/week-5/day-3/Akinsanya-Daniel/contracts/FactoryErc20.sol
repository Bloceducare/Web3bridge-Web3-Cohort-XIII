// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./Erc20.sol";


contract FactoryErc20{

    address[] allContracts;


    function createContract(uint256 _initial_Amount,string memory _name,string memory _symbol,uint256 _decimals,address owner)external{
        owner = msg.sender;
        Erc20 new_Erc20 = new Erc20(_initial_Amount,_name,_symbol,_decimals,owner);
        allContracts.push(address(new_Erc20));
 }

   
   function getAllContract()external view returns(address [] memory){
    return allContracts;
   }



}