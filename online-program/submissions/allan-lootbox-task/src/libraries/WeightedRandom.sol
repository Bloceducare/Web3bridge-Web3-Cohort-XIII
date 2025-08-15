// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WeightedRandom
 * @dev Library for weighted random selection with gas optimization
 * @notice This library implements an efficient weighted random selection algorithm
 *         using cumulative weights and binary search for O(log n) complexity
 */
library WeightedRandom {
    /**
     * @dev Error thrown when weights array is empty
     */
    error EmptyWeights();
    
    /**
     * @dev Error thrown when random value is out of bounds
     */
    error InvalidRandomValue();

    /**
     * @dev Struct to store cumulative weight data for efficient selection
     */
    struct WeightedData {
        uint256[] cumulativeWeights;
        uint256 totalWeight;
    }

    /**
     * @dev Prepares weighted data for efficient random selection
     * @param weights Array of weights for each option
     * @return weightedData Struct containing cumulative weights and total weight
     * @notice This function should be called once to prepare data for multiple selections
     */
    function prepareWeights(uint256[] memory weights) 
        internal 
        pure 
        returns (WeightedData memory weightedData) 
    {
        if (weights.length == 0) revert EmptyWeights();
        
        weightedData.cumulativeWeights = new uint256[](weights.length);
        uint256 cumulative = 0;
        
        for (uint256 i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            weightedData.cumulativeWeights[i] = cumulative;
        }
        
        weightedData.totalWeight = cumulative;
    }

    /**
     * @dev Selects a random index based on weights using binary search
     * @param weightedData Pre-computed weighted data
     * @param randomValue Random value from 0 to totalWeight-1
     * @return selectedIndex The selected index based on weighted probability
     * @notice Uses binary search for O(log n) complexity
     */
    function selectWeightedIndex(
        WeightedData memory weightedData,
        uint256 randomValue
    ) internal pure returns (uint256 selectedIndex) {
        if (randomValue >= weightedData.totalWeight) revert InvalidRandomValue();
        
        // Binary search for the selected index
        uint256 left = 0;
        uint256 right = weightedData.cumulativeWeights.length - 1;
        
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (weightedData.cumulativeWeights[mid] <= randomValue) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        return left;
    }

    /**
     * @dev One-shot weighted random selection (less gas efficient for multiple calls)
     * @param weights Array of weights for each option
     * @param randomValue Random value
     * @return selectedIndex The selected index based on weighted probability
     * @notice Use this for single selections, use prepareWeights + selectWeightedIndex for multiple
     */
    function selectWeighted(
        uint256[] memory weights,
        uint256 randomValue
    ) internal pure returns (uint256 selectedIndex) {
        WeightedData memory weightedData = prepareWeights(weights);
        uint256 normalizedRandom = randomValue % weightedData.totalWeight;
        return selectWeightedIndex(weightedData, normalizedRandom);
    }

    /**
     * @dev Calculates the probability of each option given weights
     * @param weights Array of weights
     * @return probabilities Array of probabilities (scaled by 10000 for precision)
     * @notice Returns probabilities as basis points (1/10000)
     */
    function calculateProbabilities(uint256[] memory weights)
        internal
        pure
        returns (uint256[] memory probabilities)
    {
        if (weights.length == 0) revert EmptyWeights();
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }
        
        probabilities = new uint256[](weights.length);
        for (uint256 i = 0; i < weights.length; i++) {
            // Calculate probability as basis points (out of 10000)
            probabilities[i] = (weights[i] * 10000) / totalWeight;
        }
    }

    /**
     * @dev Validates that weights sum to expected total
     * @param weights Array of weights to validate
     * @param expectedTotal Expected sum of all weights
     * @return isValid True if weights sum to expected total
     */
    function validateWeights(
        uint256[] memory weights,
        uint256 expectedTotal
    ) internal pure returns (bool isValid) {
        uint256 actualTotal = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            actualTotal += weights[i];
        }
        return actualTotal == expectedTotal;
    }
}
