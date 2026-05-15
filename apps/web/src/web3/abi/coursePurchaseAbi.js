export const coursePurchaseAbi = [
    {
        inputs: [{ internalType: 'uint256', name: 'courseId', type: 'uint256' }],
        name: 'buyCourse',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { internalType: 'address', name: 'student', type: 'address' },
        ],
        name: 'hasAccess',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { internalType: 'address', name: 'student', type: 'address' },
        ],
        name: 'enrolledAt',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'courseId', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'student', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'paid', type: 'uint256' },
        ],
        name: 'CoursePurchased',
        type: 'event',
    },
];
