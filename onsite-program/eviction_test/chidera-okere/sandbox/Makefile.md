# Makefile for Hardhat + Ignition Projects

install:
npm install

compile:
npx hardhat compile

test:
npx hardhat test

deploy-liskTestnet:
npx hardhat ignition deploy ./ignition/modules/Lock.ts --network liskTestnet --deployment-id sepolia-deployment

node:
npx hardhat node

clean:
rm -rf artifacts cache
