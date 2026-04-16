import styles from '../LearnCourse.module.css';

function LearnCourseHero({
    course,
    source,
    progressPercent,
    completedCount,
    totalLessons,
}) {
    return (
        <header className={styles.hero}>
            <div className={styles.heroMedia}>
                {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                ) : (
                    <div className={styles.heroMediaFallback}>
                        <p>Course Workspace</p>
                    </div>
                )}
            </div>

            <div className={styles.heroContent}>
                <p className={styles.kicker}>
                    {source === 'created'
                        ? 'Created Course Workspace'
                        : 'Enrolled Course Workspace'}
                </p>
                <h1>{course.title}</h1>
                {course.subtitle ? <p>{course.subtitle}</p> : null}

                <div className={styles.metaRow}>
                    <span>{course.instructor}</span>
                    <span>{course.level}</span>
                    <span>{course.language}</span>
                    <span>{course.category}</span>
                </div>
            </div>

            <aside className={styles.progressPanel}>
                <p className={styles.progressLabel}>Progress</p>
                <h2>{progressPercent}% complete</h2>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <p className={styles.progressDetails}>
                    {completedCount} of {totalLessons} lessons finished
                </p>
            </aside>
        </header>
    );
}

export default LearnCourseHero;
