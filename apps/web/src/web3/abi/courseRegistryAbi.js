export const courseRegistryAbi = [
    {
        inputs: [
            { internalType: 'string', name: 'metadataCID', type: 'string' },
            { internalType: 'uint256', name: 'priceWei', type: 'uint256' },
        ],
        name: 'createCourse',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'courseId', type: 'uint256' }],
        name: 'courses',
        outputs: [
            { internalType: 'address', name: 'creator', type: 'address' },
            { internalType: 'string', name: 'metadataCID', type: 'string' },
            { internalType: 'uint256', name: 'priceWei', type: 'uint256' },
            { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { internalType: 'string', name: 'metadataCID', type: 'string' },
            { internalType: 'uint256', name: 'priceWei', type: 'uint256' },
            { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        name: 'updateCourse',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
            { indexed: false, internalType: 'string', name: 'metadataCID', type: 'string' },
            { indexed: false, internalType: 'uint256', name: 'priceWei', type: 'uint256' },
        ],
        name: 'CourseCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
            { indexed: false, internalType: 'string', name: 'metadataCID', type: 'string' },
            { indexed: false, internalType: 'uint256', name: 'priceWei', type: 'uint256' },
            { indexed: false, internalType: 'bool', name: 'active', type: 'bool' },
        ],
        name: 'CourseUpdated',
        type: 'event',
    },
];
