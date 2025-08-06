.PHONY: test compile clean deploy-sepolia deploy-localhost lint

# Run Hardhat tests
test: 
	npx hardhat test 

# Compile contracts 
compile: 
	npx hardhat compile 

# Clean artifacts and cache 
clean: 
	npx hardhat clean

# Deploy contracts to sepolia 
deploy-sepolia-todo:
	npx hardhat ignition deploy ./ignition/modules/Todo.ts --network lisk-sepolia

deploy-sepolia-sms:
	npx hardhat ignition deploy ./ignition/modules/SMS.ts --network lisk-sepolia

# Deploy contracts to localhost
deploy-localhost-todo:
	npx hardhat ignition deploy ./ignition/modules/Todo.ts --network localhost

deploy-localhost-sms:
	npx hardhat ignition deploy ./ignition/modules/SMS.ts --network localhost

verify-sepolia-todo:
	npx hardhat ignition deploy ignition/modules/Todo.ts --network lisk-sepolia --verify

verify-sepolia-sms:
	npx hardhat ignition deploy ignition/modules/SMS.ts --network lisk-sepolia --verify

# Lint with ESLint 
lint: 
	npx eslint