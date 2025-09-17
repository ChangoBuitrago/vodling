// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEigenLayer {
    function stake(uint256 amount) external returns (uint256 shares);
    function unstake(uint256 shares) external returns (uint256 amount);
    function getSharesValue(uint256 shares) external view returns (uint256 value);
    function getTotalValue() external view returns (uint256);
    function getUserValue(address user) external view returns (uint256);
    function getUserRewards(address user) external view returns (uint256);
    function updateRewards() external;
    function fastForwardTime(uint256 _seconds) external;
    function generateYield(uint256 _days) external;
    function totalStaked() external view returns (uint256);
    function userStaked(address user) external view returns (uint256);
}
