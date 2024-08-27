// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {BucketManager} from "./BucketManager.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";



interface IBucketRegistry {
   function addBucketManager(address bucketManager) external;
}
contract BucketFactory is Initializable{
    event CreateBucketManager(address indexed creator, address bucketManger);

    address public  bucketRegistry;
    address public  schemaRegistry;
    address public  tokenHub;
    address public  cross_chain;
    address public  bucket_hub;
    address public  permission_hub;
    address public  sp_address_testnet;
    address public  greenfield_executor;

    uint256 private immutable _major = 1;

    // Contract's minor version number.
    uint256 private  immutable _minor = 0;

    // Contract's patch version number.
    uint256 private  immutable _path = 0;

    /// @notice Returns the full semver contract version.
    /// @return Semver contract version as a string.
    function version() external pure returns (string memory) {
        return
            string(
                abi.encodePacked(Strings.toString(_major), ".", Strings.toString(_minor), ".", Strings.toString(_path))
            );
    }


    function initialize(
        address _bucketRegistry,
        address _schemaRegistry,
        address _tokenHub,
        address _cross_chain,
        address _bucket_hub,
        address _permission_hub,
        address _sp_address_testnet,
        address _greenfield_executor
    ) public initializer{
        bucketRegistry = _bucketRegistry;
        schemaRegistry = _schemaRegistry;
        tokenHub = _tokenHub;
        cross_chain = _cross_chain;
        bucket_hub = _bucket_hub;
        permission_hub = _permission_hub;
        sp_address_testnet = _sp_address_testnet;
        greenfield_executor = _greenfield_executor;
    }

    function deploy(
        uint256 transferOutAmount,
        bytes32 _salt
    ) public payable
      returns(address)
    {   
        BucketManager bucketManager =  new BucketManager{salt:_salt}
        (
            msg.sender,
            bucketRegistry,
            schemaRegistry,
            tokenHub,
            cross_chain,
            bucket_hub,
            permission_hub,
            sp_address_testnet,
            greenfield_executor,

            _major,
            _minor ,
            _path
        );

        IBucketRegistry(bucketRegistry).addBucketManager( address(bucketManager));
        emit CreateBucketManager(msg.sender, address(bucketManager));
        bucketManager.topUpBNB{value:msg.value}(transferOutAmount);
        return address(bucketManager);
    }
}