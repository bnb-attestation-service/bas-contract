// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

using SafeERC20 for IERC20;

struct Signature {
    uint8 v; // The recovery ID.
    bytes32 r; // The x-coordinate of the nonce R.
    bytes32 s; // The signature data.
}


contract MemeLaunch is Initializable, OwnableUpgradeable {

    address public _faucet;
    IERC20 public _meme;
    mapping(bytes32=>uint256) public _taskPoints;
    mapping(address=>mapping(bytes32=>bool)) public _user_finished_task;
    bytes32[] public tasks;
    address public _validator;

    mapping(address=>bytes32[]) public _user_finished_tasks_list;

    function initialize(
        address faucet,
        address validator,
        IERC20 meme,
        bytes32[] memory taskIds,
        uint256[] memory points
    )public initializer {
        __Ownable_init();
        require(taskIds.length == points.length,"Invalid task point params");

        _faucet = faucet;
        _meme = meme;
        _validator = validator;

        for (uint256 i=0; i < taskIds.length;i++) {
            _taskPoints[taskIds[i]]= points[i];
            tasks.push(taskIds[i]);
        }
    }


    function setTaskPoint( bytes32[] memory taskIds,uint256[] memory points) public onlyOwner {
         require(taskIds.length == points.length,"Invalid task point params");
           for (uint256 i=0; i < taskIds.length;i++) {
            if (_taskPoints[taskIds[i]] == 0) {
                tasks.push(taskIds[i]);
            }
            _taskPoints[taskIds[i]]= points[i];
        }
    }
    function setValidator(address validator) public onlyOwner {
        _validator = validator;
    }

    function setMeme(IERC20 meme) public onlyOwner {
         _meme = meme;
    }

    function setFaucet(address faucet) public onlyOwner() {
        _faucet = faucet;
    }

    function getUserFinishedTask(address user) public view returns (bytes32[] memory) {
        return _user_finished_tasks_list[user];
    }

    function claimMemeCoin(address to, bytes32[] memory finishTasks, Signature memory signature) public {
        require(_faucet != address(0), "Faucet address is zero");
        bytes32 digset = keccak256(abi.encodePacked(to,finishTasks));
        require(ECDSA.recover(digset, signature.v,signature.r, signature.s) == _validator, "Invalid Signature");
        uint256 claimableMeme = 0;
        for (uint256 i = 0;i < finishTasks.length; i++) {
            bytes32 task = finishTasks[i];
            bool contain = _user_finished_task[to][task];
            uint256 meme_amount = _taskPoints[task];
            // require(!contain, "Reward for task has been claimed");
            // require(meme_amount > 0, "Task id is invalid");
            if (!contain) {
                claimableMeme += meme_amount;
                _user_finished_task[to][task] = true;
                _user_finished_tasks_list[to].push(task);
            }
        }
        require(claimableMeme > 0, "Claimable meme is zero");
        _meme.safeTransferFrom(_faucet,to,claimableMeme);
    }
}