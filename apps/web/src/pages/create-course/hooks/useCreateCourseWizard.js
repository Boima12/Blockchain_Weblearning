import { useMemo, useState } from 'react';
import { getAppState, updateAppState } from '../../../utils/appLocalState';
import { upsertPublishedCourse } from '../../../utils/publishedCoursesApi';
import { uploadCourseMetadata } from '../../../utils/ipfsApi';
import { createCourseOnChain } from '../../../web3/ethersClient';
import { parseEther } from 'ethers';
import { STEP_ITEMS } from '../createCourseConstants';
import {
    buildCourseRecord,
    calculateFinalPrice,
    clearDraftStorage,
    createDraftTemplate,
    createLesson,
    createModule,
    readDraftStorage,
    upsertCreatedCourse,
    validateBasicStep,
    validateCurriculumStep,
    validatePricingStep,
    validateStepByIndex,
    writeDraftStorage,
} from '../createCourseDraftUtils';

const EMPTY_FEEDBACK = { type: 'info', message: '' };

function useCreateCourseWizard() {
    const [activeStep, setActiveStep] = useState(0);
    const [draft, setDraft] = useState(() => readDraftStorage());
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState(EMPTY_FEEDBACK);
    const [publishedCourseId, setPublishedCourseId] = useState(null);
    const [publishErrorMessage, setPublishErrorMessage] = useState('');

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

    const setInfoFeedback = () => {
        setFeedback(EMPTY_FEEDBACK);
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

        setInfoFeedback();
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

    const persistDraftCourse = () => {
        const draftRecord = buildCourseRecord(draft, 'Draft');

        updateAppState((currentState) => ({
            ...currentState,
            createdCourses: upsertCreatedCourse(
                currentState.createdCourses,
                draftRecord,
            ),
        }));

        return draftRecord;
    };

    const onNext = () => {
        if (!validateCurrentStep()) {
            return;
        }

        setActiveStep((previous) =>
            Math.min(previous + 1, STEP_ITEMS.length - 1),
        );
        setInfoFeedback();
    };

    const onBack = () => {
        setActiveStep((previous) => Math.max(previous - 1, 0));
        setErrors({});
        setInfoFeedback();
    };

    const onSaveDraft = () => {
        const draftRecord = persistDraftCourse();

        const nextDraft = {
            ...draft,
            status: 'Draft',
            updatedAt: draftRecord.updatedAt,
            publishedAt: null,
        };

        setDraft(nextDraft);
        writeDraftStorage(nextDraft);
        setFeedback({
            type: 'success',
            message: 'Draft saved successfully. You can continue later.',
        });
        setPublishedCourseId(null);
        setPublishErrorMessage('');
    };

    const onPublishCourse = async () => {
        if (!validateAllSteps()) {
            setFeedback({
                type: 'error',
                message: 'Please complete required fields before publishing.',
            });
            return;
        }

        const publishedRecord = buildCourseRecord(draft, 'Published');

        try {
            const profile = getAppState().profile;
            const ipfsPayload = await uploadCourseMetadata({
                course: publishedRecord,
                profile,
            });

            const metadataCID = `ipfs://${ipfsPayload.cid}`;
            const metadataUrl = String(ipfsPayload.ipfsUrl ?? '').trim();

            const nextPublishedRecord = {
                ...publishedRecord,
                metadataCID,
                metadataUrl,
            };

            await upsertPublishedCourse(nextPublishedRecord, profile);
            setPublishErrorMessage('');

            // Try to publish on-chain (best-effort). Uses placeholder metadata CID from env when available.
            try {
                const priceWei = parseEther(String(publishedRecord.price ?? 0));
                const result = await createCourseOnChain(metadataCID, priceWei);
                if (result.courseId !== null && result.courseId !== undefined) {
                    const onChainCourseId = String(result.courseId);
                    await upsertPublishedCourse(
                        {
                            ...nextPublishedRecord,
                            onChainCourseId,
                        },
                        profile,
                    );
                }
                setFeedback({
                    type: 'success',
                    message: result.courseId
                        ? `Course published on-chain (ID: ${result.courseId}). Tx: ${result.txHash}`
                        : `Course published on-chain. Tx: ${result.txHash}`,
                });
            } catch (chainError) {
                console.error('On-chain publish failed:', chainError);
                // Non-fatal: keep MongoDB publish as primary source
                setFeedback((prev) => ({
                    type: 'info',
                    message:
                        prev?.message || 'Course published, but on-chain publish failed or was skipped.',
                }));
            }

            updateAppState((currentState) => ({
                ...currentState,
                createdCourses: currentState.createdCourses.filter(
                    (course) =>
                        String(course.id) !== String(publishedRecord.id),
                ),
            }));
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Publishing failed. Ensure Vite dev server is running with a valid MongoDB connection.';
            setPublishErrorMessage(message);
            setFeedback({
                type: 'error',
                message,
            });
            return;
        }

        const nextDraft = {
            ...draft,
            status: 'Published',
            updatedAt: publishedRecord.updatedAt,
            publishedAt: publishedRecord.publishedAt,
        };

        clearDraftStorage();
        setDraft(nextDraft);
        setPublishedCourseId(publishedRecord.id);
        setFeedback({
            type: 'success',
            message:
                'Course published to MongoDB successfully.',
        });
    };

    const onStartNewDraft = () => {
        const freshDraft = createDraftTemplate();
        setDraft(freshDraft);
        writeDraftStorage(freshDraft);
        setActiveStep(0);
        setErrors({});
        setPublishedCourseId(null);
        setPublishErrorMessage('');
        setFeedback({
            type: 'info',
            message: 'Started a new draft course.',
        });
    };

    const clearPublishError = () => {
        setPublishErrorMessage('');
        setFeedback(EMPTY_FEEDBACK);
    };

    return {
        activeStep,
        draft,
        errors,
        feedback,
        finalPrice,
        publishedCourseId,
        publishErrorMessage,
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
        onSaveDraft,
        onPublishCourse,
        onStartNewDraft,
        clearPublishError,
    };
}

export default useCreateCourseWizard;
