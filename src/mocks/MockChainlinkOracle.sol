// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockChainlinkOracle
 * @dev Mock implementation of Chainlink price feed for local testing
 */
contract MockChainlinkOracle {
    int256 public latestAnswer = 2000e8; // $2000 ETH price with 8 decimals
    
    /**
     * @dev Get the latest price (mock implementation)
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1, // roundId
            latestAnswer, // answer
            block.timestamp, // startedAt
            block.timestamp, // updatedAt
            1 // answeredInRound
        );
    }
    
    /**
     * @dev Set mock price for testing
     */
    function setPrice(int256 _price) external {
        latestAnswer = _price;
    }
}
