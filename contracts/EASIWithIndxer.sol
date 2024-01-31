// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import { IEAS, AttestationRequest, AttestationRequestData, Attestation } from "./IEAS.sol";
import { EMPTY_UID, uncheckedInc } from "./Common.sol";
import { Semver } from "./Semver.sol";
import {IIndexer} from "./IIndexer.sol";

contract EASWithIndxer {

    error InvalidRegistry();

    IIndexer private immutable _indexer;

    constructor(IIndexer Indexer){
         if (address(Indexer) == address(0)) {
            revert InvalidRegistry();
        }

        _indexer = Indexer;
    }

    function attest(AttestationRequest calldata request) external payable returns (bytes32) {
        
    }


}



