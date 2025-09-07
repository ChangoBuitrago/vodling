// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILido {
    function submit(address _referral) external payable returns (uint256);
    function getTotalShares() external view returns (uint256);
    function getTotalPooledEther() external view returns (uint256);
    function sharesOf(address _account) external view returns (uint256);
    function getSharesByPooledEth(uint256 _ethAmount) external view returns (uint256);
    function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256);
}
