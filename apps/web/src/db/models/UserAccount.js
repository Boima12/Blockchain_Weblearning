import mongoose from 'mongoose';

const purchasedCourseSchema = new mongoose.Schema(
    {
        courseId: {
            type: String,
            required: true,
        },
        enrolledAt: {
            type: String,
            default: () => new Date().toISOString(),
        },
        progress: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    },
);

const profileSchema = new mongoose.Schema(
    {
        displayName: {
            type: String,
            default: 'Blockchain Student',
        },
        walletAddress: {
            type: String,
            default: '0xA4f0fA32F7bA19EfA72fD8B601845513d19b4aD0',
        },
        bio: {
            type: String,
            default: 'University student building a Web3 learning platform.',
        },
        avatarUrl: {
            type: String,
            default: '',
        },
    },
    {
        _id: false,
    },
);

const userAccountSchema = new mongoose.Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        profile: {
            type: profileSchema,
            default: () => ({}),
        },
        createdCourses: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        purchasedCourses: {
            type: [purchasedCourseSchema],
            default: [],
        },
        learningProgress: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        certificates: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const UserAccount =
    mongoose.models.UserAccount ||
    mongoose.model('UserAccount', userAccountSchema);

export default UserAccount;
