import  {ethers,upgrades} from "hardhat";
import  {BASPoint__factory } from "../typechain-types/factories/contracts/BAS.sol";
import  {PointReleaseResolver__factory } from "../typechain-types/factories/contracts/resolver";
import  {SCHEMAS,getSchemaUID,NO_EXPIRATION,ZERO_BYTES32} from "./utils";
import { Indexer__factory } from "../typechain-types/factories/contracts/Indexer__factory";

import initSchema from "./3-initSchema";
import initSchemaName from "./4-initName";
import { bigint } from "hardhat/internal/core/params/argumentTypes";
import { SchemaRegistry__factory } from "../typechain-types";

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

async function deployBalanceResolver(faucet:string,point:string,eas:string, balanceDownBound: bigint[], taskSchemaIds:string[],taskPoints: bigint[] ){
    const [signer] = await ethers.getSigners();
    console.log('Deploy balance contract with account:',signer.address);

    const Resolver =  await ethers.getContractFactory("PointReleaseResolver",signer);
    const resolver = await upgrades.deployProxy(Resolver,[
        faucet,
        point,
        eas,
        taskSchemaIds,
        taskPoints,
        balanceDownBound
    ]);
    await resolver.waitForDeployment();
    const addr = await resolver.getAddress();
    console.log('Balance Resolver Contract Address:', addr)
    return addr
}

async function deployPointResolver(faucet:string,point:string,bas:string, validAttestor: string[], taskSchemaIds:string[],taskPoints: bigint[] ) {
    const [signer] = await ethers.getSigners();
    // console.log('Deploy point contract with account:',signer.address);

    const Resolver =  await ethers.getContractFactory("PointReleaseResolver",signer);
    const resolver = await upgrades.deployProxy(Resolver,[
        faucet,
        point,
        bas,
        validAttestor,
        taskSchemaIds,
        taskPoints
    ]);
    await resolver.waitForDeployment();
    const addr = await resolver.getAddress();
    console.log('Point Resolver Contract Address:', addr)
    return addr
}

async function updateTaskPoint(resolverAddr : string, taskSchemaIds:string[],taskPoints: bigint[]) {
    const [signer] = await ethers.getSigners();
    // console.log('Update Task Point with account:',signer.address);

    const resolver = PointReleaseResolver__factory.connect(resolverAddr,signer)
    const resp = await resolver.updateTaskPoint(taskSchemaIds,taskPoints)
    await resp.wait()
    console.log(`update task point in tx ${resp.hash}`);
}

async function addValidAttestor(resolverAddr : string, addr: string) {
    const [signer] = await ethers.getSigners();
    console.log('Update Task Point with account:',signer.address);

    const resolver = PointReleaseResolver__factory.connect(resolverAddr,signer)
    const resp = await resolver.addValidAttestor(addr)
    await resp.wait()
    console.log(`add valid attestor in tx ${resp.hash}`);
}

async function approveToResolver(pointResolver:string, ercPoint:string, value: bigint) {
    const [signer] = await ethers.getSigners();
    const point = BASPoint__factory.connect(ercPoint,signer)
    const resp = await point.approve(pointResolver,value)
    await resp.wait()
    console.log(`approve ${value} BAS point to ${pointResolver} in tx ${resp.hash}`);
}

function getSchemaIdAndPoint(decimals:bigint,resolver: string) {
    var schemaIds = new Array()
    var points = new Array()
    for (const {schema,point} of SCHEMAS) {
        schemaIds.push(getSchemaUID(schema,resolver,true))
        points.push(BigInt(point) * 10n ** decimals)
    }
    return [schemaIds, points]
}

async function getSchemaIdAndTask(resolverAddr : string,validAttestor:string,schemaId:string) {
    const [signer] = await ethers.getSigners();
    
    const resolver = PointReleaseResolver__factory.connect(resolverAddr,signer)
    const basPoint = await resolver._basPoint()
    console.log("bas point:",basPoint)

    const admin = await resolver._validAttestor(validAttestor)
    console.log("validate attestor:",admin)

    const schemaAndPoints = await resolver._taskPoints(schemaId)

    console.log("task point:",schemaAndPoints)

    const faucet = await resolver._faucet()
    console.log("faucet:",faucet)

}

async function getBalance(ercPoint:string, resolver:string,reciepent: string) {
    const [signer] = await ethers.getSigners();
    const point = BASPoint__factory.connect(ercPoint,signer)
    const balance = await point.balanceOf(reciepent)
    console.log("balasnce:",balance)

    const allowance = await point.allowance("0x471543A3bd04486008c8a38c5C00543B73F1769e",resolver)
    console.log("allowance:",allowance)

}

async function approveAndTransferFrom() {
    const [signer] = await ethers.getSigners();
    const point = BASPoint__factory.connect("0x9087992a8526Db9Bafb30Bb8eE258e663ed0C4AEs",signer)

    const resp = await point.transferFrom("0x471543A3bd04486008c8a38c5C00543B73F1769e","0x9087992a8526Db9Bafb30Bb8eE258e663ed0C4AE",1000n )
    resp.wait()

    const balance = await point.balanceOf("0x9087992a8526Db9Bafb30Bb8eE258e663ed0C4AE")
    console.log("balasnce:",balance)
}

async function indexUid() {
    const [signer] = await ethers.getSigners();
    const index = Indexer__factory.connect("0x1fcC6E4d2Ef76118cD8A8B4993f327E9b5067400",signer)
    const resp = await index.indexAttestation("0x8455d871d22e5bb629ab2acbb431d311ee15356f33c447bbd5c508d882890e97")
    resp.wait()
}


async function getIndex(indexer: string, uid:string) {
    const [signer] = await ethers.getSigners();
    const index = Indexer__factory.connect(indexer,signer)
    const resp = await index.isAttestationIndexed(
        uid,
    )

    console.log("resp:",resp)
}

async function getSchemaId(schema:string, uid :string) {
    const [signer] = await ethers.getSigners();

    const registry = SchemaRegistry__factory.connect(schema,signer)
    const resp = await registry.getSchema(uid)
    console.log("get schema:",resp)
}

async function main() {
    // const [signer] = await ethers.getSigners();
    // console.log('Deploy point contract with account:',signer.address);
    // const [decimals,erc20Point] = await deployERC20Point();
    // // const decimals = 18n
    // // const erc20Point = '0x9087992a8526Db9Bafb30Bb8eE258e663ed0C4AE'
    const registrySchema = ""
    // const bas = "0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa";
    // const delegateAttest = "0x6f9397703f9911Ec39C52D344431e81FE5a6710b"

    

    // const validAttestor = [delegateAttest];

    // const pointResolver =  await  deployPointResolver(signer.address,erc20Point.toString(),bas,validAttestor,[],[])
    // await approveToResolver(pointResolver,erc20Point.toString(), 1_000_000_000_000_000_000_000_000_000n)

    // // const pointResolver = "0xf96d6EEC8D7BA81D05dC93610bE4796e3fE8ec0E"
    // await initSchema(registrySchema,pointResolver);
    // await initSchemaName(bas,pointResolver);

    // const [taskSchemaIdsForPointResolver,taskPointsForPointResolver] = getSchemaIdAndPoint(decimals as bigint,pointResolver)
    // await updateTaskPoint(pointResolver,taskSchemaIdsForPointResolver,taskPointsForPointResolver)


    // const attUid = "0x8455d871d22e5bb629ab2acbb431d311ee15356f33c447bbd5c508d882890e97"
    // const delegateAttest = "0xbCFA34Ca2Bbc041b1A987077FF788254900d98E4"
    // const reciepent = "0xe588986ee2ca4C81c2a0Af2b3b13c6ea453c3992"
    // const schemaId = "0x641cacf045e8e708f7a9cd1e3ca0f77bf0a1810e3354e361c3d983eadd318a05"
    // await addValidAttestor("0xFc0b73fb747e550A1fd703EbAA7ee351651A644c","0xbCFA34Ca2Bbc041b1A987077FF788254900d98E4")
    // await getSchemaIdAndTask(pointResolver,delegateAttest,schemaId)
    // await getBalance(erc20Point,pointResolver,reciepent)
    // await getIndex(indexer,attUid)
    // await approveAndTransferFrom()
    // await indexUid()
    await getSchemaId(registrySchema,"0x723173b4de0f3ccdfeaf91359b57ccc59ccf19ac1d5eca3c346eeff4b62c164b")
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });