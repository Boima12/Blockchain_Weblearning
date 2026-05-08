import styles from '../CreateCourse.module.css';
import {
    CATEGORY_OPTIONS,
    LANGUAGE_OPTIONS,
    LEVEL_OPTIONS,
} from '../createCourseConstants';

function BasicInfoStep({
    draft,
    errors,
    onFieldChange,
    onListFieldChange,
    onAddListField,
    onRemoveListField,
}) {
    return (
        <section className={styles.stepPanel}>
            <h2>Basic Course Information</h2>
            <p>
                Define your core course details, learning outcomes, and
                requirements.
            </p>

            <div className={styles.formGrid}>
                <label className={styles.field} htmlFor='course-title'>
                    Course Title *
                    <input
                        id='course-title'
                        type='text'
                        value={draft.title}
                        className={errors.title ? styles.invalidInput : ''}
                        onChange={(event) =>
                            onFieldChange('title', event.target.value)
                        }
                        placeholder='e.g. Build and Deploy Smart Contracts on Polygon'
                    />
                    {errors.title ? (
                        <span className={styles.errorText}>{errors.title}</span>
                    ) : null}
                </label>

                <label className={styles.field} htmlFor='course-subtitle'>
                    Subtitle
                    <input
                        id='course-subtitle'
                        type='text'
                        value={draft.subtitle}
                        onChange={(event) =>
                            onFieldChange('subtitle', event.target.value)
                        }
                        placeholder='A short tagline for your course'
                    />
                </label>

                <label className={styles.field} htmlFor='course-category'>
                    Category *
                    <select
                        id='course-category'
                        value={draft.category}
                        className={errors.category ? styles.invalidInput : ''}
                        onChange={(event) =>
                            onFieldChange('category', event.target.value)
                        }
                    >
                        <option value=''>Select category</option>
                        {CATEGORY_OPTIONS.map((categoryOption) => (
                            <option key={categoryOption} value={categoryOption}>
                                {categoryOption}
                            </option>
                        ))}
                    </select>
                    {errors.category ? (
                        <span className={styles.errorText}>{errors.category}</span>
                    ) : null}
                </label>

                <label className={styles.field} htmlFor='course-level'>
                    Level
                    <select
                        id='course-level'
                        value={draft.level}
                        onChange={(event) =>
                            onFieldChange('level', event.target.value)
                        }
                    >
                        {LEVEL_OPTIONS.map((levelOption) => (
                            <option key={levelOption} value={levelOption}>
                                {levelOption}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.field} htmlFor='course-language'>
                    Teaching Language
                    <select
                        id='course-language'
                        value={draft.language}
                        onChange={(event) =>
                            onFieldChange('language', event.target.value)
                        }
                    >
                        {LANGUAGE_OPTIONS.map((languageOption) => (
                            <option key={languageOption} value={languageOption}>
                                {languageOption}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.field} htmlFor='course-thumbnail'>
                    Thumbnail URL
                    <input
                        id='course-thumbnail'
                        type='url'
                        value={draft.thumbnailUrl}
                        className={errors.thumbnailUrl ? styles.invalidInput : ''}
                        onChange={(event) =>
                            onFieldChange('thumbnailUrl', event.target.value)
                        }
                        placeholder='https://example.com/thumbnail.jpg'
                    />
                    {errors.thumbnailUrl ? (
                        <span className={styles.errorText}>{errors.thumbnailUrl}</span>
                    ) : null}
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`} htmlFor='course-description'>
                    Description *
                    <textarea
                        id='course-description'
                        value={draft.description}
                        className={errors.description ? styles.invalidInput : ''}
                        onChange={(event) =>
                            onFieldChange('description', event.target.value)
                        }
                        placeholder='Explain what students will build and learn in this course.'
                    />
                    {errors.description ? (
                        <span className={styles.errorText}>{errors.description}</span>
                    ) : null}
                </label>
            </div>

            <div className={styles.dynamicListBlock}>
                <div className={styles.dynamicHeader}>
                    <h3>Learning Objectives *</h3>
                    <button
                        type='button'
                        onClick={() => onAddListField('objectives')}
                    >
                        + Add Objective
                    </button>
                </div>
                {draft.objectives.map((objectiveItem, index) => (
                    <div key={`objective-${index}`} className={styles.dynamicRow}>
                        <input
                            type='text'
                            value={objectiveItem}
                            onChange={(event) =>
                                onListFieldChange(
                                    'objectives',
                                    index,
                                    event.target.value,
                                )
                            }
                            placeholder='Students will be able to...'
                        />
                        <button
                            type='button'
                            onClick={() => onRemoveListField('objectives', index)}
                        >
                            Remove
                        </button>
                    </div>
                ))}
                {errors.objectives ? (
                    <span className={styles.errorText}>{errors.objectives}</span>
                ) : null}
            </div>

            <div className={styles.dynamicListBlock}>
                <div className={styles.dynamicHeader}>
                    <h3>Requirements *</h3>
                    <button
                        type='button'
                        onClick={() => onAddListField('requirements')}
                    >
                        + Add Requirement
                    </button>
                </div>
                {draft.requirements.map((requirementItem, index) => (
                    <div key={`requirement-${index}`} className={styles.dynamicRow}>
                        <input
                            type='text'
                            value={requirementItem}
                            onChange={(event) =>
                                onListFieldChange(
                                    'requirements',
                                    index,
                                    event.target.value,
                                )
                            }
                            placeholder='Prior knowledge or tools needed'
                        />
                        <button
                            type='button'
                            onClick={() => onRemoveListField('requirements', index)}
                        >
                            Remove
                        </button>
                    </div>
                ))}
                {errors.requirements ? (
                    <span className={styles.errorText}>{errors.requirements}</span>
                ) : null}
            </div>
        </section>
    );
}

export default BasicInfoStep;
