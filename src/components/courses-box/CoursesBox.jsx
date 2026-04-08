import React from 'react';
import CoursesContainer from '../courses-container/CoursesContainer';
import styles from './CoursesBox.module.css';

const CoursesBox = ({sectionData}) => {
    const {
        items: courses,
    } = sectionData;
    return (
        <section className={styles.wrapper}>
            <CoursesContainer courses={courses}></CoursesContainer>
        </section>
    );
};

export default CoursesBox;
