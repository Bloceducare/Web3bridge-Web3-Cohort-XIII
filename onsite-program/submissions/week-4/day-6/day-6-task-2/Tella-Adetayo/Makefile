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
deploy-sepolia:
	npx hardhat ignition deploy ./ignition/modules/ERC20.ts --network lisk-sepolia

# Deploy contracts to localhost
deploy-localhost:
	npx hardhat ignition deploy ./ignition/modules/ERC20.ts --network localhost

verify-sepolia:
	npx hardhat ignition deploy ignition/modules/ERC20.ts --network lisk-sepolia --verify

# Lint with ESLint 
lint: 
	npx eslint