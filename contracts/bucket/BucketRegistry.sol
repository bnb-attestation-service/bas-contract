// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IBucketManager} from "./IBucketManager.sol";


contract BucketRegistry is Initializable,AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    event ChangeContorller(address indexed manager, address indexed new_controller);
    event CreateBucket(address indexed manager, string name,uint256 id);

    using EnumerableSet for EnumerableSet.AddressSet;
    modifier isBucketManager() {
        require(registedBuckeManageContracts.contains(msg.sender),"Caller is not a bucket manager contract");
        _;
    }

    //map user  => bucket manage contracts
    mapping(address => EnumerableSet.AddressSet) private controllers;

    //created bucket name => bucket Id
    mapping(string => uint256) public bucketsNames;
    EnumerableSet.AddressSet private registedBuckeManageContracts;
    
    address public bucketFactory;
    function initialize() public initializer {
        // bucketManageInterfaceId = type(IBucketManager).interfaceId;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bucketFactory = address(0);
    }

    function setBucketFactory(address newBucketFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(OPERATOR_ROLE, bucketFactory);
        _grantRole(OPERATOR_ROLE, newBucketFactory);
        bucketFactory = newBucketFactory;
    }

    function addBucketManager(address bucketManager) external onlyRole(OPERATOR_ROLE) {
        registedBuckeManageContracts.add(bucketManager);
    }

    function existBucketName(string memory bucketName) external view returns (bool){
        return bucketsNames[bucketName] != 0;
    }

    function setBucketName(string memory bucketName,uint256  bucketId) external isBucketManager{
        require (bucketsNames[bucketName] == 0,"The bucket name has registered");
        bucketsNames[bucketName] = bucketId;
        emit CreateBucket(msg.sender,bucketName,bucketId);
    }

    function updateController(address preController, address  newController) external isBucketManager{
        if (controllers[preController].contains(msg.sender)) {
            controllers[preController].remove(msg.sender);
        }
        controllers[newController].add(msg.sender);
        emit ChangeContorller(msg.sender,newController);
    }   

    function getBucketManagers(address controller) public view returns (address[] memory) {
        return controllers[controller].values();
    }

    function getBucketManagerAt(address controller, uint256 index)  public view returns (address) {
        return controllers[controller].at(index);
    }

    function controlled(address controller, address manager) public view returns (bool) {
        return controllers[controller].contains(manager);
    }

    function controlledManagerAmount(address controller) public view returns (uint256) {
        return controllers[controller].length();
    }

    function registeredManagerAmount() public view returns (uint256) {
        return registedBuckeManageContracts.length();
    }

    function getRegisteredManagers() public view returns (address[] memory) {
        return registedBuckeManageContracts.values();
    }

    function getRegisteredManagerAt(uint256 index) public view returns (address) {
        return registedBuckeManageContracts.at(index);
    }

    function registered(address manager)public view returns (bool) {
        return registedBuckeManageContracts.contains(manager);
    }
}