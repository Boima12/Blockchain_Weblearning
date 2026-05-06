// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICourseRegistry {
    function courses(
        uint256 courseId
    )
        external
        view
        returns (address creator, string memory metadataCID, uint256 priceWei, bool active);
}

contract CoursePurchase is Ownable, Pausable, ReentrancyGuard {
    ICourseRegistry public registry;

    mapping(uint256 => mapping(address => bool)) private enrollments;
    mapping(uint256 => mapping(address => uint256)) public enrolledAt;

    error CourseNotFound();
    error CourseInactive();
    error AlreadyEnrolled();
    error WrongPrice();
    error PaymentFailed();

    event CoursePurchased(
        uint256 indexed courseId,
        address indexed buyer,
        address indexed creator,
        uint256 priceWei
    );

    constructor(address registryAddress) Ownable(msg.sender) {
        registry = ICourseRegistry(registryAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateRegistry(address registryAddress) external onlyOwner {
        registry = ICourseRegistry(registryAddress);
    }

    function hasAccess(uint256 courseId, address account) external view returns (bool) {
        return enrollments[courseId][account];
    }

    function buyCourse(uint256 courseId) external payable whenNotPaused nonReentrant {
        (address creator, , uint256 priceWei, bool active) = registry.courses(courseId);

        if (creator == address(0)) {
            revert CourseNotFound();
        }
        if (!active) {
            revert CourseInactive();
        }
        if (enrollments[courseId][msg.sender]) {
            revert AlreadyEnrolled();
        }
        if (msg.value != priceWei) {
            revert WrongPrice();
        }

        enrollments[courseId][msg.sender] = true;
        enrolledAt[courseId][msg.sender] = block.timestamp;

        (bool success, ) = payable(creator).call{ value: msg.value }("");
        if (!success) {
            revert PaymentFailed();
        }

        emit CoursePurchased(courseId, msg.sender, creator, msg.value);
    }
}
