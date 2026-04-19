import { FALLBACK_VIDEO_LIBRARY } from './learnCourseConstants';

export const toSafeText = (value, fallback = '') => {
    const textValue = String(value ?? '').trim();
    return textValue || fallback;
};

export const isSupportedUrl = (candidateUrl) => {
    try {
        const parsedUrl = new URL(candidateUrl);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

const sanitizeLesson = (lessonInput, fallbackId, courseTitle, videoIndex = 0) => {
    const rawLessonId = lessonInput?.id;
    const lessonId =
        rawLessonId !== undefined &&
        rawLessonId !== null &&
        String(rawLessonId).trim()
            ? String(rawLessonId)
            : fallbackId;

    const fallbackVideoUrl =
        FALLBACK_VIDEO_LIBRARY[videoIndex % FALLBACK_VIDEO_LIBRARY.length];

    const candidateVideoUrl = toSafeText(lessonInput?.videoUrl, fallbackVideoUrl);
    const videoUrl = isSupportedUrl(candidateVideoUrl)
        ? candidateVideoUrl
        : fallbackVideoUrl;

    return {
        id: lessonId,
        title: toSafeText(lessonInput?.title, `Lesson ${videoIndex + 1}`),
        duration: toSafeText(lessonInput?.duration, '10 min'),
        description: toSafeText(
            lessonInput?.description,
            `Continue this lesson to progress through ${courseTitle}.`,
        ),
        videoUrl,
    };
};

const attachSequence = (modules) => {
    let lessonCounter = 0;

    const modulesWithSequence = modules.map((moduleItem, moduleIndex) => ({
        ...moduleItem,
        lessons: moduleItem.lessons.map((lessonItem, lessonIndex) => {
            lessonCounter += 1;
            return {
                ...lessonItem,
                moduleId: moduleItem.id,
                moduleTitle: moduleItem.title,
                moduleIndex,
                lessonIndex,
                sequenceNumber: lessonCounter,
            };
        }),
    }));

    return {
        modules: modulesWithSequence,
        allLessons: modulesWithSequence.flatMap((moduleItem) => moduleItem.lessons),
    };
};

const buildCatalogCurriculum = (catalogCourse) => {
    const courseIdKey = String(catalogCourse?.id ?? 'catalog');
    const courseTitle = toSafeText(catalogCourse?.title, 'Course');

    const objectiveItems =
        Array.isArray(catalogCourse?.objectives_summary) &&
        catalogCourse.objectives_summary.length > 0
            ? catalogCourse.objectives_summary
                  .map((item) => toSafeText(item))
                  .filter(Boolean)
            : [
                'Understand the core fundamentals from first principles.',
                'Apply ideas in guided, hands-on examples.',
                'Review and prepare for advanced practice.',
            ];

    const roadmapLessons = [
        {
            id: `catalog-${courseIdKey}-intro`,
            title: 'Introduction and Orientation',
            duration: '8 min',
            description: toSafeText(
                catalogCourse?.headline,
                `Welcome to ${courseTitle}. This lesson sets context and outcomes.`,
            ),
            videoUrl: FALLBACK_VIDEO_LIBRARY[0],
        },
        ...objectiveItems.map((objective, index) => ({
            id: `catalog-${courseIdKey}-objective-${index + 1}`,
            title: `Objective ${index + 1}`,
            duration: `${10 + index * 2} min`,
            description: objective,
            videoUrl:
                FALLBACK_VIDEO_LIBRARY[(index + 1) % FALLBACK_VIDEO_LIBRARY.length],
        })),
        {
            id: `catalog-${courseIdKey}-practice`,
            title: 'Practice Session',
            duration: '18 min',
            description:
                'Apply what you have learned in a guided coding exercise.',
            videoUrl: FALLBACK_VIDEO_LIBRARY[2],
        },
        {
            id: `catalog-${courseIdKey}-wrap`,
            title: 'Wrap-up and Next Steps',
            duration: '12 min',
            description:
                'Summarize key ideas and outline the next learning milestones.',
            videoUrl: FALLBACK_VIDEO_LIBRARY[3],
        },
    ];

    const splitPoint = Math.ceil(roadmapLessons.length / 2);

    const modules = [
        {
            id: `catalog-${courseIdKey}-module-1`,
            title: 'Foundations',
            lessons: roadmapLessons.slice(0, splitPoint),
        },
        {
            id: `catalog-${courseIdKey}-module-2`,
            title: 'Build and Complete',
            lessons: roadmapLessons.slice(splitPoint),
        },
    ];

    return attachSequence(modules);
};

const buildCreatedCurriculum = (createdCourse) => {
    const courseIdKey = String(createdCourse?.id ?? 'custom');
    const courseTitle = toSafeText(createdCourse?.title, 'Custom Course');

    const sourceModules =
        Array.isArray(createdCourse?.curriculum) && createdCourse.curriculum.length > 0
            ? createdCourse.curriculum
            : [
                {
                    id: `created-${courseIdKey}-module-1`,
                    title: 'Getting Started',
                    lessons: [
                        {
                            id: `created-${courseIdKey}-lesson-1`,
                            title: 'Course Welcome',
                            duration: '10 min',
                            description:
                                'Set up your environment and get familiar with this course.',
                            videoUrl: FALLBACK_VIDEO_LIBRARY[0],
                        },
                    ],
                },
            ];

    const modules = sourceModules.map((moduleItem, moduleIndex) => {
        const moduleId = toSafeText(
            moduleItem?.id,
            `created-${courseIdKey}-module-${moduleIndex + 1}`,
        );

        const moduleTitle = toSafeText(
            moduleItem?.title,
            `Module ${moduleIndex + 1}`,
        );

        const sourceLessons =
            Array.isArray(moduleItem?.lessons) && moduleItem.lessons.length > 0
                ? moduleItem.lessons
                : [
                    {
                        id: `${moduleId}-lesson-1`,
                        title: 'Lesson 1',
                        duration: '10 min',
                        description: `Continue this lesson to progress through ${courseTitle}.`,
                        videoUrl: FALLBACK_VIDEO_LIBRARY[0],
                    },
                ];

        const lessons = sourceLessons.map((lessonItem, lessonIndex) =>
            sanitizeLesson(
                lessonItem,
                `${moduleId}-lesson-${lessonIndex + 1}`,
                courseTitle,
                lessonIndex,
            ),
        );

        return {
            id: moduleId,
            title: moduleTitle,
            lessons,
        };
    });

    return attachSequence(modules);
};

const getInstructorLabel = (catalogCourse) => {
    const instructorNames = Array.isArray(catalogCourse?.visible_instructors)
        ? catalogCourse.visible_instructors
              .map((instructor) =>
                  toSafeText(instructor?.title || instructor?.name),
              )
              .filter(Boolean)
        : [];

    return instructorNames.length > 0
        ? instructorNames.join(', ')
        : 'Unknown Instructor';
};

export const buildLearningCourseData = (appState, courseIdKey, catalogCourses) => {
    const createdCourse = appState.createdCourses.find(
        (course) => String(course.id) === courseIdKey,
    );

    if (createdCourse) {
        const { modules, allLessons } = buildCreatedCurriculum(createdCourse);

        return {
            status: 'ready',
            source: 'created',
            course: {
                id: String(createdCourse.id),
                title: toSafeText(createdCourse.title, 'Untitled Course'),
                subtitle: toSafeText(createdCourse.subtitle, createdCourse.description),
                instructor: toSafeText(
                    appState.profile.displayName,
                    'Course Creator',
                ),
                imageUrl: toSafeText(createdCourse.thumbnailUrl),
                level: toSafeText(createdCourse.level, 'All Levels'),
                language: toSafeText(createdCourse.language, 'English'),
                category: toSafeText(createdCourse.category, 'Blockchain'),
            },
            modules,
            allLessons,
            startingPercent: Number(
                appState.learningProgress?.[courseIdKey]?.percent ?? 0,
            ),
        };
    }

    const catalogCourse = (Array.isArray(catalogCourses) ? catalogCourses : []).find(
        (course) => String(course?.id) === String(courseIdKey),
    );

    if (!catalogCourse) {
        return {
            status: 'notFound',
            source: 'none',
            course: null,
            modules: [],
            allLessons: [],
            startingPercent: 0,
        };
    }

    const purchaseRecord = appState.purchasedCourses.find(
        (purchaseItem) => String(purchaseItem.courseId) === courseIdKey,
    );

    const isOwnerCourse =
        String(catalogCourse?.ownerWalletAddress ?? '') ===
        String(appState?.profile?.walletAddress ?? '');

    const hasEmbeddedCurriculum =
        Array.isArray(catalogCourse?.curriculum) &&
        catalogCourse.curriculum.length > 0;

    if (!purchaseRecord && !isOwnerCourse) {
        return {
            status: 'locked',
            source: 'catalog',
            course: {
                id: String(catalogCourse.id),
                title: toSafeText(catalogCourse.title, 'Course'),
                subtitle: toSafeText(catalogCourse.headline),
            },
            modules: [],
            allLessons: [],
            startingPercent: 0,
        };
    }

    const { modules, allLessons } = hasEmbeddedCurriculum
        ? buildCreatedCurriculum(catalogCourse)
        : buildCatalogCurriculum(catalogCourse);

    return {
        status: 'ready',
        source: hasEmbeddedCurriculum ? 'created' : 'catalog',
        course: {
            id: String(catalogCourse.id),
            title: toSafeText(catalogCourse.title, 'Course'),
            subtitle: toSafeText(catalogCourse.headline),
            instructor: toSafeText(
                catalogCourse.ownerDisplayName,
                getInstructorLabel(catalogCourse),
            ),
            imageUrl: toSafeText(
                catalogCourse.image_750x422 || catalogCourse.image_304x171,
            ),
            level: toSafeText(catalogCourse.instructional_level, 'All Levels'),
            language: toSafeText(
                catalogCourse.language,
                toSafeText(catalogCourse.locale?.title, 'English'),
            ),
            category: toSafeText(
                catalogCourse.category,
                toSafeText(catalogCourse.context_info?.label?.title, 'Web Development'),
            ),
        },
        modules,
        allLessons,
        startingPercent: Number(
            appState.learningProgress?.[courseIdKey]?.percent ??
                purchaseRecord?.progress ??
                0,
        ),
    };
};

export const getCompletedLessonIds = (
    rawCompletedLessonIds,
    allLessons,
    fallbackPercent = 0,
) => {
    if (!Array.isArray(allLessons) || allLessons.length === 0) {
        return [];
    }

    const lessonIdSet = new Set(
        allLessons.map((lessonItem) => String(lessonItem.id)),
    );

    const explicitCompleted = Array.isArray(rawCompletedLessonIds)
        ? rawCompletedLessonIds
              .map((lessonId) => String(lessonId))
              .filter((lessonId) => lessonIdSet.has(lessonId))
        : [];

    if (explicitCompleted.length > 0) {
        return explicitCompleted;
    }

    const parsedPercent = Number(fallbackPercent);
    if (Number.isNaN(parsedPercent) || parsedPercent <= 0) {
        return [];
    }

    const estimatedCount = Math.min(
        allLessons.length,
        Math.max(1, Math.round((parsedPercent / 100) * allLessons.length)),
    );

    return allLessons
        .slice(0, estimatedCount)
        .map((lessonItem) => String(lessonItem.id));
};
