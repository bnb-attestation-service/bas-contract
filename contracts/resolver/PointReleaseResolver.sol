// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import "./ISchemaResolver.sol";
import { IEAS as IBAS, Attestation } from "../IEAS.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract PointReleaseResolver is ISchemaResolver,Initializable,OwnableUpgradeable {
    using Address for address payable;

    IBAS public _bas;
    uint256 public _bank;
    mapping(bytes32=>address) public _validAttestor ;
    mapping(bytes32=>uint256) public _taskPoints;
    // mapping(address => mapping(bytes32=>bool)) _userFinishedTasks;

    function initialize(IBAS bas) public initializer{
        __Ownable_init();
        _bas = bas;
    }

    modifier onlyBAS() {
        require(msg.sender == address(_bas),"only bas contract can call resolver");
        _;
    }

    function updateTaskPoint(
        address[] memory validAttestors,
        bytes32[] memory taskSchemaId,
        uint256[] memory taskPoints) external onlyOwner{
        require(taskSchemaId.length == taskPoints.length && taskPoints.length == validAttestors.length,"Invalid task point params");

        for (uint256 i = 0; i < validAttestors.length; i++){
            _validAttestor[taskSchemaId[i]] = validAttestors[i];
            _taskPoints[taskSchemaId[i]] = taskPoints[i];
        }
    }

    function deleteTasks(bytes32[] memory taskSchemaId) external onlyOwner{
         for (uint256 i =0;i < taskSchemaId.length;i++){
            delete _taskPoints[taskSchemaId[i]];
            delete _validAttestor[taskSchemaId[i]];
        }
    }

    function withdraw(uint256 amount,address to) external onlyOwner(){
        if (amount > 0) {
            payable(to).sendValue(amount);
            _bank-=amount;
        } else{
             payable(to).sendValue(_bank);
             _bank = 0;
        }
    } 

    function isPayable() external pure returns (bool) {
        return true;
    }

    /// @notice Processes an attestation and verifies whether it's valid.
    /// @param attestation The new attestation.
    /// @return Whether the attestation is valid.
    function attest(Attestation calldata attestation) external payable returns (bool) {
        return(onAttest(attestation, msg.value));
    }

    function onAttest(Attestation calldata attestation,uint256 value) internal returns (bool){
        address validAttestor = _validAttestor[attestation.schema];
        uint256 gasFee = _taskPoints[attestation.schema];
        require(value >= gasFee, "insufficient fund");
        require(validAttestor == attestation.attester || validAttestor == address(0),"invalid attester");
        // if (value >= gasFee) {
        //     payable(address(attestation.recipient)).sendValue(value - gasFee);
        // }
        if (gasFee >0) {
            _bank+=gasFee;
        }
        return true;
    }

    /// @notice Processes multiple attestations and verifies whether they are valid.
    /// @param attestations The new attestations.
    /// @return Whether all the attestations are valid.
    function multiAttest(
        Attestation[] calldata attestations,
        uint256[] calldata values
    ) external payable returns (bool){
        require(attestations.length == values.length, "Invalid length"); 
        uint256 remainingValue = msg.value;

        for (uint256 i = 0; i < attestations.length; i++) {
            uint256 value = values[i];
            require(value < remainingValue,"insufficient value");
            if (!onAttest(attestations[i], value)) {
                return false;
            }
            unchecked {
                remainingValue -= value;
            }
        }
        _bank+=msg.value;
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


    function onRevoke(Attestation calldata /*attestation*/) internal pure returns (bool){
        return false;
    }

    function getMintFee(bytes32 schemaId) external view returns (uint256) {
        return _taskPoints[schemaId];
    }
}
