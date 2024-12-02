import  {ethers,upgrades} from "hardhat";
import  {BASPoint__factory } from "../typechain-types/factories/contracts/BAS.sol";
import  {MemeLaunch__factory } from "../typechain-types/factories/contracts/MemeLaunch__factory";
import {SignatureStruct} from "../typechain-types/contracts/MemeLaunch"
import  {SCHEMAS,getSchemaUID,NO_EXPIRATION,ZERO_BYTES32, ZERO_ADDRESS} from "./utils";
import { SchemaRegistry__factory } from "../typechain-types";


import initSchema from "./3-initSchema";
import initSchemaName from "./4-initName";
import { bigint } from "hardhat/internal/core/params/argumentTypes";


async function deployERC20Point() {
    const [signer] = await ethers.getSigners();
    // console.log('Deploy Point ERC20 contract with account:',signer.address);

    const Point = await ethers.getContractFactory("BASPoint",signer)
    const point = await Point.deploy()

    await point.waitForDeployment();
    const addr = await point.getAddress();
    console.log('BAS ETC20 Point Contract Address:', addr)

    const decimals:bigint = await point.decimals()
    return [decimals,addr]

}

async function deployMemeLaunch(faucet:string,validator:string,meme:string,taskSchemaIds:string[],taskPoints: bigint[] ){
    const [signer] = await ethers.getSigners();
    // console.log('Deploy meme launch contract with account:',signer.address);

    const MemeLaunch =  await ethers.getContractFactory("MemeLaunch",signer);
    const memeLaunch = await upgrades.deployProxy(MemeLaunch,[
        faucet,
        validator,
        meme,
        taskSchemaIds,
        taskPoints
    ]);
    await memeLaunch.waitForDeployment();
    const addr = await memeLaunch.getAddress();
    console.log('Meme Launch Contract Address:', addr)
    return addr
}

async function upgradeMemeLaunch(memeLaunchAddr:string) {
    const [signer] = await ethers.getSigners();
    const MemeLaunch =  await ethers.getContractFactory("MemeLaunch",signer);
    await upgrades.upgradeProxy(memeLaunchAddr, MemeLaunch)
}

async function updateTaskPoint(memeLaunchAddr : string, taskSchemaIds:string[],taskPoints: bigint[]) {
    const [signer] = await ethers.getSigners();
    // console.log('Update Task Point with account:',signer.address);

    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.setTaskPoint(taskSchemaIds,taskPoints)
    await resp.wait()
    console.log(`update task point in tx ${resp.hash}`);
}

async function setValidator(memeLaunchAddr : string, addr: string) {
    const [signer] = await ethers.getSigners();
    // console.log('Update Task Point with account:',signer.address);
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.setValidator(addr)
    await resp.wait()
    console.log(`set validator in tx ${resp.hash}`);
}

async function approveToMemeLaunch(memeLaunchAddr:string, ercPoint:string, value: bigint) {
    const [signer] = await ethers.getSigners();
    const point = BASPoint__factory.connect(ercPoint,signer)
    const resp = await point.approve(memeLaunchAddr,value)
    await resp.wait()
    console.log(`approve ${value} BAS point to ${memeLaunchAddr} in tx ${resp.hash}`);
}

function getSchemaIdAndPoint(decimals:bigint,resolver: string,revocable:boolean) {
    var schemaIds = new Array()
    var points = new Array()
    for (const {schema,point} of SCHEMAS) {
        schemaIds.push(getSchemaUID(schema,resolver,revocable))
        points.push(BigInt(point) * 10n ** decimals)
    }
    return [schemaIds, points]
}

async function getSchemaIdAndTask(memeLaunchAddr : string,schemaId:string) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const meme = await memeLaunch._meme()
    console.log("meme point:",meme)

    const admin = await memeLaunch._validator()
    console.log("validate attestor:",admin)

    const schemaAndPoints = await memeLaunch._taskPoints(schemaId)

    console.log("task point:",schemaAndPoints)

    const faucet = await memeLaunch._faucet()
    console.log("faucet:",faucet)

}

async function getBalance(meme:string, memelaunch:string,reciepent: string, faucet:string) {
    const [signer] = await ethers.getSigners();
    const point = BASPoint__factory.connect(meme,signer)
    const balance = await point.balanceOf(reciepent)
    console.log("balance:",balance)

    const allowance = await point.allowance(faucet,memelaunch)
    console.log("allowance:",allowance)
}

async function getSchemaId(schemaRegistry:string, uid :string) {
    const [signer] = await ethers.getSigners();

    const registry = SchemaRegistry__factory.connect(schemaRegistry,signer)
    const resp = await registry.getSchema(uid)
    console.log("get schema:",resp)
}

async function claim(memeLaunchAddr:string, to:string, taskIds: string[], s: SignatureStruct) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.claimMemeCoin(
        to,
        taskIds,
        s
    )
    resp.wait();
    console.log(`claim reward to user ${to} for tasks ${taskIds} in tx ${resp.hash}`);
    
}

async function setMemeCoin(memeLaunchAddr:string, memeCoin:string) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.setMeme(memeCoin)
    resp.wait()
    console.log(`set memecoin to ${memeCoin} in tx ${resp.hash}`);
}

async function getMemeCoin(memeLaunchAddr:string) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch._meme()
    console.log(`memecoin is ${resp}`);
}

async function setFaucet(memeLaunchAddr:string, faucet:string) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.setFaucet(faucet)
    resp.wait()
    console.log(`set faucet to ${faucet} in tx ${resp.hash}`);
}

// async function encodeData(memeLaunchAddr:string, to:string, taskIds: string[]) {
//     const [signer] = await ethers.getSigners();
//     const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
//     const resp = await memeLaunch.encodeInput(
//         to,
//         taskIds,
//     )

//     console.log(`encode data is: ${resp}`)
// }

async function getClaimedTask(memeLaunchAddr:string, addr:string) {
    const [signer] = await ethers.getSigners();
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.getUserFinishedTask(
        addr
    )

    console.log(`claimed tasks are: ${resp}`)
}

async function getTakPoint(memeLaunchAddr:string, schemaId: string) {
    const [signer] = await ethers.getSigners();
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch._taskPoints(
        schemaId
    )

    console.log(`Point for task ${schemaId} is ${resp}`)
}

async function getValidator(memeLaunchAddr:string) {
    const [signer] = await ethers.getSigners();
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch._validator(
    )

    console.log(`validator is ${resp}`)
}

async function estimateClaimGas(memeLaunchAddr:string, to:string, taskIds: string[], s: SignatureStruct)  {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch.claimMemeCoin.estimateGas(
        to,
        taskIds,
        s
    )
    console.log(`Gas fee of claim is ${resp}`);
}

async function finishedTask(memeLaunchAddr:string, to:string) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch._user_finished_tasks_list(to,1)
    console.log(`User ${to} finished task result is ${resp}`)

}

async function getFaucet(memeLaunchAddr:string) {
    const [signer] = await ethers.getSigners();
    
    const memeLaunch = MemeLaunch__factory.connect(memeLaunchAddr,signer)
    const resp = await memeLaunch._faucet()
    console.log(`faucet is ${resp}`);
}

async function main() {
    const [signer] = await ethers.getSigners();
    const revocable = false
    console.log('Deploy point contract with account:',signer.address);
    // await initSchema(registrySchema,ZERO_ADDRESS,revocable);
    // await initSchemaName(bas,ZERO_ADDRESS,revocable);

    //bsc mainnet
    const meme = '0x9C73D743adA7C1639E3134E99578Ef54a8D7618B'
    // const decimals = 18n
    // const registrySchema = "0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa"
    // const bas = "0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC"
    
    // const [taskSchemaIds,taskPoints] = getSchemaIdAndPoint(decimals as bigint,ZERO_ADDRESS,revocable)

    // const memeLaunch = await deployMemeLaunch(signer.address,signer.address,meme as string,taskSchemaIds,taskPoints)
    // await approveToMemeLaunch(memeLaunch,meme.toString(), 1_000_000_000_000_000_000_000_000_000n)
     const memeLaunch = "0x96fbda5fd0E25f411064f60411bcE8b404FfaDB8"
     const faucet = "0x32F0CC18829FB40A1f13Bb9b461Bca4EFF3a629a"

    //  await setMemeCoin(memeLaunch,meme)
    // await getMemeCoin(memeLaunch)
    // await setFaucet(memeLaunch, faucet)
    // await getFaucet(memeLaunch)

    //bsc testnet 
    // const decimals = 18n
    // const meme = '0xAB4984206Efa924D4Fcf64c3c5FC367B746a2C7C'
    // const registrySchema = "0x08C8b8417313fF130526862f90cd822B55002D72"
    // const bas = "0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD"

    // const [taskSchemaIds,taskPoints] = getSchemaIdAndPoint(decimals as bigint,ZERO_ADDRESS,revocable)
    // const memeLaunch = await deployMemeLaunch(signer.address,signer.address,meme as string,taskSchemaIds,taskPoints)
    // await approveToMemeLaunch(memeLaunch,meme.toString(), 1_000_000_000_000_000_000_000_000_000n)
    // const memeLaunch = "0x4020Cd8573a85FC691dC2c1F3B0a964832E37d1f"
    
    // const schemaIds = [
    //     "0xe1f145b036d9a4f7998193ccccf6a760a948307f795cff94f0d275fc6a222296"
    // ]
    // const to = "0xa0887ee4C23F27910c8e10fBFBB7519D4f3f1d4e"
    // await encodeData(memeLaunch,to,schemaIds)
    // await getValidator(memeLaunch)

    // await getTakPoint(memeLaunch,schemaIds[0])

    // await claim(memeLaunch,
    //     "0xFe85bEb8DcdA1CA14883C56DB3fD122bb00d5413",
    //     [
    //         "0xe1f145b036d9a4f7998193ccccf6a760a948307f795cff94f0d275fc6a222296"
    //     ],
    //     {
    //         r: "0x093e55d024d9ef6570e7dccba7b9a281d854ff8641d550ed4507a01946509cef",
    //         s: "0x7f9014aa21eb9b03ef07fb310971f45404b3ff38ff815fd051a6844440244fcb",
    //         v: 28
    //     })

    // await getBalance(meme,memeLaunch,to,signer.address)
    // await getClaimedTask(memeLaunch,to)

    await estimateClaimGas(
        memeLaunch,
        "0xFe85bEb8DcdA1CA14883C56DB3fD122bb00d5413",
        [
            "0xe1f145b036d9a4f7998193ccccf6a760a948307f795cff94f0d275fc6a222296"
        ],
        {
            r: "0x093e55d024d9ef6570e7dccba7b9a281d854ff8641d550ed4507a01946509cef",
            s: "0x7f9014aa21eb9b03ef07fb310971f45404b3ff38ff815fd051a6844440244fcb",
            v: 28
        })

    // await upgradeMemeLaunch(memeLaunch)
    // await finishedTask(memeLaunch,"0x10aA9ce20a1b03B18B4E2FD7B5d747ADD9a02030")
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
