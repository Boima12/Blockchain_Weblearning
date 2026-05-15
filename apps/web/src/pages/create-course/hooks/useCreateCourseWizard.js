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
    const [publishProgress, setPublishProgress] = useState(null);

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
        setPublishProgress(null);
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
            setPublishProgress({
                stage: 'uploading-metadata',
                note: 'Uploading course metadata to IPFS...',
                txHash: '',
            });

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

            const priceWei = parseEther(String(publishedRecord.price ?? 0));
            setPublishProgress({
                stage: 'switch-network',
                note: 'MetaMask may ask to switch to Polygon Amoy.',
                txHash: '',
            });

            const result = await createCourseOnChain(metadataCID, priceWei, {
                onStatus: (stage, txHash) => {
                    const progressMap = {
                        'switch-network': 'switch-network',
                        signing: 'signing',
                        submitted: 'submitted',
                        confirmed: 'confirmed',
                    };

                    setPublishProgress((previous) => ({
                        ...(previous ?? {}),
                        stage: progressMap[stage] ?? stage,
                        txHash: txHash ?? previous?.txHash ?? '',
                        note:
                            stage === 'switch-network'
                                ? 'Approve the network switch in MetaMask.'
                                : stage === 'signing'
                                    ? 'Approve the transaction in MetaMask.'
                                    : stage === 'submitted'
                                        ? 'Transaction submitted. Waiting for confirmation...'
                                        : stage === 'confirmed'
                                            ? 'Transaction confirmed. Saving the published course...'
                                            : previous?.note ?? '',
                    }));
                },
            });

            if (result.courseId !== null && result.courseId !== undefined) {
                nextPublishedRecord.onChainCourseId = String(result.courseId);
            }

            setPublishProgress({
                stage: 'saving-mongo',
                note: 'Writing the published course to MongoDB...',
                txHash: result.txHash,
            });

            await upsertPublishedCourse(nextPublishedRecord, profile);
            setPublishErrorMessage('');
            setFeedback({
                type: 'success',
                message: result.courseId
                    ? `Course published on-chain (ID: ${result.courseId}). Tx: ${result.txHash}`
                    : `Course published on-chain. Tx: ${result.txHash}`,
            });

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
            console.error('Course publish failed:', error);
            setPublishErrorMessage(message);
            setPublishProgress(null);
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
        setPublishProgress(null);
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
        setPublishProgress(null);
        setFeedback({
            type: 'info',
            message: 'Started a new draft course.',
        });
    };

    const clearPublishError = () => {
        setPublishErrorMessage('');
        setFeedback(EMPTY_FEEDBACK);
        setPublishProgress(null);
    };

    return {
        activeStep,
        draft,
        errors,
        feedback,
        finalPrice,
        publishedCourseId,
        publishErrorMessage,
        publishProgress,
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
