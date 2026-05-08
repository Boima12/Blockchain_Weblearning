import styles from './LearnCourse.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/loading-spinner/LoadingSpinner';
import LearnCourseStateView from './components/LearnCourseStateView';
import LearnCourseHero from './components/LearnCourseHero';
import LearnCourseLessonRail from './components/LearnCourseLessonRail';
import LearnCoursePlayerPanel from './components/LearnCoursePlayerPanel';
import useLearnCoursePlayer from './hooks/useLearnCoursePlayer';
import { COURSE_DETAIL_BASE_PATH } from './learnCourseConstants';

function Co_LearnCourse() {
    const navigate = useNavigate();
    const { courseId = '' } = useParams();

    const {
        courseIdKey,
        isCatalogLoading,
        catalogError,
        status,
        source,
        course,
        modules,
        allLessons,
        activeLesson,
        activeMediaSource,
        previousLesson,
        nextLesson,
        completedLessonSet,
        completedCount,
        progressPercent,
        isActiveLessonCompleted,
        onSelectLesson,
        onMarkLessonComplete,
    } = useLearnCoursePlayer(courseId);

    if (isCatalogLoading && status !== 'ready') {
        return <LoadingSpinner />;
    }

    if (catalogError && status !== 'ready') {
        return (
            <LearnCourseStateView
                badge='Data Error'
                title="can't fetch data from MongoDB"
                description="can't fetch data from MongoDB"
                primaryLabel='Open Profile'
                onPrimaryClick={() => navigate('/profile')}
                secondaryLabel='Browse Courses'
                onSecondaryClick={() => navigate('/')}
            />
        );
    }

    if (status === 'notFound') {
        return (
            <LearnCourseStateView
                badge='Not Found'
                title='Course Not Found'
                description='We could not locate this course in your catalog or created courses.'
                primaryLabel='Open Profile'
                onPrimaryClick={() => navigate('/profile')}
                secondaryLabel='Browse Courses'
                onSecondaryClick={() => navigate('/')}
            />
        );
    }

    if (status === 'locked') {
        return (
            <LearnCourseStateView
                badge='Enrollment Required'
                title={course?.title}
                description='Enroll in this course first, then return to start learning and track your progress.'
                primaryLabel='Open Course Details'
                onPrimaryClick={() =>
                    navigate(`${COURSE_DETAIL_BASE_PATH}/${course?.id}`)
                }
                secondaryLabel='Open Profile'
                onSecondaryClick={() => navigate('/profile')}
            />
        );
    }

    return (
        <main className={styles.main_LearnCourse}>
            <div className={styles.shell}>
                <LearnCourseHero
                    course={course}
                    source={source}
                    progressPercent={progressPercent}
                    completedCount={completedCount}
                    totalLessons={allLessons.length}
                />

                <section className={styles.contentGrid}>
                    <LearnCourseLessonRail
                        modules={modules}
                        totalLessons={allLessons.length}
                        activeLessonId={activeLesson?.id}
                        completedLessonSet={completedLessonSet}
                        onSelectLesson={onSelectLesson}
                    />

                    <LearnCoursePlayerPanel
                        activeLesson={activeLesson}
                        activeMediaSource={activeMediaSource}
                        previousLesson={previousLesson}
                        nextLesson={nextLesson}
                        isActiveLessonCompleted={isActiveLessonCompleted}
                        progressPercent={progressPercent}
                        onSelectLesson={onSelectLesson}
                        onMarkLessonComplete={onMarkLessonComplete}
                        onOpenCertificate={() =>
                            navigate(`/certificate/${courseIdKey}`)
                        }
                        onOpenProfile={() => navigate('/profile')}
                    />
                </section>
            </div>
        </main>
    );
}

export default Co_LearnCourse;
