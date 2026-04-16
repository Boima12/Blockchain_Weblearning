import styles from '../create-course/CreateCourse.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import BasicInfoStep from '../create-course/components/BasicInfoStep';
import CurriculumStep from '../create-course/components/CurriculumStep';
import PricingStep from '../create-course/components/PricingStep';
import ReviewStep from '../create-course/components/ReviewStep';
import { STEP_ITEMS } from '../create-course/createCourseConstants';
import useEditCourseWizard from './hooks/useEditCourseWizard';

function Co_EditCourse() {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const {
        hasCourse,
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
    } = useEditCourseWizard(courseId);

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

    if (!hasCourse) {
        return (
            <main className={styles.main_CreateCourse}>
                <section className={styles.wizardShell}>
                    <div className={styles.wizardHeader}>
                        <p className={styles.badge}>Edit Course</p>
                        <h1>Course Not Found</h1>
                        <p>
                            This course does not exist in your created course list.
                        </p>
                    </div>

                    <footer className={styles.footerActions}>
                        <div className={styles.leftActions}>
                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={() => navigate('/profile')}
                            >
                                Back to Profile
                            </button>
                            <button
                                type='button'
                                className={styles.primaryButton}
                                onClick={() => navigate('/create-course')}
                            >
                                Create New Course
                            </button>
                        </div>
                    </footer>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.main_CreateCourse}>
            <section className={styles.wizardShell}>
                <div className={styles.wizardHeader}>
                    <p className={styles.badge}>Creator Studio</p>
                    <h1>Edit Course Wizard</h1>
                    <p>
                        Editing: <strong>{sourceCourse?.title ?? 'Untitled Course'}</strong> ({sourceCourse?.status ?? 'Draft'})
                    </p>
                </div>

                <nav className={styles.stepper} aria-label='Edit Course Steps'>
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
                            onClick={onResetChanges}
                        >
                            Reset Changes
                        </button>
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
                                onClick={onSaveChanges}
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                </footer>
            </section>
        </main>
    );
}

export default Co_EditCourse;