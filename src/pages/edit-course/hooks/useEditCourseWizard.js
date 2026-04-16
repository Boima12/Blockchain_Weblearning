import { useMemo, useState } from 'react';
import { getAppState, updateAppState } from '../../../utils/appLocalState';
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

const findCreatedCourseById = (courseId) =>
    getAppState().createdCourses.find(
        (course) => String(course.id) === String(courseId),
    );

function useEditCourseWizard(courseId) {
    const sourceCourse = useMemo(
        () => findCreatedCourseById(courseId),
        [courseId],
    );

    const [activeStep, setActiveStep] = useState(0);
    const [draft, setDraft] = useState(() =>
        sourceCourse ? normalizeDraft(sourceCourse) : createDraftTemplate(),
    );
    const [originalDraft, setOriginalDraft] = useState(() =>
        sourceCourse ? normalizeDraft(sourceCourse) : null,
    );
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState(EMPTY_FEEDBACK);

    const finalPrice = useMemo(
        () => calculateFinalPrice(draft.price, draft.discount),
        [draft.discount, draft.price],
    );

    const setDraftField = (field, value) => {
        setDraft((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const setListField = (listName, index, value) => {
        setDraft((previous) => {
            const nextList = [...previous[listName]];
            nextList[index] = value;
            return {
                ...previous,
                [listName]: nextList,
            };
        });
    };

    const addListField = (listName) => {
        setDraft((previous) => ({
            ...previous,
            [listName]: [...previous[listName], ''],
        }));
    };

    const removeListField = (listName, index) => {
        setDraft((previous) => {
            if (previous[listName].length <= 1) {
                return previous;
            }

            return {
                ...previous,
                [listName]: previous[listName].filter(
                    (_, currentIndex) => currentIndex !== index,
                ),
            };
        });
    };

    const updateModuleTitle = (moduleId, nextTitle) => {
        setDraft((previous) => ({
            ...previous,
            curriculum: previous.curriculum.map((moduleItem) =>
                moduleItem.id === moduleId
                    ? { ...moduleItem, title: nextTitle }
                    : moduleItem,
            ),
        }));
    };

    const addModule = () => {
        setDraft((previous) => ({
            ...previous,
            curriculum: [
                ...previous.curriculum,
                createModule(previous.curriculum.length + 1),
            ],
        }));
    };

    const removeModule = (moduleId) => {
        setDraft((previous) => {
            if (previous.curriculum.length <= 1) {
                return previous;
            }

            return {
                ...previous,
                curriculum: previous.curriculum.filter(
                    (moduleItem) => moduleItem.id !== moduleId,
                ),
            };
        });
    };

    const addLesson = (moduleId) => {
        setDraft((previous) => ({
            ...previous,
            curriculum: previous.curriculum.map((moduleItem) =>
                moduleItem.id === moduleId
                    ? {
                        ...moduleItem,
                        lessons: [...moduleItem.lessons, createLesson()],
                    }
                    : moduleItem,
            ),
        }));
    };

    const removeLesson = (moduleId, lessonId) => {
        setDraft((previous) => ({
            ...previous,
            curriculum: previous.curriculum.map((moduleItem) => {
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
        }));
    };

    const updateLessonField = (moduleId, lessonId, fieldName, value) => {
        setDraft((previous) => ({
            ...previous,
            curriculum: previous.curriculum.map((moduleItem) => {
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
        }));
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

        setDraft(normalizeDraft(originalDraft));
        setErrors({});
        setFeedback({
            type: 'info',
            message: 'Changes reset to the latest saved version.',
        });
    };

    const onSaveChanges = () => {
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

        const normalizedSaved = normalizeDraft(nextCourseRecord);
        setOriginalDraft(normalizedSaved);
        setDraft(normalizedSaved);
        setFeedback({
            type: 'success',
            message: 'Course updated successfully.',
        });
    };

    return {
        hasCourse: Boolean(sourceCourse),
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
