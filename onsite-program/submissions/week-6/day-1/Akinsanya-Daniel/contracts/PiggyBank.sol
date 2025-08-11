// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./PiggyToken.sol";

error NO_ACCOUNT_FOUND();
error NO_AMOUNT();
error CAN_ONLY_DEPOSIT_ETH();
error CAN_ONLY_DEPOSIT_ERC20TOKEN();
error NO_ACCOUNT();
error NOT_OWNER();
error CAN_ONLY_WITHDRAW_ETH();
error CAN_ONLY_WITHDRAW_ERC20TOKEN();
error LOCKED();

contract PiggyBank{
    struct Account{
        uint256 id;
        string name;
        address  owner;
        uint256 lockPeriod;
        uint256 balance;
        address tokenAddress;
        AssetType assetType;
    }

    enum AssetType{
        ETH,
        ERC20
    }

    uint256 private uid;
    address admin;


    mapping (address => uint256) balance;
    mapping (address => Account[]) userAccounts;
    mapping (uint256 => Account) userAccount;

    PiggyToken piggyToken;


      constructor(address _token, address _admin){
    
        piggyToken =  PiggyToken(_token);
        admin = _admin;
    }

        modifier onlyOwner(uint256 _accountId){
        Account memory account = userAccount[_accountId];
        require(account.owner != address(0),NO_ACCOUNT_FOUND());
        require(account.owner == msg.sender,NOT_OWNER());
        _;
     }


    function createAccount(string memory _name,AssetType _assetType,address _tokenAddress)external {
        uid = uid + 1;
        Account memory new_account;
        new_account.id = uid;
        new_account.name = _name;
        new_account.assetType = _assetType;
        new_account.tokenAddress = _assetType == AssetType.ERC20
            ? (_tokenAddress == address(0) ? address(piggyToken) : _tokenAddress)
            : address(0);
        new_account.balance = 0;
        new_account.owner = msg.sender;
        userAccount[new_account.id] = new_account;
        userAccounts[msg.sender].push(new_account);
 }


      function depositEth(uint256 _accountId,uint256 _lockPeriod) external payable onlyOwner(_accountId){
        require(msg.value > 0,NO_AMOUNT());
        Account storage account  = userAccount[_accountId];
        require(account.assetType == AssetType.ETH,CAN_ONLY_DEPOSIT_ETH());
        account.lockPeriod = block.timestamp + _lockPeriod;
        account.balance += msg.value;

}




       function depositErc20Token(uint256 _accountId, uint256 _amount,uint256 _lockPeriod)external onlyOwner(_accountId) {
          require(_amount > 0,NO_AMOUNT());
          Account storage account  = userAccount[_accountId];
          require(account.assetType == AssetType.ERC20,CAN_ONLY_DEPOSIT_ERC20TOKEN());
          piggyToken.transferFrom(msg.sender, address(this),_amount);
          account.lockPeriod = block.timestamp + _lockPeriod;
          account.balance += _amount;


    }

        function withdtrawEth(uint256 _accountId,uint256 _amount) external onlyOwner(_accountId){
            require(_amount > 0,NO_AMOUNT());
            Account storage account = userAccount[_accountId];
            require(account.assetType == AssetType.ETH, CAN_ONLY_WITHDRAW_ETH());
            uint256 fee;
            if(block.timestamp < account.lockPeriod){
                fee = (_amount * 3) / 100;
                payable (admin).transfer(fee);
            }
            payable (account.owner).transfer(_amount - fee);
            account.balance -= _amount;

        }

        function withdtrawErc20(uint256 _accountId,uint256 _amount) external onlyOwner(_accountId){
            require(_amount > 0,NO_AMOUNT());
            Account storage account = userAccount[_accountId];
            require(account.assetType == AssetType.ERC20, CAN_ONLY_WITHDRAW_ERC20TOKEN());
            uint256 fee;
            if(block.timestamp < account.lockPeriod){
                fee = (_amount * 3) / 100;
                piggyToken.transfer(admin, fee);

            }
        
            piggyToken.transfer(msg.sender, _amount - fee);
            account.balance -= _amount;

    }


       function getAccount(uint256 _accountId) external view returns(Account memory){

           return userAccount[_accountId];

       }


       function getAllAccount() external view returns(Account [] memory){
            return userAccounts[msg.sender];
       }

     
}