// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

contract CourseRegistry is Ownable, Pausable {
    struct Course {
        address creator;
        string metadataCID;
        uint256 priceWei;
        bool active;
    }

    uint256 public nextCourseId;
    mapping(uint256 => Course) public courses;
    mapping(uint256 => bytes32) private courseMetadataHash;
    mapping(bytes32 => bool) private usedMetadata;

    error InvalidMetadata();
    error CourseNotFound();
    error NotCreator();
    error DuplicateMetadata();

    event CourseCreated(
        uint256 indexed courseId,
        address indexed creator,
        string metadataCID,
        uint256 priceWei
    );
    event CourseUpdated(
        uint256 indexed courseId,
        string metadataCID,
        uint256 priceWei,
        bool active
    );

    constructor() Ownable(msg.sender) {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createCourse(
        string calldata metadataCID,
        uint256 priceWei
    ) external whenNotPaused returns (uint256) {
        if (bytes(metadataCID).length == 0) {
            revert InvalidMetadata();
        }

        bytes32 metadataHash = keccak256(bytes(metadataCID));
        if (usedMetadata[metadataHash]) {
            revert DuplicateMetadata();
        }

        uint256 courseId = nextCourseId++;
        courses[courseId] = Course({
            creator: msg.sender,
            metadataCID: metadataCID,
            priceWei: priceWei,
            active: true
        });
        courseMetadataHash[courseId] = metadataHash;
        usedMetadata[metadataHash] = true;

        emit CourseCreated(courseId, msg.sender, metadataCID, priceWei);
        return courseId;
    }

    function updateCourse(
        uint256 courseId,
        string calldata metadataCID,
        uint256 priceWei,
        bool active
    ) external whenNotPaused {
        Course storage course = courses[courseId];
        if (course.creator == address(0)) {
            revert CourseNotFound();
        }
        if (course.creator != msg.sender) {
            revert NotCreator();
        }
        if (bytes(metadataCID).length == 0) {
            revert InvalidMetadata();
        }

        bytes32 metadataHash = keccak256(bytes(metadataCID));
        bytes32 previousHash = courseMetadataHash[courseId];
        if (metadataHash != previousHash && usedMetadata[metadataHash]) {
            revert DuplicateMetadata();
        }

        course.metadataCID = metadataCID;
        course.priceWei = priceWei;
        course.active = active;
        if (metadataHash != previousHash) {
            courseMetadataHash[courseId] = metadataHash;
            usedMetadata[metadataHash] = true;
        }

        emit CourseUpdated(courseId, metadataCID, priceWei, active);
    }
}
