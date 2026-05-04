import React from 'react';
import {useParams} from 'react-router-dom';
import LoadingSpinner from '../../components/loading-spinner/LoadingSpinner';
import CourseDetailsPage from '../../components/course-details-page/CourseDetailsPage';
import styles from './SingleCoursePage.module.css';
import usePublishedCourses from '../../hooks/usePublishedCourses';

function SingleCoursePage() {
    const {courseId} = useParams();
    const { courses: allCourses, isLoading, error } = usePublishedCourses();
    const courseDetails = allCourses.find(
        (course) => String(course?.id) === String(courseId),
    );

    const fetched = !isLoading;
    const notFound = fetched && !courseDetails;

    if (error) {
        return (
            <main className={styles.main}>
                <h1 className={styles.message}>can't fetch data from MongoDB</h1>
            </main>
        );
    }

    return fetched ? (
        notFound ? (
            <main className={styles.main}>
                <h1 className={styles.message}>Course Not Found</h1>
            </main>
        ) : (
            <CourseDetailsPage courseDetails={courseDetails}/>
        )
    ) : (
        <LoadingSpinner/>
    );
}

export default SingleCoursePage;
