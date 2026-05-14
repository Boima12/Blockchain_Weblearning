import styles from './CreateCourse.module.css';
import { useNavigate } from 'react-router-dom';
import BasicInfoStep from './components/BasicInfoStep';
import CurriculumStep from './components/CurriculumStep';
import PricingStep from './components/PricingStep';
import ReviewStep from './components/ReviewStep';
import PublishSuccessDialog from './components/PublishSuccessDialog';
import PublishFailureDialog from './components/PublishFailureDialog';
import { STEP_ITEMS } from './createCourseConstants';
import useCreateCourseWizard from './hooks/useCreateCourseWizard';

function Co_CreateCourse() {
    const navigate = useNavigate();

    const {
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
    } = useCreateCourseWizard();

    const feedbackClass =
        feedback.type === 'error'
            ? styles.feedbackError
            : feedback.type === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackInfo;

    const renderStepContent = () => {
        if (activeStep === 0) {
            return (
                <BasicInfoStep
                    draft={draft}
                    errors={errors}
                    onFieldChange={setDraftField}
                    onListFieldChange={setListField}
                    onAddListField={addListField}
                    onRemoveListField={removeListField}
                />
            );
        }

        if (activeStep === 1) {
            return (
                <CurriculumStep
                    draft={draft}
                    errors={errors}
                    onUpdateModuleTitle={updateModuleTitle}
                    onRemoveModule={removeModule}
                    onAddLesson={addLesson}
                    onRemoveLesson={removeLesson}
                    onUpdateLessonField={updateLessonField}
                    onAddModule={addModule}
                />
            );
        }

        if (activeStep === 2) {
            return (
                <PricingStep
                    draft={draft}
                    errors={errors}
                    finalPrice={finalPrice}
                    onFieldChange={setDraftField}
                />
            );
        }

        return <ReviewStep draft={draft} finalPrice={finalPrice} />;
    };

    const onViewPublishedCourse = () => {
        if (!publishedCourseId) {
            return;
        }

        onStartNewDraft();
        navigate(`/Blockchain-Weblearning/courses/${publishedCourseId}`);
    };

    return (
        <main className={styles.main_CreateCourse}>
            <PublishSuccessDialog
                isOpen={Boolean(publishedCourseId)}
                courseId={publishedCourseId}
                onViewCourse={onViewPublishedCourse}
            />
            <PublishFailureDialog
                isOpen={Boolean(publishErrorMessage)}
                message={publishErrorMessage}
                onClose={clearPublishError}
            />
            <section className={styles.wizardShell}>
                <div className={styles.wizardHeader}>
                    <p className={styles.badge}>Creator Studio</p>
                    <h1>Create Course Wizard</h1>
                    <p>
                        Build your course from idea to publish in 4 guided steps.
                    </p>
                </div>

                <nav className={styles.stepper} aria-label='Create Course Steps'>
                    {STEP_ITEMS.map((stepItem, index) => {
                        const className = [
                            styles.stepItem,
                            index === activeStep ? styles.stepActive : '',
                            index < activeStep ? styles.stepCompleted : '',
                        ]
                            .join(' ')
                            .trim();

                        return (
                            <button
                                key={stepItem.id}
                                type='button'
                                className={className}
                                onClick={() => {
                                    if (index <= activeStep) {
                                        setActiveStep(index);
                                        setErrors({});
                                    }
                                }}
                            >
                                <span>{index + 1}</span>
                                {stepItem.label}
                            </button>
                        );
                    })}
                </nav>

                {feedback.message ? (
                    <p className={`${styles.feedback} ${feedbackClass}`}>
                        {feedback.message}
                    </p>
                ) : null}

                {renderStepContent()}

                <footer className={styles.footerActions}>
                    <div className={styles.leftActions}>
                        <button
                            type='button'
                            className={styles.secondaryButton}
                            onClick={onSaveDraft}
                        >
                            Save Draft
                        </button>

                        {publishedCourseId ? (
                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={onStartNewDraft}
                            >
                                Start New Draft
                            </button>
                        ) : null}
                    </div>

                    <div className={styles.rightActions}>
                        <button
                            type='button'
                            className={styles.secondaryButton}
                            onClick={() => navigate('/profile')}
                        >
                            Open Profile
                        </button>

                        {activeStep > 0 ? (
                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={onBack}
                            >
                                Back
                            </button>
                        ) : null}

                        {activeStep < STEP_ITEMS.length - 1 ? (
                            <button
                                type='button'
                                className={styles.primaryButton}
                                onClick={onNext}
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type='button'
                                className={styles.primaryButton}
                                onClick={onPublishCourse}
                            >
                                Publish Course
                            </button>
                        )}
                    </div>
                </footer>
            </section>
        </main>
    );
}

export default Co_CreateCourse;
