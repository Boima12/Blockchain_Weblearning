import styles from './PublishSuccessDialog.module.css';

function PublishSuccessDialog({ isOpen, courseId, onViewCourse }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.backdrop} role='dialog' aria-modal='true'>
            <div className={styles.dialog}>
                <p className={styles.badge}>Publish Complete</p>
                <h2>Course published</h2>
                <p>Course published to MongoDB successfully.</p>
                <button
                    type='button'
                    className={styles.primaryButton}
                    onClick={onViewCourse}
                    disabled={!courseId}
                >
                    Open Course Details
                </button>
            </div>
        </div>
    );
}

export default PublishSuccessDialog;
