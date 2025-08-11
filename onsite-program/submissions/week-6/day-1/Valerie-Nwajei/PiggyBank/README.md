# Classwork
Piggy bank has to allow creation of multiple accounts
- need a factory that users can also call to create an account
- enum for account type?
- 2 contracts: one as the main factory, one for users to create new accounts (would manage function logic based on account type using "if")
- factory should include getBalanceOf each user address( we have addresses mapped to accounts in the factory contract)
- only owner can call balance of each user. users should only be able to see their own balance
- mapping of address to how many accounts they have
- Include lock periods for each account(not sure how to do this)
- breaking fee for lock period...
- code update : separate functions into interface, use custom errors, write tests.