import React from 'react';
import CoursesContainer from '../courses-container/CoursesContainer';
import styles from './CoursesBox.module.css';

const CoursesBox = ({ sectionData, courses }) => {
    const safeCourses = Array.isArray(courses)
        ? courses
        : sectionData?.items ?? [];

    return (
        <section className={styles.wrapper}>
            <CoursesContainer courses={safeCourses}></CoursesContainer>
        </section>
    );
};

export default CoursesBox;
