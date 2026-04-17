import React, {useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import Card from '../card/Card';
import styles from './CoursesContainer.module.css';

const CoursesContainer = ({courses}) => {
    // const [searchParam, setSearchParam] = useSearchParams();
    const [searchParam] = useSearchParams();

    const rawFilter = searchParam.get('filter') ?? '';
    const normalizedFilter = decodeURIComponent(rawFilter).trim().toLowerCase();
    const searchTerm = ['undefined', 'null'].includes(normalizedFilter)
        ? ''
        : normalizedFilter;

    useEffect(() => {
        const coursesSection = document.querySelector('#courses-section');
        if (searchParam.get('filter'))
            coursesSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }, [searchParam]);

    const safeCourses = Array.isArray(courses) ? courses : [];

    const coursesCards = safeCourses
        .filter((course) =>
            String(course?.title ?? '').toLowerCase().includes(searchTerm),
        )
        .map((course) => {
            return (
                <Card
                    key={course.id}
                    course={course}
                ></Card>
            );
        });

    return (
        <>
            <section className={styles.container}>
                {coursesCards.length ? (
                    coursesCards
                ) : (
                    <p className={styles.emptyCoursesList}>
                        There're no courses to show
                    </p>
                )}
            </section>
        </>
    );
};

export default CoursesContainer;
