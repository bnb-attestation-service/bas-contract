// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IBucketManager {
    function topUpBNB(uint256 transferOutAmount) external payable;
}
