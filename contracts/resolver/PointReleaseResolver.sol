// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./ISchemaResolver.sol";
import { IEAS as IBAS, Attestation } from "../IEAS.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


interface IIndexer {
   function indexAttestation(bytes32 attestationUID) external;
}


contract PointReleaseResolver is ISchemaResolver,Initializable,OwnableUpgradeable {
    address public _faucet;
    address public _basPoint;
    IBAS public _bas;
    IIndexer public _indexer;
    mapping(address=>bool) public _validAttestor ;
    mapping(bytes32=>uint256) public _taskPoints;
    // mapping(address => mapping(bytes32=>bool)) _userFinishedTasks;

    function initialize(
        address faucet,
        address  basPoint, 
        IBAS bas, 
        IIndexer indexer,
        address[] memory validAttestors,
        bytes32[] memory taskSchemaId,
        uint256[] memory taskPoints) public initializer{
        __Ownable_init();
        require(taskSchemaId.length == taskPoints.length,"Invalid task point params");

        _basPoint = basPoint;
        _bas = bas;
        _faucet = faucet;
        _indexer = indexer;


        for (uint256 i = 0; i < validAttestors.length; i++){
            _validAttestor[validAttestors[i]] = true;
        }

        for (uint256 i =0;i < taskSchemaId.length;i++){
            _taskPoints[taskSchemaId[i]] = taskPoints[i];
        }
    }

    modifier onlyBAS() {
        require(msg.sender == address(_bas),"only bas contract can call resolver");
        _;
    }

    function addValidAttestor(address _attestor) external onlyOwner {
        _validAttestor[_attestor] = true;
    }

    function deleteValidAttestor(address _attestor) external onlyOwner {
        delete _validAttestor[_attestor];
    }

    function updateTaskPoint( bytes32[] memory taskSchemaId,uint256[] memory taskPoints) external onlyOwner{
        for (uint256 i =0;i < taskSchemaId.length;i++){
            _taskPoints[taskSchemaId[i]] = taskPoints[i];
        }
    }

    function deleteTasks(bytes32[] memory taskSchemaId) external onlyOwner{
         for (uint256 i =0;i < taskSchemaId.length;i++){
            delete _taskPoints[taskSchemaId[i]];
        }
    }

    function isPayable() external pure returns (bool) {
        return false;
    }

    /// @notice Processes an attestation and verifies whether it's valid.
    /// @param attestation The new attestation.
    /// @return Whether the attestation is valid.
    function attest(Attestation calldata attestation) external payable returns (bool) {
        return onAttest(attestation);
    }

    /// @notice Processes multiple attestations and verifies whether they are valid.
    /// @param attestations The new attestations.
    /// @return Whether all the attestations are valid.
    function multiAttest(
        Attestation[] calldata attestations,
        uint256[] calldata /*values*/
    ) external payable returns (bool){
        for (uint256 i = 0; i < attestations.length; i++) {
            // Forward the attestation to the underlying resolver and return false in case it isn't approved.
            if (!onAttest(attestations[i])) {
                return false;
            }
        }
        return true;
    }

    /// @notice Processes an attestation revocation and verifies if it can be revoked.
    /// @return Whether the attestation can be revoked.
    function revoke(Attestation calldata attestation) external payable returns (bool){
        return onRevoke(attestation);
    }

    /// @notice Processes revocation of multiple attestation and verifies they can be revoked.
    /// @return Whether the attestations can be revoked.
    function multiRevoke(
        Attestation[] calldata attestations,
        uint256[] calldata /*values*/
    ) external payable returns (bool){
        for (uint256 i = 0; i < attestations.length; i++) {
            // Forward the attestation to the underlying resolver and return false in case it isn't approved.
            if (!onRevoke(attestations[i])) {
                return false;
            }
        }
        return true;
    }

    function onAttest(Attestation calldata attestation) internal returns (bool) {
        if (_validAttestor[attestation.attester] == true && _taskPoints[attestation.schema] > 0) {
             _indexer.indexAttestation(attestation.uid);
             IERC20(_basPoint).transferFrom(_faucet, attestation.recipient,_taskPoints[attestation.schema]);
            //require(_userFinishedTasks[attestation.recipient][attestation.schema] == false,"The recipent has finished the task");
            //_userFinishedTasks[attestation.recipient][attestation.schema] == true;
        }
        return true;
    }

    function onRevoke(Attestation calldata /*attestation*/) internal pure returns (bool){
        return false;
    }

}
