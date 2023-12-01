import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const BNB_TEST_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const BNB_RPC = 'https://bsc.nodereal.io';

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000
      },
      metadata: {
        bytecodeHash: 'none'
      }
    }
  },
  networks:{
    ["bnb-test"]: {
      chainId: 97,
      url: BNB_TEST_RPC,
      accounts: [PRIVATE_KEY]
    },
    ["bnb"]:{
      chainId:56,
      url: BNB_RPC,
      accounts:[PRIVATE_KEY]
    }
  }
};

export default config;
