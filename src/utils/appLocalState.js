import coursesJson from '../materials/data.json';

const APP_STORAGE_KEY = 'bwl.frontend.state.v1';

const COURSE_SECTIONS = Object.values(coursesJson?.data ?? {});
const COURSE_CATALOG = COURSE_SECTIONS.flatMap((section) => section?.items ?? []);

const getSeedPurchases = () =>
    COURSE_CATALOG.slice(0, 3).map((course, index) => ({
        courseId: course.id,
        enrolledAt: new Date(Date.now() - index * 86400000).toISOString(),
        progress: index === 0 ? 33 : index === 1 ? 12 : 0,
    }));

const DEFAULT_PROFILE = {
    displayName: 'Blockchain Student',
    email: 'student@university.edu',
    walletAddress: '0xA4f0fA32F7bA19EfA72fD8B601845513d19b4aD0',
    bio: 'University student building a Web3 learning platform.',
    avatarUrl: '',
};

const DEFAULT_APP_STATE = {
    profile: DEFAULT_PROFILE,
    createdCourses: [],
    purchasedCourses: getSeedPurchases(),
    learningProgress: {},
    certificates: [],
};

const normalizeState = (input = {}) => ({
    profile: {
        ...DEFAULT_PROFILE,
        ...(input.profile ?? {}),
    },
    createdCourses: Array.isArray(input.createdCourses)
        ? input.createdCourses
        : DEFAULT_APP_STATE.createdCourses,
    purchasedCourses: Array.isArray(input.purchasedCourses)
        ? input.purchasedCourses
        : DEFAULT_APP_STATE.purchasedCourses,
    learningProgress:
        input.learningProgress && typeof input.learningProgress === 'object'
            ? input.learningProgress
            : DEFAULT_APP_STATE.learningProgress,
    certificates: Array.isArray(input.certificates)
        ? input.certificates
        : DEFAULT_APP_STATE.certificates,
});

export const getAllCourses = () => COURSE_CATALOG;

export const getCourseById = (courseId) =>
    COURSE_CATALOG.find((course) => String(course.id) === String(courseId));

export const getAppState = () => {
    if (typeof window === 'undefined') {
        return DEFAULT_APP_STATE;
    }

    try {
        const storedState = window.localStorage.getItem(APP_STORAGE_KEY);
        if (!storedState) {
            window.localStorage.setItem(
                APP_STORAGE_KEY,
                JSON.stringify(DEFAULT_APP_STATE),
            );
            return DEFAULT_APP_STATE;
        }

        return normalizeState(JSON.parse(storedState));
    } catch {
        return DEFAULT_APP_STATE;
    }
};

export const saveAppState = (nextState) => {
    if (typeof window === 'undefined') {
        return normalizeState(nextState);
    }

    const normalized = normalizeState(nextState);
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
};

export const updateAppState = (updater) => {
    const currentState = getAppState();
    const nextState =
        typeof updater === 'function' ? updater(currentState) : updater;

    return saveAppState(nextState);
};

export const formatWalletAddress = (walletAddress = '') => {
    if (!walletAddress) {
        return 'Connect Wallet';
    }

    if (walletAddress.length <= 12) {
        return walletAddress;
    }

    const prefix = walletAddress.slice(0, 6);
    const suffix = walletAddress.slice(-4);
    return `${prefix}...${suffix}`;
};
