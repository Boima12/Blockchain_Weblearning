import { useEffect, useState } from 'react';
import { reconcileCatalogLinkedState } from '../utils/appLocalState';
import { fetchPublishedCourses } from '../utils/publishedCoursesApi';

const MONGO_FETCH_ERROR = "can't fetch data from MongoDB";

function usePublishedCourses() {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadCourses = async () => {
            setIsLoading(true);
            setError('');

            try {
                const remoteCourses = await fetchPublishedCourses();

                if (!isMounted) {
                    return;
                }

                const safeCourses = Array.isArray(remoteCourses)
                    ? remoteCourses
                    : [];

                setCourses(safeCourses);

                // Keep local user progress data but prune entries linked to removed/non-existent catalog courses.
                reconcileCatalogLinkedState(safeCourses);
            } catch {
                if (!isMounted) {
                    return;
                }

                setCourses([]);
                setError(MONGO_FETCH_ERROR);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadCourses();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        courses,
        isLoading,
        error,
    };
}

export default usePublishedCourses;
