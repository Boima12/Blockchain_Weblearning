import React from 'react';
import {useParams} from 'react-router-dom';
import LoadingSpinner from '../../components/loading-spinner/LoadingSpinner';
import CourseDetailsPage from '../../components/course-details-page/CourseDetailsPage';
import styles from './SingleCoursePage.module.css';
import coursesJson from '../../materials/data.json';

function SingleCoursePage() {
    const {courseId} = useParams();
    const sections = Object.values(coursesJson?.data ?? {});
    const allCourses = sections.flatMap((section) => section?.items ?? []);
    const courseDetails = allCourses.find(
        (course) => course.id.toString() === courseId,
    );

    const fetched = allCourses.length > 0;
    const notFound = fetched && !courseDetails;

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
