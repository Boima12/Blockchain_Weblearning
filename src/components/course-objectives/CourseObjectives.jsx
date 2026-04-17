import React from 'react';
import styles from './CourseObjectives.module.css';

function CourseObjectives({courseDetails}) {
    const objectives =
        Array.isArray(courseDetails?.objectives_summary) &&
        courseDetails.objectives_summary.length > 0
            ? courseDetails.objectives_summary
            : Array.isArray(courseDetails?.objectives)
                ? courseDetails.objectives
                : [];

    return (
        <div className={styles.objectivesContainer}>
            <p className={styles.header}>What you'll learn</p>
            <section className={styles.objectives}>
                {(objectives.length > 0
                    ? objectives
                    : ['Build practical skills through guided lessons and projects.']).map((objective, idx) => {
                    return (
                        <p
                            key={idx}
                            className={styles.objective}
                        >
                            <i
                                style={{marginRight: '10px', color: 'grey'}}
                                className='fa-solid fa-check'
                            ></i>
                            {' '}
                            {objective}
                        </p>
                    );
                })}
            </section>
        </div>
    );
}

export default CourseObjectives;
