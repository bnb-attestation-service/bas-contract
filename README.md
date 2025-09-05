# BNB Attestation Service

The BNB Attestation Service (BAS) is an infrastructure built on the BNB ecosystem for generating attestation to verify information. BAS assists users in on-chain or off-chain verification, allowing them to assert ownership of attestation by storing them in Greenfield. This approach ensures data privacy and access control.

The contracts of BAS are forked from [EAS](https://github.com/ethereum-attestation-service/eas-contracts).

## Deploy

- Install [hardhat](https://hardhat.org/tutorial/setting-up-the-environment)
- Compile contract: ``npx hardhat compile``
- Set RPC endpoint & deploy key in system env

    ```shell
        export PRIVATE_KEY = ${deploy_key}
        export BNB_RPC = ${bnb_rpc_url}
        export BNB_TEST_RPC = ${bnb_testnet_rpc_url}
    ```

- Deploy contracts:

    ```shell
        npx hardhat run scripts/deploy.ts --network bnb #deploy in bnb chain
        npx hardhat run scripts/deploy.ts --network bnb-test #deploy in bnb testnet
    ```

## Technology Stack

- Blockchain: BNB Smart Chain
- Smart Contracts: Solidity ^0.x.x
- Development: Hardhat, OpenZeppelin libraries

## Supported Networks

- BNB Smart Chain Mainnet (Chain ID: 56)
- BNB Smart Chain Testnet (Chain ID: 97)
- OPBNB Mainnet (Chain ID: 204)
- OPBNB Testnet (Chain ID: 5611)

## Contract Address

Current deployed contracts are:

### BNB mainnet

- BAS contract: `0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC`
- Schema Registry contract: `0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa`
- Delegate contract: `0x01dAc45529a070Cb67Fc5B328a7eBE394644355B`

### BNB testnet

- BAS contract: `0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD`
- Schema Registry contract: `0x08C8b8417313fF130526862f90cd822B55002D72`
- Delegate contract: `0x3b32B97092f09Ad34E5766e239e4C2F76b0DEe43`

### opBNB Mainnet

- BAS contract: `0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa`
- Schema Registry contract: `0x65CFBDf1EA0ACb7492Ecc1610cfBf79665DC631B`
- Delegate contract: `0x2F086b84b6840e902E1745A94DA648D61B0252B0`
- Indexer : `0x2DA65798a0BA6E5f2D457F4A99890843a7C02aFe`

### opBNB Testnet

- BAS contract: `0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa`
- Schema Registry contract: `0x65CFBDf1EA0ACb7492Ecc1610cfBf79665DC631B`
- Delegate contract: `0x8F6b5B3FFf1899A1107a1338b176f54ab72f27B9`
- Indexer : `0x96Fd40E6EA6826b0336C8018D646a6255a58b618`

## More Information

You can get more information in [BAS Doc](https://github.com/ridoio/bas-js-sdk).
