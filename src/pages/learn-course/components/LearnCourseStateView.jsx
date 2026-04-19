import styles from '../LearnCourse.module.css';

function LearnCourseStateView({
    badge,
    title,
    description,
    primaryLabel,
    onPrimaryClick,
    secondaryLabel,
    onSecondaryClick,
}) {
    return (
        <main className={styles.main_LearnCourse}>
            <section className={styles.stateCard}>
                <p className={styles.stateBadge}>{badge}</p>
                <h1>{title}</h1>
                <p>{description}</p>
                <div className={styles.stateActions}>
                    <button
                        type='button'
                        className={styles.primaryButton}
                        onClick={onPrimaryClick}
                    >
                        {primaryLabel}
                    </button>
                    <button
                        type='button'
                        className={styles.ghostButton}
                        onClick={onSecondaryClick}
                    >
                        {secondaryLabel}
                    </button>
                </div>
            </section>
        </main>
    );
}

export default LearnCourseStateView;
