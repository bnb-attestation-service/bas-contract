import { ethers } from "hardhat";
import {
  deployBucketManager,
  createBucket,
  getBucketStatus,
  createPolicy,
  transferOwnership,
  getPolicyStatus,
  getManagerAmount,
} from "./bucket/deploy";
import { ZERO_BYTES32 } from "./utils";

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
async function main() {
  const [signer] = await ethers.getSigners();

  //todo:合约参数配进来
  const registry = "0x08C8b8417313fF130526862f90cd822B55002D72";
  const bas = "0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD";
  const bucketRegistry = "0x7540304c2C017f6441b5425f4d5E4B70e21171E8";
  const factory = "0x660cD00a374101F14A7A8209682f35922bC51672";
  const passport = "";

  //todo: 定时搞
  const amount = await getManagerAmount(registry, passport);

  //todo: 15参数配进来
  for (var i = amount; i < 15; i++) {
    //todo: salt : nanosecond 转 bytes32
    const salt = ethers.hashMessage("12");
    const name = "bascan";
    //todo: 0.001 参数配进来
    const manager = await deployBucketManager(factory, salt, "0.001");
    await sleep(60);

    await createBucket(manager, name, ZERO_BYTES32);
    await sleep(300);
    const result = await getBucketStatus(manager, name, ZERO_BYTES32);
    //todo: 如果result == 1 成功，2 失败，重来，3 pending 等等

    const policyHash1 = await createPolicy(
      manager,
      signer.address,
      name,
      ZERO_BYTES32
    );
    await sleep(300);
    const result2 = await getPolicyStatus(manager, policyHash1);
    //todo: 如果result == 1 成功，2 失败，重来，3 pending 等等
    await transferOwnership(manager, passport);
  }
}

main();
