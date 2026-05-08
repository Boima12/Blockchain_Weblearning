import { useMemo, useState } from 'react';
import usePublishedCourses from '../../../hooks/usePublishedCourses';
import { getAppState, updateAppState } from '../../../utils/appLocalState';
import { upsertPublishedCourse } from '../../../utils/publishedCoursesApi';
import { STEP_ITEMS } from '../../create-course/createCourseConstants';
import {
    buildCourseRecord,
    calculateFinalPrice,
    createDraftTemplate,
    createLesson,
    createModule,
    normalizeDraft,
    validateBasicStep,
    validateCurriculumStep,
    validatePricingStep,
    validateStepByIndex,
} from '../../create-course/createCourseDraftUtils';

const EMPTY_FEEDBACK = { type: 'info', message: '' };

const findEditableCourseById = (courseId, appState, publishedCourses) => {
    const profileWalletAddress = String(appState?.profile?.walletAddress ?? '');

    const localDraft = (appState?.createdCourses ?? []).find(
        (course) => String(course.id) === String(courseId),
    );

    if (localDraft) {
        return {
            sourceType: 'draft',
            course: localDraft,
        };
    }

    const publishedCourse = publishedCourses.find(
        (course) => String(course.id) === String(courseId),
    );

    if (!publishedCourse) {
        return null;
    }

    const ownerWalletAddress = String(
        publishedCourse.ownerWalletAddress ?? '',
    );

    if (ownerWalletAddress && ownerWalletAddress !== profileWalletAddress) {
        return null;
    }

    return {
        sourceType: 'published',
        course: publishedCourse,
    };
};

function useEditCourseWizard(courseId) {
    const {
        courses: publishedCourses,
        isLoading: isCatalogLoading,
        error: catalogError,
    } = usePublishedCourses();

    const appStateSnapshot = useMemo(() => getAppState(), []);

    const sourceEntry = useMemo(
        () => findEditableCourseById(courseId, appStateSnapshot, publishedCourses),
        [appStateSnapshot, courseId, publishedCourses],
    );

    const sourceCourse = sourceEntry?.course ?? null;
    const sourceType = sourceEntry?.sourceType ?? null;

    const initialEmptyDraft = useMemo(() => createDraftTemplate(), []);
    const sourceDraft = useMemo(
        () => (sourceCourse ? normalizeDraft(sourceCourse) : null),
        [sourceCourse],
    );

    const [activeStep, setActiveStep] = useState(0);
    const [draftState, setDraftState] = useState(null);
    const [originalDraftState, setOriginalDraftState] = useState(null);
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState(EMPTY_FEEDBACK);

    const draft = draftState ?? sourceDraft ?? initialEmptyDraft;
    const originalDraft = originalDraftState ?? sourceDraft;

    const finalPrice = useMemo(
        () => calculateFinalPrice(draft.price, draft.discount),
        [draft.discount, draft.price],
    );

    const setDraftField = (field, value) => {
        setDraftState((previous) => ({
            ...(previous ?? draft),
            [field]: value,
        }));
    };

    const setListField = (listName, index, value) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            const nextList = [...baseDraft[listName]];
            nextList[index] = value;
            return {
                ...baseDraft,
                [listName]: nextList,
            };
        });
    };

    const addListField = (listName) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            return {
                ...baseDraft,
                [listName]: [...baseDraft[listName], ''],
            };
        });
    };

    const removeListField = (listName, index) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            if (baseDraft[listName].length <= 1) {
                return baseDraft;
            }

            return {
                ...baseDraft,
                [listName]: baseDraft[listName].filter(
                    (_, currentIndex) => currentIndex !== index,
                ),
            };
        });
    };

    const updateModuleTitle = (moduleId, nextTitle) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            return {
                ...baseDraft,
                curriculum: baseDraft.curriculum.map((moduleItem) =>
                moduleItem.id === moduleId
                    ? { ...moduleItem, title: nextTitle }
                    : moduleItem,
            ),
            };
        });
    };

    const addModule = () => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            return {
                ...baseDraft,
                curriculum: [
                    ...baseDraft.curriculum,
                    createModule(baseDraft.curriculum.length + 1),
                ],
            };
        });
    };

    const removeModule = (moduleId) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            if (baseDraft.curriculum.length <= 1) {
                return baseDraft;
            }

            return {
                ...baseDraft,
                curriculum: baseDraft.curriculum.filter(
                    (moduleItem) => moduleItem.id !== moduleId,
                ),
            };
        });
    };

    const addLesson = (moduleId) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            return {
                ...baseDraft,
                curriculum: baseDraft.curriculum.map((moduleItem) =>
                moduleItem.id === moduleId
                    ? {
                        ...moduleItem,
                        lessons: [...moduleItem.lessons, createLesson()],
                    }
                    : moduleItem,
            ),
            };
        });
    };

    const removeLesson = (moduleId, lessonId) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            return {
                ...baseDraft,
                curriculum: baseDraft.curriculum.map((moduleItem) => {
                if (moduleItem.id !== moduleId) {
                    return moduleItem;
                }

                if (moduleItem.lessons.length <= 1) {
                    return moduleItem;
                }

                return {
                    ...moduleItem,
                    lessons: moduleItem.lessons.filter(
                        (lessonItem) => lessonItem.id !== lessonId,
                    ),
                };
            }),
            };
        });
    };

    const updateLessonField = (moduleId, lessonId, fieldName, value) => {
        setDraftState((previous) => {
            const baseDraft = previous ?? draft;
            return {
                ...baseDraft,
                curriculum: baseDraft.curriculum.map((moduleItem) => {
                if (moduleItem.id !== moduleId) {
                    return moduleItem;
                }

                return {
                    ...moduleItem,
                    lessons: moduleItem.lessons.map((lessonItem) =>
                        lessonItem.id === lessonId
                            ? {
                                ...lessonItem,
                                [fieldName]: value,
                            }
                            : lessonItem,
                    ),
                };
            }),
            };
        });
    };

    const validateCurrentStep = () => {
        const nextErrors = validateStepByIndex(draft, activeStep);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setFeedback({
                type: 'error',
                message: 'Please resolve the highlighted validation issues.',
            });
            return false;
        }

        setFeedback(EMPTY_FEEDBACK);
        return true;
    };

    const validateAllSteps = () => {
        const basicErrors = validateBasicStep(draft);
        if (Object.keys(basicErrors).length > 0) {
            setActiveStep(0);
            setErrors(basicErrors);
            return false;
        }

        const curriculumErrors = validateCurriculumStep(draft);
        if (Object.keys(curriculumErrors).length > 0) {
            setActiveStep(1);
            setErrors(curriculumErrors);
            return false;
        }

        const pricingErrors = validatePricingStep(draft);
        if (Object.keys(pricingErrors).length > 0) {
            setActiveStep(2);
            setErrors(pricingErrors);
            return false;
        }

        setErrors({});
        return true;
    };

    const onNext = () => {
        if (!validateCurrentStep()) {
            return;
        }

        setActiveStep((previous) =>
            Math.min(previous + 1, STEP_ITEMS.length - 1),
        );
        setFeedback(EMPTY_FEEDBACK);
    };

    const onBack = () => {
        setActiveStep((previous) => Math.max(previous - 1, 0));
        setErrors({});
        setFeedback(EMPTY_FEEDBACK);
    };

    const onResetChanges = () => {
        if (!originalDraft) {
            return;
        }

        const normalized = normalizeDraft(originalDraft);
        setDraftState(normalized);
        setOriginalDraftState(normalized);
        setErrors({});
        setFeedback({
            type: 'info',
            message: 'Changes reset to the latest saved version.',
        });
    };

    const onSaveChanges = async () => {
        if (!sourceCourse) {
            setFeedback({
                type: 'error',
                message: 'Course not found. Please return to your profile page.',
            });
            return;
        }

        if (!validateAllSteps()) {
            setFeedback({
                type: 'error',
                message: 'Please complete required fields before saving.',
            });
            return;
        }

        const nextStatus = sourceCourse.status ?? 'Published';
        const nextCourseRecord = buildCourseRecord(draft, nextStatus);

        if (nextStatus === 'Published' && sourceCourse.publishedAt) {
            nextCourseRecord.publishedAt = sourceCourse.publishedAt;
        }

        if (sourceType === 'published') {
            try {
                const profile = getAppState().profile;
                await upsertPublishedCourse(nextCourseRecord, profile);
            } catch (error) {
                setFeedback({
                    type: 'error',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unable to update published course in MongoDB.',
                });
                return;
            }
        } else {
            updateAppState((currentState) => ({
                ...currentState,
                createdCourses: currentState.createdCourses.map((course) =>
                    String(course.id) === String(sourceCourse.id)
                        ? {
                            ...course,
                            ...nextCourseRecord,
                        }
                        : course,
                ),
            }));
        }

        const normalizedSaved = normalizeDraft(nextCourseRecord);
        setOriginalDraftState(normalizedSaved);
        setDraftState(normalizedSaved);
        setFeedback({
            type: 'success',
            message:
                sourceType === 'published'
                    ? 'Published course updated in MongoDB successfully.'
                    : 'Course updated successfully.',
        });
    };

    return {
        hasCourse: Boolean(sourceCourse),
        isCatalogLoading,
        catalogError,
        sourceCourse,
        activeStep,
        draft,
        errors,
        feedback,
        finalPrice,
        setActiveStep,
        setErrors,
        setDraftField,
        setListField,
        addListField,
        removeListField,
        updateModuleTitle,
        addModule,
        removeModule,
        addLesson,
        removeLesson,
        updateLessonField,
        onNext,
        onBack,
        onResetChanges,
        onSaveChanges,
    };
}

export default useEditCourseWizard;
