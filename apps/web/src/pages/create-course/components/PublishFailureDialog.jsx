import styles from './PublishFailureDialog.module.css';

function PublishFailureDialog({ isOpen, message, onClose }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.backdrop} role='dialog' aria-modal='true'>
            <div className={styles.dialog}>
                <p className={styles.badge}>Publish Failed</p>
                <h2>Course was not published</h2>
                <p>{message || 'Publishing failed. Please try again.'}</p>
                <button
                    type='button'
                    className={styles.secondaryButton}
                    onClick={onClose}
                >
                    Back to Wizard
                </button>
            </div>
        </div>
    );
}

export default PublishFailureDialog;
