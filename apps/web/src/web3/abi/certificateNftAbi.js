export const certificateNftAbi = [
    {
        inputs: [
            { internalType: 'address', name: 'student', type: 'address' },
            { internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { internalType: 'string', name: 'metadataURI', type: 'string' },
        ],
        name: 'mintCertificate',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'student', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            { indexed: false, internalType: 'string', name: 'metadataURI', type: 'string' },
        ],
        name: 'CertificateIssued',
        type: 'event',
    },
];
