// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {BucketManager} from "./BucketManager.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


interface IBucketRegistry {
   function addBucketManager(address bucketManager) external;
}
contract BucketFactory is Initializable{
    event CreateBucketManager(address indexed creator, address bucketManger);

    modifier onlyOwner() {
        require(msg.sender == admin,  "Only Owner can call this function");
        _;
    }

    address public  bucketRegistry;
    address public  schemaRegistry;
    address public  tokenHub;
    address public  cross_chain;
    address public  bucket_hub;
    address public  permission_hub;
    address public  sp_address_testnet;
    address public  greenfield_executor;

    uint256 public callbackGasLimit;
    uint8   public failureHandlerStrategy;

    string public version;
    address public admin;
    

    function initialize(
        address _bucketRegistry,
        address _schemaRegistry,
        address _tokenHub,
        address _cross_chain,
        address _bucket_hub,
        address _permission_hub,
        address _greenfield_executor

    ) public initializer{
        bucketRegistry = _bucketRegistry;
        schemaRegistry = _schemaRegistry;
        tokenHub = _tokenHub;
        cross_chain = _cross_chain;
        bucket_hub = _bucket_hub;
        permission_hub = _permission_hub;
        greenfield_executor = _greenfield_executor;

        admin = msg.sender;
    }

    function deploy(
        uint256 transferOutAmount,
        bytes32 _salt
    ) public payable
      returns(address)
    {   
        address managerAddr = getManagerAddress(_salt);
        IBucketRegistry(bucketRegistry).addBucketManager(managerAddr);
        
        BucketManager bucketManager =  new BucketManager{salt:_salt}
        (
            msg.sender,
            bucketRegistry,
            schemaRegistry,
            tokenHub,
            cross_chain,
            bucket_hub,
            permission_hub,
            greenfield_executor,
            version
        );
        emit CreateBucketManager(msg.sender, address(bucketManager));
        if (transferOutAmount > 0) {
            bucketManager.topUpBNB{value:msg.value}(transferOutAmount);
        }
        return address(bucketManager);
    }

    function _getBytecodeHash() internal view returns (bytes32) {
        bytes memory bytecode = type(BucketManager).creationCode;
        return keccak256(abi.encodePacked(bytecode, abi.encode(
            msg.sender,
            bucketRegistry,
            schemaRegistry,
            tokenHub,
            cross_chain,
            bucket_hub,
            permission_hub,
            greenfield_executor,
            version)));
    }

    function getManagerAddress(bytes32 _salt) public view returns (address) {
    bytes32 addrHash = keccak256(abi.encodePacked(
        bytes1(0xff), 
        address(this), 
        _salt, 
        _getBytecodeHash() 
    ));
    return address(uint160(uint(addrHash)));    
    }
}