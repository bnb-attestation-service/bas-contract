import  {ethers,upgrades} from "hardhat";
import  {Passport__factory} from "../typechain-types/factories/contracts/Passport.sol"
import {AttestationRequestStruct} from "../typechain-types/contracts/Passport.sol/Passport"
import {BucketManager__factory} from  "../typechain-types/factories/contracts/bucket/BucketManager.sol";
import {BucketFactory__factory} from  "../typechain-types/factories/contracts/bucket/BucketFactory.sol";
import {BucketRegistry__factory} from  "../typechain-types/factories/contracts/bucket";


import { ExecutorMsg } from '@bnb-chain/bsc-cross-greenfield-sdk';
import { Policy } from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/types';
import { Client, MsgAttestTypeUrl } from '@bnb-chain/greenfield-js-sdk';

import { ResourceType } from '@bnb-chain/greenfield-cosmos-types/greenfield/resource/types';

import  {SCHEMAS,getSchemaUID,NO_EXPIRATION,ZERO_BYTES32,EIP712_BNB_DOMAIN_NAME} from "./utils";
import { AbiCoder }  from "ethers";

import initSchema from "./3-initSchema";
import deployRegistry from "./1-registrySchema";
import deployEAS from "./2-eas";

import {
    ActionType,
    Effect,
    PrincipalType,
 } from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/common';

//bsc testnet
const TOKEN_HUB = "0xED8e5C546F84442219A5a987EE1D820698528E04";
const CROSS_CHAIN = "0xa5B2c9194131A4E0BFaCbF9E5D6722c873159cb7";
const BUCKET_HUB = "0x5BB17A87D03620b313C39C24029C94cB5714814A";
const PERMISSION_HUB = "0x25E1eeDb5CaBf288210B132321FBB2d90b4174ad";
const SP_ADDRESS_TESTNET = "0x1eb29708f59f23fe33d6f1cd3d54f07636ff466a";
const GREENFIELD_EXECUTOR = "0x3E3180883308e8B4946C9a485F8d91F8b15dC48e";
const SCHEMA_REGISTRY = "0x08C8b8417313fF130526862f90cd822B55002D72"

const callbackGasLimit = 200000n
const failureHandleStrategy = 2


async function mintPassport(passportAddr:string,schemaId :string,to:string,revocable:boolean,createBucketFee:bigint,attestationType:bigint,invite_code: bigint) {
    const [signer] = await ethers.getSigners();
    const passport = Passport__factory.connect(passportAddr,signer)


    const attestionRequest: AttestationRequestStruct = {
        schema:schemaId,
        data:{
            recipient:to,
            expirationTime:NO_EXPIRATION,
            revocable,
            refUID:ZERO_BYTES32,
            data:AbiCoder.defaultAbiCoder().encode(['bool'], [true]),
            value:0
        }
    }
    const resp = await passport.mintPassport(attestionRequest,attestationType,invite_code,{value: createBucketFee});
    resp.wait()
    console.log(`mint passport at tx ${resp.hash}`)
}

async function getPassportInfo(passportAddr:string) {
    const [signer] = await ethers.getSigners();
    const passport = Passport__factory.connect(passportAddr,signer)
    const createBucketFee = await passport.createBucketFee()
    const bank = await passport.bank()
    console.log(`create bucket fee: ${createBucketFee}, bank balance: ${bank}`)
}

async function deployVerifier(bas: string, name: string) {
    const [signer] = await ethers.getSigners()
    const EIP712 = await ethers.getContractFactory("EIP712Proxy",signer)
    const eip712 = await EIP712.deploy(bas,name)
    await eip712.waitForDeployment()
    const addr = await eip712.getAddress()
    console.log('Verifier Contract Address:', addr)
    return addr
}

async function deployPassport(bas:string,createBucketFee: bigint,passportSchema:string, verifier: string,factoryAddr: string) {
    const [signer] = await ethers.getSigners()
    const Passport = await ethers.getContractFactory("Passport",signer)
    const passport = await upgrades.deployProxy(Passport,[
        bas,createBucketFee,passportSchema,verifier,factoryAddr
    ])
    await passport.waitForDeployment()
    const addr = await passport.getAddress()
    console.log('Passport Contract Address:', addr)
    return addr
}

async function deployAttestorResolver(bas:string,attestor:string) {
    const [signer] = await ethers.getSigners();
    // console.log('Deploy point contract with account:',signer.address);

    const Resolver =  await ethers.getContractFactory("AttestorResolver",signer);
    const resolver = await upgrades.deployProxy(Resolver,[
       bas,attestor
    ]);
    await resolver.waitForDeployment();
    const addr = await resolver.getAddress();
    console.log('Point Resolver Contract Address:', addr)
    return addr
}

async function setMintFee(passportAddr : string,taskSchemaIds:string[],mintFees: bigint[],attestors: string[]) {
    const [signer] = await ethers.getSigners();

    const passport = Passport__factory.connect(passportAddr,signer)
    const resp = await passport.setMintFees(taskSchemaIds,mintFees,attestors)
    await resp.wait()
    console.log(`set mint fee in tx ${resp.hash}`);
}

async function setInviteCode(passportAddr : string,inviteCodes:bigint[],discounts: bigint[]) {
    const [signer] = await ethers.getSigners();

    const passport = Passport__factory.connect(passportAddr,signer)
    const resp = await passport.setInviteCode(inviteCodes,discounts)
    await resp.wait()
    console.log(`set invite code in tx ${resp.hash}`);
}

async function setPassportSchema(passportAddr : string,schemaId:string) {
    const [signer] = await ethers.getSigners();
    // console.log('Update Task Point with account:',signer.address);
    const passport = Passport__factory.connect(passportAddr,signer)
    const resp = await passport.setPassport(schemaId)
    await resp.wait()
    console.log(`set passport schema in tx ${resp.hash}`);
}

function getSchemaIdAndPoint(resolver: string) {
    var schemaIds = new Array()
    var points = new Array()
    var validators = new Array()
    for (const {schema,point,validator} of SCHEMAS) {
        schemaIds.push(getSchemaUID(schema,resolver,true))
        points.push(BigInt(point))
        validators.push(validator)
    }
    return [schemaIds, points,validators]
}

async function deployFactory(bucketRegistry: string) {
    const [signer] = await ethers.getSigners();
    const Factory =  await ethers.getContractFactory("BucketFactory",signer);

    const factory = await upgrades.deployProxy(Factory,[
        bucketRegistry,
        SCHEMA_REGISTRY,
        TOKEN_HUB,
        CROSS_CHAIN,
        BUCKET_HUB,
        PERMISSION_HUB,
        GREENFIELD_EXECUTOR,
    ])
    await factory.waitForDeployment()
    const addr = await factory.getAddress();
    console.log('Bucket Factory Address:', addr)
    return addr
}

async function deployBucketManager(passportAddr: string,factoryAddr: string,salt: string, _transferOutAmt: string) {
    const [signer] = await ethers.getSigners();
    
    const factory = BucketFactory__factory.connect(factoryAddr,signer)
    const passport = Passport__factory.connect(passportAddr,signer)

    const CROSS_CHAIN = await factory.cross_chain();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();

    const transferOutAmt = ethers.parseEther(_transferOutAmt);

    const _bucketManager = await factory.getManagerAddress(salt);
    const value = transferOutAmt + relayFee + ackRelayFee;
    if (transferOutAmt == 0n) {
        const resp = await passport.deployManager(transferOutAmt,salt);
        await resp.wait();
        console.log(`create bucket manager contract in tx ${resp.hash}`);
    } else{
        const resp = await passport.deployManager(transferOutAmt,salt,{value});
        await resp.wait();
        console.log(`create bucket manager contract in tx ${resp.hash}`);
    }

    console.log("deploy manager:", _bucketManager)
    return _bucketManager
}

async function createBucket(passportAddr:string, bucketManagerAddr: string, name: string, schemaId:string) {
    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);

    const [signer] = await ethers.getSigners();
    const bucketManager = BucketManager__factory.connect(bucketManagerAddr, signer)
    const passport = Passport__factory.connect(passportAddr,signer)

    const CROSS_CHAIN = await bucketManager.cross_chain();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();

    const gasPrice =  5_000_000_000n;
    const bucketName = await bucketManager.getName(name,schemaId)

    const dataSetBucketFlowRateLimit = ExecutorMsg.getSetBucketFlowRateLimitParams({
        bucketName:bucketName,
        bucketOwner: bucketManagerAddr,
        operator: bucketManagerAddr,
        paymentAddress: bucketManagerAddr,
        flowRateLimit: '100000000000000000',
    });

    const executorData = dataSetBucketFlowRateLimit[1];
    const value = 2n * relayFee + ackRelayFee + callbackGasLimit * gasPrice

    console.log('- create bucket', bucketName);
    console.log('send crosschain tx!');
    const resp1 = await (await passport.createBucket(
        bucketManagerAddr,
        name,
        schemaId, 
        executorData, 
        callbackGasLimit,
        failureHandleStrategy,
        SP_ADDRESS_TESTNET,
        {value: value })).wait();
    console.log(`https://testnet.bscscan.com/tx/${resp1?.hash}`);

    console.log('waiting for bucket created..., about 1 minute');
    await sleep(60); // waiting bucket created

    const schemaBucketInfo = await client.bucket.getBucketMeta({ bucketName:bucketName });
    const schemaBucketId = schemaBucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;

    console.log('bucket created, bucket id', schemaBucketId);
    const schemaHexBucketId = `0x000000000000000000000000000000000000000000000000000000000000${BigInt(
        schemaBucketId
    ).toString(16)}`;
    console.log(`https://testnet.greenfieldscan.com/bucket/${schemaHexBucketId}`);
}


async function createPolicy(passportAddr:string, bucketManagerAddr: string ,eoa : string, name: string, schemaId:string) {
    const [signer] = await ethers.getSigners();
    const bucketManager = BucketManager__factory.connect(bucketManagerAddr, signer)
    const passport = Passport__factory.connect(passportAddr,signer)

    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);
     
    const bucketName = await bucketManager.getName(name,schemaId);
    const bucketInfo = await client.bucket.getBucketMeta({ bucketName });
    const bucketId = bucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;

    const CROSS_CHAIN = await bucketManager.cross_chain();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();

    const gasPrice =  10_000_000_000n;
    const value = relayFee + ackRelayFee + callbackGasLimit * gasPrice

    const policyDataToAllowUserOperateBucket = Policy.
     encode({
        id: '0',
        resourceId: bucketId, 
        resourceType: ResourceType.RESOURCE_TYPE_BUCKET,
        statements: [
            {
                effect: Effect.EFFECT_ALLOW,
                actions: [
                    ActionType.ACTION_CREATE_OBJECT,
                    ActionType.ACTION_GET_OBJECT,
                    ActionType.ACTION_LIST_OBJECT
                ], 
                resources: [],
            },
        ],
        principal: {
            type: PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
            value: eoa,
        },
    }).finish();

    const resp =  await bucketManager.createPolicy(
        name,
        schemaId,
        policyDataToAllowUserOperateBucket,
        callbackGasLimit,
        failureHandleStrategy,
        {value})
    console.log(`https://testnet.bscscan.com/tx/${resp?.hash}`);

    console.log(
        `policy set success, ${eoa} could create object ${bucketName} (id: ${bucketId}) now on Greenfield`
    );
    return ethers.keccak256(policyDataToAllowUserOperateBucket)
}

async function setFactoryAddressForRegistry(_registry: string,_factory:string) {
    const [signer] = await ethers.getSigners();
    const registry = BucketRegistry__factory.connect(_registry,signer)
    const resp = await registry.setBucketFactory(_factory);
    await resp.wait()
    console.log(`set bucket factory address to ${_factory} in tx ${resp.hash}`);
}

async function topUpBNB(_bucketManager:string,_amount: string) {
    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);

    const [signer] = await ethers.getSigners();
    const bucketManager = BucketManager__factory.connect(_bucketManager, signer)

    const CROSS_CHAIN = await bucketManager.cross_chain();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));

    console.log(`cross chain ${CROSS_CHAIN}`)
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();


    const tokenHub = await bucketManager.tokenHub()
    console.log(`token hub ${tokenHub}`)

    const amount = ethers.parseEther(_amount);

    const value = relayFee + ackRelayFee  + amount
    console.log(relayFee,ackRelayFee,amount)

    const balance = await ethers.provider.getBalance(signer.address);
    console.log(balance)

    const resp = await bucketManager.topUpBNB(amount,{value})
    resp.wait()
    console.log(`top up is at tx ${resp.hash}`)
}


async function sleep(seconds: number) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}


async function main() {
    const [signer] = await ethers.getSigners();

    //localhost
    // const registry = await deployRegistry()
    // const bas = await deployEAS(registry)
    // const createBucketFee = 1000n

    // const verifier = await deployVerifier(bas,EIP712_BNB_DOMAIN_NAME)

    // const passport = await deployPassport(bas,createBucketFee,ZERO_BYTES32,verifier)

    // const resolver = await deployAttestorResolver(bas,passport)
    // await initSchema(registry,resolver,true)

    // const [schemaIds, points, validator] = getSchemaIdAndPoint(resolver)
    // await setPassportSchema(passport,schemaIds[0])

    // const invite_codes  = [1n,2n]
    // await setInviteCode(passport,invite_codes,[3n,6n])

    // await mintPassport(passport,schemaIds[0],signer.address,false,createBucketFee,1n,invite_codes[0])


    //bsc testnet
    console.log('Deploy contract with account:',signer.address);
    
    const registry = "0x08C8b8417313fF130526862f90cd822B55002D72"
    const bas = "0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD"
    const bucketRegistry = "0x7540304c2C017f6441b5425f4d5E4B70e21171E8"

    // const factory = await deployFactory(bucketRegistry)
    const factory = "0x3c152ce86EA00F1CA3d94D44F6bd0B1cd5613565"

    // await setFactoryAddressForRegistry(bucketRegistry,factory)

    const createBucketFee = 1000n

    // const verifier = await deployVerifier(bas,EIP712_BNB_DOMAIN_NAME)
    const verifier = "0x14Cd63ff4501fdE53647b81519916cc52456a31B"

    // const passport = await deployPassport(bas,createBucketFee,ZERO_BYTES32,verifier,factory)
    const passport = "0x5902bDA1691EEdc44335B06C7c152b7e2E352594"

    // const resolver = await deployAttestorResolver(bas,passport)
    const resolver = "0xfBcc5d0a58a866c66a4523f6369dd16DFE658236"
    // await initSchema(registry,resolver,true)

    const [schemaIds, points, validator] = getSchemaIdAndPoint(resolver)
    // await setPassportSchema(passport,schemaIds[0])

    const invite_codes  = [1n,2n]
    // await setInviteCode(passport,invite_codes,[3n,6n])

    const salt = ethers.hashMessage("1")
    // const manager = await deployBucketManager(passport,factory,salt,"0.001")
    // const manager = "0xDc062208B652731cf62De88DcE88a65C555d94b6"
    const manager = "0x93d2fFFbCE2d061A8E88E0d01236136FAf7859B9"

    // await mintPassport(passport,schemaIds[0],signer.address,false,createBucketFee,1n,invite_codes[0])
    // await topUpBNB(manager,"0.001")
    const name = "bascan"
    await createBucket(passport,manager,name,ZERO_BYTES32)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


