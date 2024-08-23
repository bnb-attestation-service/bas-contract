// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IBucketManager} from "./IBucketManager.sol";


contract BucketRegistry is Initializable,AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    using EnumerableSet for EnumerableSet.AddressSet;
    modifier isBucketManager() {
        require(registedBuckeManageContracts.contains(msg.sender),"Caller is not a bucket manager contract");
        _;
    }

    //map user  => bucket manage contracts
    mapping(address => EnumerableSet.AddressSet) private controllers;

    //created bucket name
    mapping(string => bool) public bucketsNames;

    EnumerableSet.AddressSet private registedBuckeManageContracts;
    
    address public bucketFactory;
    function initialize() public initializer {
        // bucketManageInterfaceId = type(IBucketManager).interfaceId;
        bucketFactory = address(0);
    }

    function setBucketFactory(address newBucketFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(OPERATOR_ROLE, bucketFactory);
        grantRole(OPERATOR_ROLE, newBucketFactory);
        bucketFactory = newBucketFactory;
    }

    function addBucketManager(address bucketManager) external onlyRole(OPERATOR_ROLE) {
        registedBuckeManageContracts.add(bucketManager);
    }

    function existBucketName(string memory bucketName) external view returns (bool){
        return bucketsNames[bucketName];
    }
    function setBucketName(string memory bucketName) external isBucketManager{
        require (!bucketsNames[bucketName],"The bucket name has registered");
        bucketsNames[bucketName] = true;
    }
    function updateController(address preController, address  newController) external isBucketManager{
        if (controllers[preController].contains(msg.sender)) {
            controllers[preController].remove(msg.sender);
        }
        controllers[newController].add(msg.sender);
    }   

    function getBucketManagers() public view returns (address[] memory) {
        // registedBuckeManageContracts.at(set, index);

    }
}