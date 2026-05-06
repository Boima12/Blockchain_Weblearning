// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

contract CertificateNFT is ERC721URIStorage, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public nextTokenId;
    mapping(uint256 => mapping(address => bool)) private issued;

    error Soulbound();
    error AlreadyIssued();
    error InvalidMetadata();

    event CertificateIssued(
        uint256 indexed tokenId,
        uint256 indexed courseId,
        address indexed student,
        string metadataURI
    );

    constructor(string memory name, string memory symbol, address admin)
        ERC721(name, symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function mintCertificate(
        address student,
        uint256 courseId,
        string calldata metadataURI
    ) external whenNotPaused onlyRole(MINTER_ROLE) returns (uint256) {
        if (issued[courseId][student]) {
            revert AlreadyIssued();
        }
        if (bytes(metadataURI).length == 0) {
            revert InvalidMetadata();
        }

        uint256 tokenId = nextTokenId++;
        issued[courseId][student] = true;

        _safeMint(student, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CertificateIssued(tokenId, courseId, student, metadataURI);
        return tokenId;
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert Soulbound();
    }

    function setApprovalForAll(
        address,
        bool
    ) public pure override(ERC721, IERC721) {
        revert Soulbound();
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
