import styles from '../LearnCourse.module.css';

function LearnCoursePlayerPanel({
    activeLesson,
    activeMediaSource,
    previousLesson,
    nextLesson,
    isActiveLessonCompleted,
    progressPercent,
    onSelectLesson,
    onMarkLessonComplete,
    onOpenCertificate,
    onOpenProfile,
}) {
    if (!activeLesson) {
        return (
            <article className={styles.playerPanel}>
                <div className={styles.playerFallback}>
                    <h4>No lessons found for this course</h4>
                </div>
            </article>
        );
    }

    return (
        <article className={styles.playerPanel}>
            <div className={styles.lessonHeader}>
                <p>
                    Module {activeLesson.moduleIndex + 1} - Lesson{' '}
                    {activeLesson.lessonIndex + 1}
                </p>
                <h3>{activeLesson.title}</h3>
                <p>{activeLesson.description}</p>
            </div>

            <div className={styles.playerArea}>
                {activeMediaSource ? (
                    activeMediaSource.type === 'video' ? (
                        <video
                            controls
                            className={styles.lessonVideo}
                            src={activeMediaSource.src}
                        />
                    ) : (
                        <iframe
                            title={activeLesson.title}
                            src={activeMediaSource.src}
                            className={styles.lessonFrame}
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                            allowFullScreen
                        />
                    )
                ) : (
                    <div className={styles.playerFallback}>
                        <h4>No media available for this lesson</h4>
                        <p>
                            Add or update the lesson video URL in Edit Course.
                        </p>
                    </div>
                )}
            </div>

            {activeLesson.videoUrl ? (
                <a
                    className={styles.videoLink}
                    href={activeLesson.videoUrl}
                    target='_blank'
                    rel='noreferrer'
                >
                    Open lesson media in a new tab
                </a>
            ) : null}

            <div className={styles.playerActions}>
                <button
                    type='button'
                    className={styles.ghostButton}
                    disabled={!previousLesson}
                    onClick={() =>
                        previousLesson ? onSelectLesson(previousLesson.id) : null
                    }
                >
                    Previous Lesson
                </button>

                <button
                    type='button'
                    className={styles.ghostButton}
                    disabled={!nextLesson}
                    onClick={() =>
                        nextLesson ? onSelectLesson(nextLesson.id) : null
                    }
                >
                    Next Lesson
                </button>

                <button
                    type='button'
                    className={
                        isActiveLessonCompleted
                            ? styles.primaryButtonMuted
                            : styles.primaryButton
                    }
                    disabled={isActiveLessonCompleted}
                    onClick={onMarkLessonComplete}
                >
                    {isActiveLessonCompleted
                        ? 'Lesson Completed'
                        : 'Mark Lesson Complete'}
                </button>
            </div>

            {progressPercent >= 100 ? (
                <section className={styles.completionCard}>
                    <p className={styles.stateBadge}>Completed</p>
                    <h4>Course finished successfully</h4>
                    <p>
                        Great work. Your certificate is now unlocked and
                        available in Profile.
                    </p>
                    <div className={styles.stateActions}>
                        <button
                            type='button'
                            className={styles.primaryButton}
                            onClick={onOpenCertificate}
                        >
                            Open Certificate
                        </button>
                        <button
                            type='button'
                            className={styles.ghostButton}
                            onClick={onOpenProfile}
                        >
                            Open Profile
                        </button>
                    </div>
                </section>
            ) : null}
        </article>
    );
}

export default LearnCoursePlayerPanel;
