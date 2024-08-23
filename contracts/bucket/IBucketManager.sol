// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IBucketManager {
    function _createSchemaBucket(
		string memory name,
		bytes32 schemaId, 
		uint256 transferOutAmount,
		bytes memory _executorData
	) external payable;

    function createUserBucket(
        uint256 transferOutAmount,
        bytes memory _executorData
    ) external payable;

    function createSchemaPolicy(
        string memory name,
        bytes32 schemaId, 
        bytes memory createPolicyData
    ) external payable;

    function createUserPolicy(bytes memory createPolicyData) external payable;
    function topUpBNB(uint256 transferOutAmount) external payable;
}
