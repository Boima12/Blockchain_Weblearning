import styles from '../CreateCourse.module.css';

function ReviewStep({ draft, finalPrice }) {
    return (
        <section className={styles.stepPanel}>
            <h2>Review and Publish</h2>
            <p>
                Double-check your course details before publishing to learners.
            </p>

            <div className={styles.reviewGrid}>
                <article>
                    <h3>Basic Information</h3>
                    <p>
                        <strong>Title:</strong> {draft.title || 'Untitled'}
                    </p>
                    <p>
                        <strong>Category:</strong> {draft.category || 'N/A'}
                    </p>
                    <p>
                        <strong>Level:</strong> {draft.level}
                    </p>
                    <p>
                        <strong>Language:</strong> {draft.language}
                    </p>
                </article>

                <article>
                    <h3>Curriculum Summary</h3>
                    <p>
                        <strong>Modules:</strong> {draft.curriculum.length}
                    </p>
                    <p>
                        <strong>Total Lessons:</strong>{' '}
                        {draft.curriculum.reduce(
                            (total, moduleItem) => total + moduleItem.lessons.length,
                            0,
                        )}
                    </p>
                </article>

                <article>
                    <h3>Pricing Summary</h3>
                    <p>
                        <strong>Token:</strong> {draft.token}
                    </p>
                    <p>
                        <strong>Base:</strong>{' '}
                        {Number.parseFloat(draft.price || '0').toFixed(2)}
                    </p>
                    <p>
                        <strong>Final:</strong> {finalPrice.toFixed(2)}
                    </p>
                </article>
            </div>

            <div className={styles.moduleOutline}>
                <h3>Module Outline</h3>
                {draft.curriculum.map((moduleItem, moduleIndex) => (
                    <div key={moduleItem.id} className={styles.outlineItem}>
                        <p>
                            <strong>
                                Module {moduleIndex + 1}: {moduleItem.title || 'Untitled Module'}
                            </strong>
                        </p>
                        <ul>
                            {moduleItem.lessons.map((lessonItem, lessonIndex) => (
                                <li key={lessonItem.id}>
                                    Lesson {lessonIndex + 1}: {lessonItem.title || 'Untitled Lesson'}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ReviewStep;
