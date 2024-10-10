// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./ISchemaResolver.sol";
import { IEAS, Attestation } from "../IEAS.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BalanceCheckResolver is ISchemaResolver,Initializable,Ownable {
    address public _faucet;
    address public _basPoint;
    IEAS public _eas;
    
    

    mapping(bytes32=>uint256) public _taskPoints;
    mapping(bytes32=>uint256) _bnbBalanceDownbound;
    mapping(address => mapping(bytes32=>bool)) _userFinishedTasks;


    function initialize(
        address faucet,
        address  basPoint, 
        IEAS eas, 

        bytes32[] memory taskSchemaId,
        uint256[] memory taskPoints,
        uint256[] memory bnbBalanceDownbound) public initializer{
        _basPoint = basPoint;
        _eas = eas;
        _faucet = faucet;
        
        require(bnbBalanceDownbound.length == taskSchemaId.length, "invalid task point length");

        for (uint256 i = 0; i < bnbBalanceDownbound.length; i++){
            _bnbBalanceDownbound[taskSchemaId[i]] = bnbBalanceDownbound[i];
        }

        for (uint256 i =0;i < taskSchemaId.length;i++){
            _taskPoints[taskSchemaId[i]] = taskPoints[i];
        }

    }

    function updateBnbBalanceBound(bytes32[] memory taskSchemaId,uint256[] memory bnbBalanceDownbound) external onlyOwner {
        for (uint256 i = 0; i < bnbBalanceDownbound.length; i++){
            _bnbBalanceDownbound[taskSchemaId[i]] = bnbBalanceDownbound[i];
        }
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

    function attest(Attestation calldata attestation) external payable returns (bool) {
        return onAttest(attestation);
    }

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
        require(_taskPoints[attestation.uid] > 0,"Given schema doesn't participanted the campaign");
        require(_userFinishedTasks[attestation.recipient][attestation.uid] == false,"The recipent has finished the task");
        require(address(attestation.recipient).balance >= _bnbBalanceDownbound[attestation.uid], "The balance of user is not satisfied the requirement");
        
        IERC20(_basPoint).transferFrom(_faucet, attestation.recipient,_taskPoints[attestation.uid]);
        _userFinishedTasks[attestation.recipient][attestation.uid] == true;
        return true;
    }

    function onRevoke(Attestation calldata /*attestation*/) internal pure returns (bool){
        return false;
    }

}

