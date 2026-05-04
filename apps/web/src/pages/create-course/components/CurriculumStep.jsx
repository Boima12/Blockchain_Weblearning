import styles from '../CreateCourse.module.css';

function CurriculumStep({
    draft,
    errors,
    onUpdateModuleTitle,
    onRemoveModule,
    onAddLesson,
    onRemoveLesson,
    onUpdateLessonField,
    onAddModule,
}) {
    return (
        <section className={styles.stepPanel}>
            <h2>Curriculum Builder</h2>
            <p>
                Organize your modules and lessons. Every lesson needs a title
                and video URL.
            </p>

            {errors.curriculum ? (
                <p className={styles.errorText}>{errors.curriculum}</p>
            ) : null}
            {errors.curriculumModule ? (
                <p className={styles.errorText}>{errors.curriculumModule}</p>
            ) : null}
            {errors.curriculumLesson ? (
                <p className={styles.errorText}>{errors.curriculumLesson}</p>
            ) : null}

            <div className={styles.moduleStack}>
                {draft.curriculum.map((moduleItem, moduleIndex) => (
                    <article key={moduleItem.id} className={styles.moduleCard}>
                        <div className={styles.moduleHeader}>
                            <h3>Module {moduleIndex + 1}</h3>
                            <button
                                type='button'
                                disabled={draft.curriculum.length <= 1}
                                onClick={() => onRemoveModule(moduleItem.id)}
                            >
                                Remove Module
                            </button>
                        </div>

                        <label className={styles.field}>
                            Module Title *
                            <input
                                type='text'
                                value={moduleItem.title}
                                onChange={(event) =>
                                    onUpdateModuleTitle(
                                        moduleItem.id,
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <div className={styles.lessonStack}>
                            {moduleItem.lessons.map((lessonItem, lessonIndex) => (
                                <div key={lessonItem.id} className={styles.lessonCard}>
                                    <div className={styles.lessonHeader}>
                                        <h4>Lesson {lessonIndex + 1}</h4>
                                        <button
                                            type='button'
                                            disabled={moduleItem.lessons.length <= 1}
                                            onClick={() =>
                                                onRemoveLesson(
                                                    moduleItem.id,
                                                    lessonItem.id,
                                                )
                                            }
                                        >
                                            Remove Lesson
                                        </button>
                                    </div>

                                    <div className={styles.lessonGrid}>
                                        <label className={styles.field}>
                                            Lesson Title *
                                            <input
                                                type='text'
                                                value={lessonItem.title}
                                                onChange={(event) =>
                                                    onUpdateLessonField(
                                                        moduleItem.id,
                                                        lessonItem.id,
                                                        'title',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className={styles.field}>
                                            Video URL *
                                            <input
                                                type='url'
                                                value={lessonItem.videoUrl}
                                                onChange={(event) =>
                                                    onUpdateLessonField(
                                                        moduleItem.id,
                                                        lessonItem.id,
                                                        'videoUrl',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className={styles.field}>
                                            Duration
                                            <input
                                                type='text'
                                                value={lessonItem.duration}
                                                onChange={(event) =>
                                                    onUpdateLessonField(
                                                        moduleItem.id,
                                                        lessonItem.id,
                                                        'duration',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder='e.g. 12:30'
                                            />
                                        </label>

                                        <label className={`${styles.field} ${styles.lessonDescription}`}>
                                            Lesson Description
                                            <textarea
                                                value={lessonItem.description}
                                                onChange={(event) =>
                                                    onUpdateLessonField(
                                                        moduleItem.id,
                                                        lessonItem.id,
                                                        'description',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type='button'
                            className={styles.addLessonButton}
                            onClick={() => onAddLesson(moduleItem.id)}
                        >
                            + Add Lesson
                        </button>
                    </article>
                ))}
            </div>

            <button
                type='button'
                className={styles.addModuleButton}
                onClick={onAddModule}
            >
                + Add New Module
            </button>
        </section>
    );
}

export default CurriculumStep;
