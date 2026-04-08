import React from 'react';
import CoursesBox from '../../components/courses-box/CoursesBox';
import LoadingSpinner from '../loading-spinner/LoadingSpinner';
import styles from './CoursesSection.module.css';
import coursesJson from '../../materials/data.json';

function CoursesSection() {
    const sectionData = coursesJson?.data?.js_res;

    return (
        <div id='courses-section' className={styles.coursesSection}>
            <h2 className={styles.coursesSectionTitle}>
                A broad selection of courses
            </h2>

            {sectionData ? (
                <CoursesBox sectionData={sectionData} />
            ) : (
                <LoadingSpinner />
            )}
        </div>
    );
}

export default CoursesSection;