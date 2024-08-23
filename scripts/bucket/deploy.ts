import  {ethers,upgrades} from "hardhat";
import { ExecutorMsg } from '@bnb-chain/bsc-cross-greenfield-sdk';
import { Policy } from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/types';
import { Client } from '@bnb-chain/greenfield-js-sdk';
import { ResourceType } from '@bnb-chain/greenfield-cosmos-types/greenfield/resource/types';
import {BucketRegistry__factory} from  "../../typechain-types/factories/contracts/bucket";
import {BucketFactory__factory} from  "../../typechain-types/factories/contracts/bucket/BucketFactory.sol";
import {BucketManager__factory} from  "../../typechain-types/factories/contracts/bucket/BucketManager.sol";


import {
   ActionType,
   Effect,
   PrincipalType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/common';

async function deployRegistry()  {
    const [signer] = await ethers.getSigners();
    console.log('Deploy contract with account:',signer.address);

    const Registry =  await ethers.getContractFactory("GreenfiBucketRegistry",signer);
    const registry = await upgrades.deployProxy(Registry,[]);
    await registry.waitForDeployment();
    const addr = await registry.getAddress();
    console.log('Bucket Registry Address:', addr)
    return addr
}

async function deployFactory(bucketRegistry: string) {
    const TOKEN_HUB = "0xED8e5C546F84442219A5a987EE1D820698528E04";
    const CROSS_CHAIN = "0xa5B2c9194131A4E0BFaCbF9E5D6722c873159cb7";
    const BUCKET_HUB = "0x5BB17A87D03620b313C39C24029C94cB5714814A";
    const PERMISSION_HUB = "0x25E1eeDb5CaBf288210B132321FBB2d90b4174ad";
    const SP_ADDRESS_TESTNET = "0x5FFf5A6c94b182fB965B40C7B9F30199b969eD2f";
    const GREENFIELD_EXECUTOR = "0x3E3180883308e8B4946C9a485F8d91F8b15dC48e";
    const SCHEMA_REGISTRY = ""

    const [signer] = await ethers.getSigners();
    const Factory =  await ethers.getContractFactory("BucketFactory",signer);

    const factory = await upgrades.deployProxy(Factory,[
        bucketRegistry,
        SCHEMA_REGISTRY,
        TOKEN_HUB,
        CROSS_CHAIN,
        BUCKET_HUB,
        PERMISSION_HUB,
        SP_ADDRESS_TESTNET,
        GREENFIELD_EXECUTOR
    ])
    await factory.waitForDeployment()
    const addr = await factory.getAddress();
    console.log('Bucket Factory Address:', addr)
    return addr
}

async function setFactoryAddressForRegistry(_registry: string,_factory:string) {
    const [signer] = await ethers.getSigners();
    const registry = BucketRegistry__factory.connect(_registry,signer)
    const resp = await registry.setBucketFactory(_factory);
    console.log(`set bucket factory address to ${_factory} in tx ${resp.hash}`);
}

async function deployBucketManager(_factory: string) {
    const [signer] = await ethers.getSigners();
    
    const factory = BucketFactory__factory.connect(_factory,signer)
    const salt = ethers.hashMessage("test-salt")
    const resp = await factory.deploy(salt)
    console.log(`create bucket manager contract in tx ${resp.hash}`);
}

async function createBucket(_bucketManager: string) {
    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);

    const [signer] = await ethers.getSigners();
    const bucketManager = BucketManager__factory.connect(_bucketManager, signer)

    const CROSS_CHAIN = await bucketManager.cross_chain();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();



    const userBucketName = "bas-0xacc308075dabd756f3806f0f2a0d919d12b13597ba4791de96283aa646c2c5b5"

    const userDataSetBucketFlowRateLimit = ExecutorMsg.getSetBucketFlowRateLimitParams({
        bucketName:userBucketName,
        bucketOwner: _bucketManager,
        operator: _bucketManager,
        paymentAddress: _bucketManager,
        flowRateLimit: '100000000000000000',
    });

    
    const userExecutorData = userDataSetBucketFlowRateLimit[1];
    const userTransferOutAmt = ethers.parseEther('0.01');
    const userValue = userTransferOutAmt+ relayFee *3n+ ackRelayFee*2n;

    console.log('- transfer out to demo contract on greenfield', userTransferOutAmt);
    console.log('- create user bucket', userBucketName);
    console.log('send crosschain tx!');
    const resp = await (await bucketManager.createUserBucket(userTransferOutAmt, userExecutorData, {value: userValue })).wait();
    console.log(`https://testnet.bscscan.com/tx/${resp?.hash}`);

    
     console.log('waiting for user bucket created..., about 1 minute');
     await sleep(60); // waiting bucket created
 
     const userBucketInfo = await client.bucket.getBucketMeta({ bucketName:userBucketName });
     const userBucketId = userBucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;

     console.log('usre bucket created, bucket id', userBucketId);
     const userHexBucketId = `0x000000000000000000000000000000000000000000000000000000000000${BigInt(
        userBucketId
     ).toString(16)}`;
     console.log(`https://testnet.greenfieldscan.com/bucket/${userHexBucketId}`);

    const schemaId = "0xacc308075dabd756f3806f0f2a0d919d12b13597ba4791de96283aa646c2c5b5";
    const name = "test"
    const schemaBucketName = "bas-test-0xacc308075dabd756f3806f0f2a0d919d12b13597ba4791de96283aa646c2c5b5"

    const schemaDataSetBucketFlowRateLimit = ExecutorMsg.getSetBucketFlowRateLimitParams({
        bucketName:userBucketName,
        bucketOwner: _bucketManager,
        operator: _bucketManager,
        paymentAddress: _bucketManager,
        flowRateLimit: '100000000000000000',
    });

    const schemaExecutorData = schemaDataSetBucketFlowRateLimit[1];
    const schemaTransferOutAmt = ethers.parseEther('0');
    const schemaValue = schemaTransferOutAmt+ relayFee *2n+ ackRelayFee*1n;

    console.log('- create schema bucket', userBucketName);
    console.log('send crosschain tx!');
    const resp1 = await (await bucketManager._createSchemaBucket(name,schemaId,schemaTransferOutAmt, schemaExecutorData, {value: schemaValue })).wait();
    console.log(`https://testnet.bscscan.com/tx/${resp1?.hash}`);

    console.log('waiting for user bucket created..., about 1 minute');
    await sleep(60); // waiting bucket created

    const schemaBucketInfo = await client.bucket.getBucketMeta({ bucketName:schemaBucketName });
    const schemaBucketId = schemaBucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;

    console.log('usre bucket created, bucket id', userBucketId);
    const schemaHexBucketId = `0x000000000000000000000000000000000000000000000000000000000000${BigInt(
        schemaBucketId
    ).toString(16)}`;
    console.log(`https://testnet.greenfieldscan.com/bucket/${schemaHexBucketId}`);
}

async function createPolicy(_bucketManager: string, bucketName: string, eoa : string) {
    const [signer] = await ethers.getSigners();

    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);
     
    const bucketInfo = await client.bucket.getBucketMeta({ bucketName });
    const bucketId = bucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;

    const bucketManager = BucketManager__factory.connect(_bucketManager, signer)
    const CROSS_CHAIN = await bucketManager.cross_chain();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();

    const policyDataToAllowUserOperateBucket = Policy.
     encode({
        id: '0',
        resourceId: bucketName, 
        resourceType: ResourceType.RESOURCE_TYPE_BUCKET,
        statements: [
            {
                effect: Effect.EFFECT_ALLOW,
                actions: [
                    ActionType.ACTION_CREATE_OBJECT
                ], 
                resources: [],
            },
        ],
        principal: {
            type: PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
            value: eoa,
        },
    }).finish();

    await (await bucketManager.createUserPolicy(policyDataToAllowUserOperateBucket, { value: relayFee+ackRelayFee})).wait();
    console.log(
        `policy set success, ${eoa} could read object ${bucketName} (id: ${bucketId}) now on Greenfield`
    );
}


async function sleep(seconds: number) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
