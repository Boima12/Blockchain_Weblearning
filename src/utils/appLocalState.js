const APP_STORAGE_KEY = 'bwl.frontend.state.v1';
const AUTH_STORAGE_KEY = 'bwl.auth.session.v1';

const DEFAULT_PROFILE = {
    displayName: 'Blockchain Student',
    email: 'student@university.edu',
    walletAddress: '0xA4f0fA32F7bA19EfA72fD8B601845513d19b4aD0',
    bio: 'University student building a Web3 learning platform.',
    avatarUrl: '',
};

const DEFAULT_APP_STATE = {
    profile: DEFAULT_PROFILE,
    // Keep local drafts only. Published courses are persisted in MongoDB.
    createdCourses: [],
    purchasedCourses: [],
    learningProgress: {},
    certificates: [],
};

const normalizeCreatedCourses = (createdCourses) => {
    if (!Array.isArray(createdCourses)) {
        return DEFAULT_APP_STATE.createdCourses;
    }

    return createdCourses.filter(
        (course) => String(course?.status ?? 'Draft') !== 'Published',
    );
};

const normalizePurchasedCourses = (purchasedCourses) => {
    if (!Array.isArray(purchasedCourses)) {
        return DEFAULT_APP_STATE.purchasedCourses;
    }

    return purchasedCourses
        .filter((purchaseItem) => purchaseItem?.courseId)
        .map((purchaseItem) => ({
            courseId: purchaseItem.courseId,
            enrolledAt: purchaseItem.enrolledAt ?? new Date().toISOString(),
            progress: Number(purchaseItem.progress ?? 0),
        }));
};

const normalizeLearningProgress = (learningProgress) => {
    if (!learningProgress || typeof learningProgress !== 'object') {
        return DEFAULT_APP_STATE.learningProgress;
    }

    return { ...learningProgress };
};

const normalizeCertificates = (certificates) => {
    if (!Array.isArray(certificates)) {
        return DEFAULT_APP_STATE.certificates;
    }

    return certificates.filter((certificate) => certificate?.courseId);
};

const normalizeState = (input = {}) => ({
    profile: {
        ...DEFAULT_PROFILE,
        ...(input.profile ?? {}),
    },
    createdCourses: normalizeCreatedCourses(input.createdCourses),
    purchasedCourses: normalizePurchasedCourses(input.purchasedCourses),
    learningProgress: normalizeLearningProgress(input.learningProgress),
    certificates: normalizeCertificates(input.certificates),
});

const normalizeAuthSession = (input = {}) => {
    const accountId = String(input?.accountId ?? '').trim();
    if (!accountId) {
        return null;
    }

    return {
        accountId,
        displayName: String(input.displayName ?? '').trim(),
        email: String(input.email ?? '').trim().toLowerCase(),
        walletAddress: String(input.walletAddress ?? '').trim(),
        loggedInAt:
            String(input.loggedInAt ?? '').trim() ||
            new Date().toISOString(),
    };
};

const toCourseIdSet = (catalogCourses = []) =>
    new Set(
        catalogCourses
            .map((course) => String(course?.id ?? '').trim())
            .filter(Boolean),
    );

export const reconcileCatalogLinkedState = (catalogCourses = []) => {
    const validCourseIds = toCourseIdSet(catalogCourses);

    if (validCourseIds.size === 0) {
        return getAppState();
    }

    return updateAppState((currentState) => {
        const currentPurchased = normalizePurchasedCourses(
            currentState.purchasedCourses,
        );
        const currentLearningProgress = normalizeLearningProgress(
            currentState.learningProgress,
        );
        const currentCertificates = normalizeCertificates(
            currentState.certificates,
        );

        const nextPurchased = currentPurchased.filter((purchaseItem) =>
            validCourseIds.has(String(purchaseItem.courseId)),
        );

        const nextLearningProgress = Object.entries(currentLearningProgress).reduce(
            (accumulator, [courseId, value]) => {
                if (validCourseIds.has(String(courseId))) {
                    accumulator[courseId] = value;
                }
                return accumulator;
            },
            {},
        );

        const nextCertificates = currentCertificates.filter((certificate) =>
            validCourseIds.has(String(certificate.courseId)),
        );

        const learningProgressChanged =
            Object.keys(nextLearningProgress).length !==
            Object.keys(currentLearningProgress).length;

        const hasChanges =
            nextPurchased.length !== currentPurchased.length ||
            nextCertificates.length !== currentCertificates.length ||
            learningProgressChanged;

        if (!hasChanges) {
            return currentState;
        }

        return {
            ...currentState,
            purchasedCourses: nextPurchased,
            learningProgress: nextLearningProgress,
            certificates: nextCertificates,
        };
    });
};

export const getAuthSession = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        return normalizeAuthSession(JSON.parse(rawValue));
    } catch {
        return null;
    }
};

export const saveAuthSession = (nextSession) => {
    const normalized = normalizeAuthSession(nextSession);

    if (typeof window === 'undefined') {
        return normalized;
    }

    if (!normalized) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
};

export const clearAuthSession = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
};

const syncStateToAccountIfAuthenticated = (statePayload) => {
    if (typeof window === 'undefined') {
        return;
    }

    const session = getAuthSession();
    if (!session?.accountId) {
        return;
    }

    fetch(`/api/user-account/${session.accountId}/state`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(statePayload),
    }).catch(() => {
        // Keep UI responsive even when sync fails; local state is still updated.
    });
};

export const resetAppState = () => saveAppState(DEFAULT_APP_STATE);

export const loadAppStateFromAccount = (accountPayload = {}) => {
    const profilePayload =
        accountPayload?.profile && typeof accountPayload.profile === 'object'
            ? accountPayload.profile
            : {};

    const nextState = {
        profile: {
            ...DEFAULT_PROFILE,
            ...profilePayload,
        },
        createdCourses: Array.isArray(accountPayload.createdCourses)
            ? accountPayload.createdCourses
            : [],
        purchasedCourses: Array.isArray(accountPayload.purchasedCourses)
            ? accountPayload.purchasedCourses
            : [],
        learningProgress:
            accountPayload.learningProgress &&
            typeof accountPayload.learningProgress === 'object'
                ? accountPayload.learningProgress
                : {},
        certificates: Array.isArray(accountPayload.certificates)
            ? accountPayload.certificates
            : [],
    };

    return saveAppState(nextState);
};

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
    syncStateToAccountIfAuthenticated(normalized);
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
