const PUBLISHED_COURSES_ENDPOINT = '/api/published-courses';

const FALLBACK_IMAGE =
    'https://img-c.udemycdn.com/course/750x422/851712_fc61_6.jpg';

const toDateLabel = (isoValue) => {
    const parsedDate = new Date(isoValue ?? Date.now());
    if (Number.isNaN(parsedDate.getTime())) {
        return new Date().toISOString().slice(0, 10);
    }

    return parsedDate.toISOString().slice(0, 10);
};

const toSlug = (title) =>
    String(title ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'untitled-course';

const normalizeList = (items, fallbackText) => {
    if (!Array.isArray(items) || items.length === 0) {
        return [fallbackText];
    }

    const filtered = items
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);

    return filtered.length > 0 ? filtered : [fallbackText];
};

const getLessonCount = (curriculum) =>
    Array.isArray(curriculum)
        ? curriculum.reduce(
            (total, moduleItem) =>
                total +
                (Array.isArray(moduleItem?.lessons)
                    ? moduleItem.lessons.length
                    : 0),
            0,
        )
        : 0;

export const buildPublishedCoursePayload = (courseRecord, profile = {}) => {
    const now = new Date().toISOString();
    const updatedAt = courseRecord.updatedAt ?? now;
    const publishedAt = courseRecord.publishedAt ?? now;
    const normalizedImage = courseRecord.thumbnailUrl || FALLBACK_IMAGE;
    const lessonCount = getLessonCount(courseRecord.curriculum);

    const instructorName =
        String(profile.displayName ?? '').trim() || 'Blockchain Instructor';

    const objectives = normalizeList(
        courseRecord.objectives,
        'Understand core course concepts and practice in real projects.',
    );

    const requirements = normalizeList(
        courseRecord.requirements,
        'A computer with internet access and motivation to learn.',
    );

    return {
        id: String(courseRecord.id),
        url: `/course/${toSlug(courseRecord.title)}/`,
        title: String(courseRecord.title ?? 'Untitled Course').trim(),
        _class: 'course',
        rating: Number(courseRecord.rating ?? 4.7),
        headline:
            String(courseRecord.subtitle ?? '').trim() ||
            String(courseRecord.description ?? '').trim(),
        content_info:
            lessonCount > 0
                ? `${lessonCount} lessons`
                : 'Self-paced learning content',
        image_304x171: normalizedImage,
        image_480x270: normalizedImage,
        image_750x422: normalizedImage,
        num_subscribers: Number(courseRecord.num_subscribers ?? 0),
        last_update_date: toDateLabel(updatedAt),
        caption_languages: [String(courseRecord.language ?? 'English')],
        objectives_summary: objectives,
        visible_instructors: [
            {
                id: String(profile.walletAddress ?? 'creator-wallet'),
                name: instructorName,
                title: instructorName,
                display_name: instructorName,
            },
        ],
        instructional_level: String(courseRecord.level ?? 'All Levels'),
        instructional_level_simple: String(courseRecord.level ?? 'All Levels'),

        subtitle: String(courseRecord.subtitle ?? ''),
        category: String(courseRecord.category ?? 'Blockchain'),
        level: String(courseRecord.level ?? 'All Levels'),
        language: String(courseRecord.language ?? 'English'),
        thumbnailUrl: normalizedImage,
        description: String(courseRecord.description ?? ''),
        objectives,
        requirements,
        curriculum: Array.isArray(courseRecord.curriculum)
            ? courseRecord.curriculum
            : [],
        price: Number(courseRecord.price ?? 0),
        discount: Number(courseRecord.discount ?? 0),
        token: String(courseRecord.token ?? 'MATIC'),
        status: 'Published',
        updatedAt,
        publishedAt,
        ownerWalletAddress: String(profile.walletAddress ?? ''),
        ownerDisplayName: instructorName,
    };
};

export const upsertPublishedCourse = async (courseRecord, profile = {}) => {
    const payload = buildPublishedCoursePayload(courseRecord, profile);

    const response = await fetch(PUBLISHED_COURSES_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course: payload }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            errorText ||
                'Unable to publish course to MongoDB. Ensure Vite dev server is running and Mongo connection is valid.',
        );
    }

    return response.json();
};

export const fetchPublishedCourses = async () => {
    const response = await fetch(PUBLISHED_COURSES_ENDPOINT, {
        method: 'GET',
    });

    let payload = {};
    try {
        payload = await response.json();
    } catch {
        payload = {};
    }

    if (!response.ok) {
        throw new Error(
            payload?.error ||
                "can't fetch data from MongoDB",
        );
    }

    if (!Array.isArray(payload?.items)) {
        return [];
    }

    return payload.items;
};
