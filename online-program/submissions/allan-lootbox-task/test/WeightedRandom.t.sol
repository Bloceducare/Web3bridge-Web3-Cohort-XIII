// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/WeightedRandom.sol";

/**
 * @title WeightedRandomTest
 * @dev Test suite for the WeightedRandom library
 */
contract WeightedRandomTest is Test {
    using WeightedRandom for uint256[];

    function testPrepareWeights() public {
        uint256[] memory weights = new uint256[](3);
        weights[0] = 50;
        weights[1] = 30;
        weights[2] = 20;

        WeightedRandom.WeightedData memory data = WeightedRandom.prepareWeights(weights);
        
        assertEq(data.totalWeight, 100);
        assertEq(data.cumulativeWeights[0], 50);
        assertEq(data.cumulativeWeights[1], 80);
        assertEq(data.cumulativeWeights[2], 100);
    }

    function testSelectWeightedIndex() public {
        uint256[] memory weights = new uint256[](3);
        weights[0] = 50;
        weights[1] = 30;
        weights[2] = 20;

        WeightedRandom.WeightedData memory data = WeightedRandom.prepareWeights(weights);
        
        // Test selection of first item (0-49)
        assertEq(WeightedRandom.selectWeightedIndex(data, 0), 0);
        assertEq(WeightedRandom.selectWeightedIndex(data, 25), 0);
        assertEq(WeightedRandom.selectWeightedIndex(data, 49), 0);
        
        // Test selection of second item (50-79)
        assertEq(WeightedRandom.selectWeightedIndex(data, 50), 1);
        assertEq(WeightedRandom.selectWeightedIndex(data, 65), 1);
        assertEq(WeightedRandom.selectWeightedIndex(data, 79), 1);
        
        // Test selection of third item (80-99)
        assertEq(WeightedRandom.selectWeightedIndex(data, 80), 2);
        assertEq(WeightedRandom.selectWeightedIndex(data, 90), 2);
        assertEq(WeightedRandom.selectWeightedIndex(data, 99), 2);
    }

    function testSelectWeighted() public {
        uint256[] memory weights = new uint256[](4);
        weights[0] = 40;
        weights[1] = 30;
        weights[2] = 20;
        weights[3] = 10;

        // Test various random values
        assertEq(WeightedRandom.selectWeighted(weights, 0), 0);
        assertEq(WeightedRandom.selectWeighted(weights, 39), 0);
        assertEq(WeightedRandom.selectWeighted(weights, 40), 1);
        assertEq(WeightedRandom.selectWeighted(weights, 69), 1);
        assertEq(WeightedRandom.selectWeighted(weights, 70), 2);
        assertEq(WeightedRandom.selectWeighted(weights, 89), 2);
        assertEq(WeightedRandom.selectWeighted(weights, 90), 3);
        assertEq(WeightedRandom.selectWeighted(weights, 99), 3);
    }

    function testSelectWeightedWithModulo() public {
        uint256[] memory weights = new uint256[](2);
        weights[0] = 70;
        weights[1] = 30;

        // Test with large random values (should use modulo)
        assertEq(WeightedRandom.selectWeighted(weights, 1000), 0); // 1000 % 100 = 0
        assertEq(WeightedRandom.selectWeighted(weights, 1075), 1); // 1075 % 100 = 75
    }

    function testCalculateProbabilities() public {
        uint256[] memory weights = new uint256[](4);
        weights[0] = 50;
        weights[1] = 30;
        weights[2] = 15;
        weights[3] = 5;

        uint256[] memory probabilities = WeightedRandom.calculateProbabilities(weights);
        
        assertEq(probabilities[0], 5000); // 50% = 5000 basis points
        assertEq(probabilities[1], 3000); // 30% = 3000 basis points
        assertEq(probabilities[2], 1500); // 15% = 1500 basis points
        assertEq(probabilities[3], 500);  // 5% = 500 basis points
    }

    function testValidateWeights() public {
        uint256[] memory weights = new uint256[](3);
        weights[0] = 40;
        weights[1] = 35;
        weights[2] = 25;

        assertTrue(WeightedRandom.validateWeights(weights, 100));
        assertFalse(WeightedRandom.validateWeights(weights, 99));
        assertFalse(WeightedRandom.validateWeights(weights, 101));
    }

    function testSingleWeight() public {
        uint256[] memory weights = new uint256[](1);
        weights[0] = 100;

        assertEq(WeightedRandom.selectWeighted(weights, 0), 0);
        assertEq(WeightedRandom.selectWeighted(weights, 50), 0);
        assertEq(WeightedRandom.selectWeighted(weights, 99), 0);
    }

    function testEqualWeights() public {
        uint256[] memory weights = new uint256[](4);
        weights[0] = 25;
        weights[1] = 25;
        weights[2] = 25;
        weights[3] = 25;

        assertEq(WeightedRandom.selectWeighted(weights, 0), 0);
        assertEq(WeightedRandom.selectWeighted(weights, 24), 0);
        assertEq(WeightedRandom.selectWeighted(weights, 25), 1);
        assertEq(WeightedRandom.selectWeighted(weights, 49), 1);
        assertEq(WeightedRandom.selectWeighted(weights, 50), 2);
        assertEq(WeightedRandom.selectWeighted(weights, 74), 2);
        assertEq(WeightedRandom.selectWeighted(weights, 75), 3);
        assertEq(WeightedRandom.selectWeighted(weights, 99), 3);
    }

    function testLargeWeights() public {
        uint256[] memory weights = new uint256[](3);
        weights[0] = 1000000;
        weights[1] = 2000000;
        weights[2] = 3000000;

        WeightedRandom.WeightedData memory data = WeightedRandom.prepareWeights(weights);
        
        assertEq(data.totalWeight, 6000000);
        assertEq(WeightedRandom.selectWeightedIndex(data, 500000), 0);
        assertEq(WeightedRandom.selectWeightedIndex(data, 1500000), 1);
        assertEq(WeightedRandom.selectWeightedIndex(data, 4000000), 2);
    }

    function testZeroWeight() public {
        uint256[] memory weights = new uint256[](3);
        weights[0] = 0;
        weights[1] = 50;
        weights[2] = 50;

        assertEq(WeightedRandom.selectWeighted(weights, 0), 1);
        assertEq(WeightedRandom.selectWeighted(weights, 25), 1);
        assertEq(WeightedRandom.selectWeighted(weights, 50), 2);
        assertEq(WeightedRandom.selectWeighted(weights, 75), 2);
    }

    function testFuzzSelectWeighted(uint256 randomValue) public {
        uint256[] memory weights = new uint256[](5);
        weights[0] = 20;
        weights[1] = 20;
        weights[2] = 20;
        weights[3] = 20;
        weights[4] = 20;

        uint256 selected = WeightedRandom.selectWeighted(weights, randomValue);
        
        // Should always select a valid index
        assertTrue(selected < 5);
    }

    function testFuzzPrepareWeights(uint256[] memory weights) public {
        vm.assume(weights.length > 0);
        vm.assume(weights.length <= 100); // Reasonable limit for gas
        
        // Ensure no weight is too large to avoid overflow
        for (uint256 i = 0; i < weights.length; i++) {
            vm.assume(weights[i] <= type(uint128).max);
        }

        WeightedRandom.WeightedData memory data = WeightedRandom.prepareWeights(weights);
        
        // Verify cumulative weights are monotonically increasing
        for (uint256 i = 1; i < data.cumulativeWeights.length; i++) {
            assertTrue(data.cumulativeWeights[i] >= data.cumulativeWeights[i-1]);
        }
        
        // Verify total weight equals last cumulative weight
        assertEq(data.totalWeight, data.cumulativeWeights[data.cumulativeWeights.length - 1]);
    }
}
