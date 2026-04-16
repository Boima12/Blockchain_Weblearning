import { useMemo, useState } from 'react';
import { getAppState, updateAppState } from '../../../utils/appLocalState';
import {
    buildLearningCourseData,
    getCompletedLessonIds,
} from '../learnCourseDataUtils';
import { getLessonMediaSource } from '../learnCourseMediaUtils';

const getCourseCode = (courseIdKey) =>
    courseIdKey
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(-8)
        .toUpperCase() || 'COURSE';

const getPurchaseProgress = (purchasedCourses, courseIdKey) =>
    Number(
        purchasedCourses.find(
            (purchaseItem) => String(purchaseItem.courseId) === courseIdKey,
        )?.progress ?? 0,
    );

function useLearnCoursePlayer(courseId) {
    const courseIdKey = String(courseId ?? '');
    const [appState, setAppState] = useState(() => getAppState());
    const [selectedLessonId, setSelectedLessonId] = useState(null);

    const learningData = useMemo(
        () => buildLearningCourseData(appState, courseIdKey),
        [appState, courseIdKey],
    );

    const allLessons = learningData.allLessons;

    const progressRecord = useMemo(
        () => appState.learningProgress?.[courseIdKey] ?? {},
        [appState.learningProgress, courseIdKey],
    );

    const fallbackPercent = Number(
        progressRecord.percent ?? learningData.startingPercent ?? 0,
    );

    const completedLessonIds = useMemo(
        () =>
            getCompletedLessonIds(
                progressRecord.completedLessonIds,
                allLessons,
                fallbackPercent,
            ),
        [allLessons, fallbackPercent, progressRecord.completedLessonIds],
    );

    const completedLessonSet = useMemo(
        () => new Set(completedLessonIds),
        [completedLessonIds],
    );

    const resolvedSelectedLessonId = useMemo(() => {
        if (allLessons.length === 0) {
            return null;
        }

        if (
            selectedLessonId &&
            allLessons.some(
                (lessonItem) => String(lessonItem.id) === String(selectedLessonId),
            )
        ) {
            return String(selectedLessonId);
        }

        if (
            progressRecord.lastLessonId &&
            allLessons.some(
                (lessonItem) =>
                    String(lessonItem.id) === String(progressRecord.lastLessonId),
            )
        ) {
            return String(progressRecord.lastLessonId);
        }

        return String(allLessons[0].id);
    }, [allLessons, progressRecord.lastLessonId, selectedLessonId]);

    const activeLesson = useMemo(() => {
        if (allLessons.length === 0) {
            return null;
        }

        if (!resolvedSelectedLessonId) {
            return allLessons[0];
        }

        return (
            allLessons.find(
                (lessonItem) =>
                    String(lessonItem.id) === String(resolvedSelectedLessonId),
            ) ?? allLessons[0]
        );
    }, [allLessons, resolvedSelectedLessonId]);

    const activeLessonIndex = useMemo(
        () =>
            activeLesson
                ? allLessons.findIndex(
                      (lessonItem) =>
                          String(lessonItem.id) === String(activeLesson.id),
                  )
                : -1,
        [activeLesson, allLessons],
    );

    const previousLesson =
        activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null;

    const nextLesson =
        activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1
            ? allLessons[activeLessonIndex + 1]
            : null;

    const completedCount = completedLessonSet.size;
    const progressPercent =
        allLessons.length > 0
            ? Math.round((completedCount / allLessons.length) * 100)
            : 0;

    const isActiveLessonCompleted = activeLesson
        ? completedLessonSet.has(String(activeLesson.id))
        : false;

    const activeMediaSource = useMemo(
        () => getLessonMediaSource(activeLesson?.videoUrl),
        [activeLesson?.videoUrl],
    );

    const refreshFromStorage = () => {
        setAppState(getAppState());
    };

    const onSelectLesson = (lessonId) => {
        if (learningData.status !== 'ready') {
            return;
        }

        const normalizedLessonId = String(lessonId);
        setSelectedLessonId(normalizedLessonId);

        let hasChanges = false;

        updateAppState((currentState) => {
            const currentCourseProgress =
                currentState.learningProgress?.[courseIdKey] ?? {};

            if (
                String(currentCourseProgress.lastLessonId ?? '') === normalizedLessonId
            ) {
                return currentState;
            }

            hasChanges = true;

            const purchaseProgress = getPurchaseProgress(
                currentState.purchasedCourses,
                courseIdKey,
            );

            const fallbackProgress = Number(
                currentCourseProgress.percent ?? purchaseProgress,
            );

            const completedIds = getCompletedLessonIds(
                currentCourseProgress.completedLessonIds,
                allLessons,
                fallbackProgress,
            );

            const percentValue =
                allLessons.length > 0
                    ? Math.round((completedIds.length / allLessons.length) * 100)
                    : 0;

            return {
                ...currentState,
                learningProgress: {
                    ...currentState.learningProgress,
                    [courseIdKey]: {
                        ...currentCourseProgress,
                        completedLessonIds: completedIds,
                        lastLessonId: normalizedLessonId,
                        percent: percentValue,
                        totalLessons: allLessons.length,
                        updatedAt: new Date().toISOString(),
                    },
                },
            };
        });

        if (hasChanges) {
            refreshFromStorage();
        }
    };

    const onMarkLessonComplete = () => {
        if (!activeLesson || learningData.status !== 'ready') {
            return;
        }

        const targetLessonId = String(activeLesson.id);
        if (completedLessonSet.has(targetLessonId)) {
            return;
        }

        let hasChanges = false;

        updateAppState((currentState) => {
            const currentCourseProgress =
                currentState.learningProgress?.[courseIdKey] ?? {};

            const purchaseProgress = getPurchaseProgress(
                currentState.purchasedCourses,
                courseIdKey,
            );

            const fallbackProgress = Number(
                currentCourseProgress.percent ?? purchaseProgress,
            );

            const existingCompleted = getCompletedLessonIds(
                currentCourseProgress.completedLessonIds,
                allLessons,
                fallbackProgress,
            );

            if (existingCompleted.includes(targetLessonId)) {
                return currentState;
            }

            hasChanges = true;

            const nextCompleted = [...existingCompleted, targetLessonId];
            const nextPercent =
                allLessons.length > 0
                    ? Math.round((nextCompleted.length / allLessons.length) * 100)
                    : 0;

            const now = new Date();
            const issuedAt = now.toISOString();

            const hasCertificate = currentState.certificates.some(
                (certificate) => String(certificate.courseId) === courseIdKey,
            );

            const courseCode = getCourseCode(courseIdKey);

            const nextCertificates =
                nextPercent >= 100 && !hasCertificate
                    ? [
                        ...currentState.certificates,
                        {
                            id: `CERT-${now.getFullYear()}-${courseCode}-${String(
                                now.getTime(),
                            ).slice(-5)}`,
                            courseId: courseIdKey,
                            issuedAt,
                        },
                    ]
                    : currentState.certificates;

            return {
                ...currentState,
                purchasedCourses: currentState.purchasedCourses.map((purchaseItem) =>
                    String(purchaseItem.courseId) === courseIdKey
                        ? {
                            ...purchaseItem,
                            progress: nextPercent,
                        }
                        : purchaseItem,
                ),
                learningProgress: {
                    ...currentState.learningProgress,
                    [courseIdKey]: {
                        ...currentCourseProgress,
                        completedLessonIds: nextCompleted,
                        lastLessonId: targetLessonId,
                        percent: nextPercent,
                        totalLessons: allLessons.length,
                        updatedAt: issuedAt,
                    },
                },
                certificates: nextCertificates,
            };
        });

        if (hasChanges) {
            refreshFromStorage();
        }
    };

    return {
        courseIdKey,
        status: learningData.status,
        source: learningData.source,
        course: learningData.course,
        modules: learningData.modules,
        allLessons,
        activeLesson,
        activeMediaSource,
        previousLesson,
        nextLesson,
        completedLessonSet,
        completedCount,
        progressPercent,
        isActiveLessonCompleted,
        onSelectLesson,
        onMarkLessonComplete,
    };
}

export default useLearnCoursePlayer;
