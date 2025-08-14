#!/bin/bash

# This script updates the perUnitAmounts in the test file to account for ERC20 decimals

# Define the path to the test file
TEST_FILE="/home/jvcbyte/Downloads/web3bridge_xiii/onchain_mystery_box/test/LootBox.t.sol"

# Create a backup of the original file
cp "$TEST_FILE" "${TEST_FILE}.bak"

# Update the perUnitAmounts to account for ERC20 decimals (18 decimals)
sed -i 's/perUnitAmounts = \[10, 1, 5\];/perUnitAmounts = [10 * 10**18, 1, 5];/' "$TEST_FILE"

echo "Test file updated successfully. Original file backed up as ${TEST_FILE}.bak"
