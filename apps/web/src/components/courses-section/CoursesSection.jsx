import React from 'react';
import CoursesBox from '../../components/courses-box/CoursesBox';
import LoadingSpinner from '../loading-spinner/LoadingSpinner';
import styles from './CoursesSection.module.css';
import usePublishedCourses from '../../hooks/usePublishedCourses';

function CoursesSection() {
    const { courses, isLoading, error } = usePublishedCourses();

    return (
        <div id='courses-section' className={styles.coursesSection}>
            <h2 className={styles.coursesSectionTitle}>
                A broad selection of courses
            </h2>

            {isLoading ? (
                <LoadingSpinner />
            ) : courses.length ? (
                <CoursesBox courses={courses} />
            ) : (
                <p>
                    {error || 'No published courses available yet. Publish one to get started.'}
                </p>
            )}
        </div>
    );
}

export default CoursesSection;