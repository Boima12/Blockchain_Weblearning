import { CREATE_COURSE_DRAFT_KEY } from './createCourseConstants';

export const buildId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createLesson = () => ({
    id: buildId(),
    title: '',
    videoUrl: '',
    duration: '',
    description: '',
});

export const createModule = (position = 1) => ({
    id: buildId(),
    title: `Module ${position}`,
    lessons: [createLesson()],
});

export const createDraftTemplate = () => ({
    id: buildId(),
    title: '',
    subtitle: '',
    category: '',
    level: 'All Levels',
    language: 'English',
    thumbnailUrl: '',
    description: '',
    objectives: [''],
    requirements: [''],
    curriculum: [createModule(1)],
    price: '49.99',
    discount: '0',
    token: 'MATIC',
    status: 'Draft',
    updatedAt: null,
    publishedAt: null,
});

export const normalizeDraft = (input = {}) => {
    const normalizedCurriculum =
        Array.isArray(input.curriculum) && input.curriculum.length > 0
            ? input.curriculum.map((moduleItem, index) => ({
                id: moduleItem.id ?? buildId(),
                title: moduleItem.title ?? `Module ${index + 1}`,
                lessons:
                        Array.isArray(moduleItem.lessons) &&
                        moduleItem.lessons.length > 0
                            ? moduleItem.lessons.map((lessonItem) => ({
                                id: lessonItem.id ?? buildId(),
                                title: lessonItem.title ?? '',
                                videoUrl: lessonItem.videoUrl ?? '',
                                duration: lessonItem.duration ?? '',
                                description: lessonItem.description ?? '',
                            }))
                            : [createLesson()],
            }))
            : [createModule(1)];

    const objectives =
        Array.isArray(input.objectives) && input.objectives.length > 0
            ? input.objectives
            : [''];

    const requirements =
        Array.isArray(input.requirements) && input.requirements.length > 0
            ? input.requirements
            : [''];

    return {
        id: input.id ?? buildId(),
        title: input.title ?? '',
        subtitle: input.subtitle ?? '',
        category: input.category ?? '',
        level: input.level ?? 'All Levels',
        language: input.language ?? 'English',
        thumbnailUrl: input.thumbnailUrl ?? '',
        description: input.description ?? '',
        objectives,
        requirements,
        curriculum: normalizedCurriculum,
        price: String(input.price ?? '49.99'),
        discount: String(input.discount ?? '0'),
        token: input.token ?? 'MATIC',
        status: input.status ?? 'Draft',
        updatedAt: input.updatedAt ?? null,
        publishedAt: input.publishedAt ?? null,
    };
};

export const readDraftStorage = () => {
    if (typeof window === 'undefined') {
        return createDraftTemplate();
    }

    try {
        const raw = window.localStorage.getItem(CREATE_COURSE_DRAFT_KEY);
        if (!raw) {
            return createDraftTemplate();
        }

        return normalizeDraft(JSON.parse(raw));
    } catch {
        return createDraftTemplate();
    }
};

export const writeDraftStorage = (draftValue) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(
        CREATE_COURSE_DRAFT_KEY,
        JSON.stringify(draftValue),
    );
};

export const clearDraftStorage = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(CREATE_COURSE_DRAFT_KEY);
};

export const isValidUrl = (candidateUrl) => {
    if (!candidateUrl) {
        return true;
    }

    try {
        const parsedUrl = new URL(candidateUrl);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

export const calculateFinalPrice = (priceValue, discountValue) => {
    const price = Number.parseFloat(priceValue);
    const discount = Number.parseFloat(discountValue);

    if (Number.isNaN(price) || price <= 0) {
        return 0;
    }

    const normalizedDiscount = Number.isNaN(discount)
        ? 0
        : Math.min(Math.max(discount, 0), 90);

    const discountedPrice = price * (1 - normalizedDiscount / 100);
    return Math.max(0, Number(discountedPrice.toFixed(2)));
};

export const validateBasicStep = (draft) => {
    const nextErrors = {};

    if (!draft.title.trim()) {
        nextErrors.title = 'Course title is required.';
    } else if (draft.title.trim().length < 8) {
        nextErrors.title = 'Course title should have at least 8 characters.';
    }

    if (!draft.category.trim()) {
        nextErrors.category = 'Please choose a category.';
    }

    if (!draft.description.trim()) {
        nextErrors.description = 'Course description is required.';
    } else if (draft.description.trim().length < 80) {
        nextErrors.description =
            'Course description should have at least 80 characters.';
    }

    if (!isValidUrl(draft.thumbnailUrl.trim())) {
        nextErrors.thumbnailUrl = 'Thumbnail URL must be a valid http/https URL.';
    }

    const objectiveCount = draft.objectives.filter((item) => item.trim()).length;
    if (objectiveCount < 2) {
        nextErrors.objectives =
            'Add at least 2 non-empty learning objectives.';
    }

    const requirementCount = draft.requirements.filter((item) => item.trim()).length;
    if (requirementCount < 1) {
        nextErrors.requirements = 'Add at least 1 requirement.';
    }

    return nextErrors;
};

export const validateCurriculumStep = (draft) => {
    const nextErrors = {};

    if (!Array.isArray(draft.curriculum) || draft.curriculum.length === 0) {
        nextErrors.curriculum = 'Add at least one module to your curriculum.';
        return nextErrors;
    }

    let invalidModule = false;
    let invalidLesson = false;

    draft.curriculum.forEach((moduleItem) => {
        if (!moduleItem.title.trim()) {
            invalidModule = true;
        }

        if (!Array.isArray(moduleItem.lessons) || moduleItem.lessons.length === 0) {
            invalidLesson = true;
            return;
        }

        moduleItem.lessons.forEach((lessonItem) => {
            if (!lessonItem.title.trim() || !lessonItem.videoUrl.trim()) {
                invalidLesson = true;
            }

            if (!isValidUrl(lessonItem.videoUrl.trim())) {
                invalidLesson = true;
            }
        });
    });

    if (invalidModule) {
        nextErrors.curriculumModule = 'Each module must have a title.';
    }

    if (invalidLesson) {
        nextErrors.curriculumLesson =
            'Each lesson needs a title and a valid video URL.';
    }

    return nextErrors;
};

export const validatePricingStep = (draft) => {
    const nextErrors = {};
    const parsedPrice = Number.parseFloat(draft.price);
    const parsedDiscount = Number.parseFloat(draft.discount);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        nextErrors.price = 'Price must be greater than 0.';
    }

    if (
        Number.isNaN(parsedDiscount) ||
        parsedDiscount < 0 ||
        parsedDiscount > 90
    ) {
        nextErrors.discount = 'Discount must be between 0 and 90.';
    }

    return nextErrors;
};

export const validateStepByIndex = (draft, stepIndex) => {
    if (stepIndex === 0) {
        return validateBasicStep(draft);
    }

    if (stepIndex === 1) {
        return validateCurriculumStep(draft);
    }

    if (stepIndex === 2) {
        return validatePricingStep(draft);
    }

    return {};
};

export const buildCourseRecord = (draft, status) => {
    const now = new Date().toISOString();
    const objectiveItems = draft.objectives
        .map((item) => item.trim())
        .filter(Boolean);

    const requirementItems = draft.requirements
        .map((item) => item.trim())
        .filter(Boolean);

    const curriculumItems = draft.curriculum.map((moduleItem) => ({
        id: moduleItem.id,
        title: moduleItem.title.trim(),
        lessons: moduleItem.lessons.map((lessonItem) => ({
            id: lessonItem.id,
            title: lessonItem.title.trim(),
            videoUrl: lessonItem.videoUrl.trim(),
            duration: lessonItem.duration.trim(),
            description: lessonItem.description.trim(),
        })),
    }));

    const price = Number.parseFloat(draft.price);
    const discount = Number.parseFloat(draft.discount);

    return {
        id: draft.id,
        title: draft.title.trim() || 'Untitled Course',
        subtitle: draft.subtitle.trim(),
        category: draft.category,
        level: draft.level,
        language: draft.language,
        thumbnailUrl: draft.thumbnailUrl.trim(),
        description: draft.description.trim(),
        objectives: objectiveItems,
        requirements: requirementItems,
        curriculum: curriculumItems,
        price: Number.isNaN(price) ? 0 : price,
        discount: Number.isNaN(discount) ? 0 : discount,
        token: draft.token,
        status,
        updatedAt: now,
        publishedAt: status === 'Published' ? now : null,
    };
};

export const upsertCreatedCourse = (createdCourses, nextCourse) => {
    const index = createdCourses.findIndex(
        (course) => String(course.id) === String(nextCourse.id),
    );

    if (index === -1) {
        return [nextCourse, ...createdCourses];
    }

    const nextList = [...createdCourses];
    nextList[index] = {
        ...nextList[index],
        ...nextCourse,
    };
    return nextList;
};
