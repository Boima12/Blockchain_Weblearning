import styles from '../LearnCourse.module.css';

function LearnCourseLessonRail({
    modules,
    totalLessons,
    activeLessonId,
    completedLessonSet,
    onSelectLesson,
}) {
    return (
        <aside className={styles.lessonRail}>
            <div className={styles.lessonRailHeader}>
                <h3>Course Content</h3>
                <span>{totalLessons} lessons</span>
            </div>

            {modules.map((moduleItem) => (
                <article key={moduleItem.id} className={styles.moduleCard}>
                    <h4>{moduleItem.title}</h4>

                    {moduleItem.lessons.map((lessonItem) => {
                        const isActive =
                            String(activeLessonId) === String(lessonItem.id);

                        const isCompleted = completedLessonSet.has(
                            String(lessonItem.id),
                        );

                        return (
                            <button
                                key={lessonItem.id}
                                type='button'
                                className={[
                                    styles.lessonButton,
                                    isActive ? styles.lessonButtonActive : '',
                                    isCompleted ? styles.lessonButtonCompleted : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                onClick={() => onSelectLesson(lessonItem.id)}
                            >
                                <span className={styles.lessonOrder}>
                                    {lessonItem.sequenceNumber}
                                </span>
                                <span className={styles.lessonMeta}>
                                    <strong>{lessonItem.title}</strong>
                                    <small>{lessonItem.duration}</small>
                                </span>
                                <span className={styles.lessonState}>
                                    {isCompleted ? 'Done' : 'Open'}
                                </span>
                            </button>
                        );
                    })}
                </article>
            ))}
        </aside>
    );
}

export default LearnCourseLessonRail;
