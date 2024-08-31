 import  {ethers} from "hardhat";
 import { ExecutorMsg } from '@bnb-chain/bsc-cross-greenfield-sdk';
 import { Policy } from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/types';
 import { Client } from '@bnb-chain/greenfield-js-sdk';
 import { ResourceType } from '@bnb-chain/greenfield-cosmos-types/greenfield/resource/types';
 import {GreenfieldDemo__factory} from  "../typechain-types/factories/contracts";
 import {
    ActionType,
    Effect,
    PrincipalType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/common';

 async function deploy() {
    const [signer] = await ethers.getSigners();
    console.log('Deploy contract with account:',signer.address);

    const Demo =  await ethers.getContractFactory("GreenfieldDemo",signer);
    const demo = await Demo.deploy();
    await demo.waitForDeployment();
    const addr = await demo.getAddress();

    console.log('greenfield demo contract address:', addr)
    return addr
 }

//  async function execute(addr:string) {
//     const [signer] = await ethers.getSigners();
//     const demo = GreenfieldDemo__factory.connect(addr,signer);

//     const CROSS_CHAIN = await demo.CROSS_CHAIN();
//     const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
//     const [relayFee, ] = await crossChain.getRelayFees();


//     const bucketName = 'test-' + addr.substring(2, 6).toLowerCase();
//     const dataSetBucketFlowRateLimit = ExecutorMsg.getSetBucketFlowRateLimitParams({
//         bucketName,
//         bucketOwner: addr,
//         operator: addr,
//         paymentAddress: signer.address,
//         flowRateLimit: '10000000000000000',
//     });
//     const executorData = dataSetBucketFlowRateLimit[1];
//     const resp = await demo.executeGreenfield(executorData,{value:relayFee});
//     console.log(`execute gf command on ${bucketName} in https://testnet.bscscan.com/tx/${resp?.hash}`);
//  }

 async function createBucket(addr:string) {
    const [signer] = await ethers.getSigners();
    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);

    const demo = GreenfieldDemo__factory.connect(addr,signer);

    const CROSS_CHAIN = await demo.CROSS_CHAIN();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();

    // 2. createBucket
    const bucketName = 'test-' + addr.substring(2, 6).toLowerCase();
    // - transferOutAmt: 0.1 BNB to demo contract on Greenfield
    // - set bucket flow rate limit to this bucket
    // - create bucket: 'test-approve-eoa-upload', its owner is demo contract
    const dataSetBucketFlowRateLimit = ExecutorMsg.getSetBucketFlowRateLimitParams({
        bucketName,
        bucketOwner: addr,
        operator: addr,
        paymentAddress: signer.address,
        flowRateLimit: '10000000000000000',
    });
    const executorData = dataSetBucketFlowRateLimit[1];
    const transferOutAmt = ethers.parseEther('0.001');
    const gasPrice =  10_000_000_000n; // 10 GWei
    const callbackGasLimit = 200_000n 
    const value = transferOutAmt + 3n * relayFee + 2n * ackRelayFee + callbackGasLimit * gasPrice;
    const failureHandleStrategy = 2

    console.log('- transfer out to demo contract on greenfield', transferOutAmt);
    console.log('- create bucket', bucketName);
    console.log('send crosschain tx!');
    const resp = await (await demo.createBucket(bucketName, transferOutAmt, executorData,callbackGasLimit, failureHandleStrategy ,{ value:value })).wait();
    console.log(`https://testnet.bscscan.com/tx/${resp?.hash}`);

     // 3. get bucket id by name
     console.log('waiting for bucket created..., about 1 minute');
     await sleep(60); // waiting bucket created
 
     const bucketInfo = await client.bucket.getBucketMeta({ bucketName });
     const bucketId = bucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;

     console.log('bucket created, bucket id', bucketId);
     const hexBucketId = `0x000000000000000000000000000000000000000000000000000000000000${BigInt(
         bucketId
     ).toString(16)}`;
     console.log(`https://testnet.greenfieldscan.com/bucket/${hexBucketId}`);
 }

 async function allocatePolicy() {
    const [signer] = await ethers.getSigners();
    const readerEoaAccount = "0xccC793c4D92f7c425Ef5C2b418b9186ad180708d";

    const bucketName = "test-47de";
    const objectName = "story3.txt";
    const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';
    const GREEN_CHAIN_ID = 'greenfield_5600-1';
    const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);
     
    const bucketInfo = await client.bucket.getBucketMeta({ bucketName });
    const bucketId = bucketInfo.body!.GfSpGetBucketMetaResponse.Bucket.BucketInfo.Id;
    // const headObject = await client.object.headObject(bucketName,objectName);
    // const objectId = headObject.objectInfo?.id??"";

    const demoAddr = "0x47DE74C9253C6D717bA93191333F91e9b1f4e1Ce"
    const demo = GreenfieldDemo__factory.connect(demoAddr,signer);

    const CROSS_CHAIN = await demo.CROSS_CHAIN();
    const crossChain = (await ethers.getContractAt('ICrossChain', CROSS_CHAIN));
    const [relayFee, ackRelayFee] = await crossChain.getRelayFees();
    const gasPrice =  10_000_000_000n; // 10 GWei
    const callbackGasLimit = 200_000n; 
    const failureHandleStrategy = 2;


    const policyDataToAllowUserOperateBucket = Policy.
     encode({
        id: '0',
        resourceId: bucketId, 
        resourceType: ResourceType.RESOURCE_TYPE_BUCKET,
        statements: [
            {
                effect: Effect.EFFECT_ALLOW,
                actions: [
                    // ActionType.ACTION_GET_OBJECT,
                    // ActionType.ACTION_UPDATE_BUCKET_INFO,
                    // ActionType.ACTION_DELETE_OBJECT,
                    // ActionType.ACTION_COPY_OBJECT,
                    // ActionType.ACTION_EXECUTE_OBJECT,
                    // ActionType.ACTION_LIST_OBJECT,
                    // ActionType.ACTION_UPDATE_GROUP_MEMBER,
                    ActionType.ACTION_TYPE_ALL
                ], 
                resources: [],
            },
        ],
        principal: {
            type: PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
            value: readerEoaAccount,
        },
    }).finish();

    await demo.createPolicy(policyDataToAllowUserOperateBucket,callbackGasLimit, failureHandleStrategy, { value: 3n * relayFee + 2n * ackRelayFee + callbackGasLimit * gasPrice});
    // console.log(
    //     `policy set success, ${readerEoaAccount} could read object ${objectName} (id: ${objectId}) now on Greenfield`
    // );
    console.log(
        `policy set success, ${readerEoaAccount} could read object ${bucketName} (id: ${bucketId}) now on Greenfield`
    );
 }


 async function sleep(seconds: number) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}


async function main() {
//   const addr = await deploy();
//   const addr = "0x801B3927E0c041B16117b2b119e116cFB6a0f2c3"
//   await execute(addr);
//   await sleep(60)
//   await createBucket(addr)
await allocatePolicy()
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });