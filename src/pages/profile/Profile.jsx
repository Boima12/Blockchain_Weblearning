import styles from './Profile.module.css';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePublishedCourses from '../../hooks/usePublishedCourses';
import {
    formatWalletAddress,
    getAppState,
    updateAppState,
} from '../../utils/appLocalState';

const PROFILE_TABS = [
    {
        id: 'purchased',
        label: 'Purchased Courses',
    },
    {
        id: 'created',
        label: 'Created Courses',
    },
    {
        id: 'certificates',
        label: 'Certificates',
    },
];

const COURSE_DETAIL_BASE_PATH = '/Blockchain-Weblearning/courses';

const formatDateLabel = (isoValue) => {
    if (!isoValue) {
        return 'N/A';
    }

    const parsed = new Date(isoValue);
    if (Number.isNaN(parsed.getTime())) {
        return 'N/A';
    }

    return parsed.toLocaleDateString();
};

const getLessonCount = (course) => {
    if (!course?.curriculum || !Array.isArray(course.curriculum)) {
        return 0;
    }

    return course.curriculum.reduce(
        (total, moduleItem) => total + (moduleItem?.lessons?.length ?? 0),
        0,
    );
};


function Co_Profile() {
    const navigate = useNavigate();
    const [appState, setAppState] = useState(() => getAppState());
    const [activeTab, setActiveTab] = useState('purchased');
    const [isEditing, setIsEditing] = useState(false);
    const [draftProfile, setDraftProfile] = useState(() => ({
        ...getAppState().profile,
    }));
    const { courses: allCourses, error: catalogError } = usePublishedCourses();

    const myPublishedCourses = useMemo(
        () =>
            allCourses.filter(
                (course) =>
                    String(course?.ownerWalletAddress ?? '') ===
                    String(appState.profile.walletAddress ?? ''),
            ),
        [allCourses, appState.profile.walletAddress],
    );

    const createdCourses = useMemo(
        () => [...appState.createdCourses, ...myPublishedCourses],
        [appState.createdCourses, myPublishedCourses],
    );

    const purchasedCourses = useMemo(
        () =>
            appState.purchasedCourses.map((purchaseItem, index) => {
                const itemCourse = allCourses.find(
                    (course) =>
                        String(course.id) === String(purchaseItem.courseId),
                );

                return {
                    id: purchaseItem.courseId,
                    title: itemCourse?.title ?? `Course ${index + 1}`,
                    instructor:
                        itemCourse?.visible_instructors?.[0]?.title ??
                        itemCourse?.ownerDisplayName ??
                        'Unknown Instructor',
                    thumbnail:
                        itemCourse?.image_304x171 ??
                        itemCourse?.thumbnailUrl ??
                        itemCourse?.image_480x270,
                    enrolledAt: purchaseItem.enrolledAt,
                    progress:
                        appState.learningProgress?.[String(purchaseItem.courseId)]
                            ?.percent ?? purchaseItem.progress ?? 0,
                };
            }),
        [allCourses, appState.learningProgress, appState.purchasedCourses],
    );

    const completedCoursesCount = useMemo(() => {
        const completedSet = new Set(
            appState.certificates.map((certificate) =>
                String(certificate.courseId),
            ),
        );

        Object.entries(appState.learningProgress).forEach(([courseId, item]) => {
            if ((item?.percent ?? 0) >= 100) {
                completedSet.add(String(courseId));
            }
        });

        return completedSet.size;
    }, [appState.certificates, appState.learningProgress]);

    const onEditStart = () => {
        setDraftProfile({
            ...appState.profile,
        });
        setIsEditing(true);
    };

    const onEditCancel = () => {
        setDraftProfile({
            ...appState.profile,
        });
        setIsEditing(false);
    };

    const onEditSave = (event) => {
        event.preventDefault();

        const normalizedProfile = {
            ...draftProfile,
            displayName: draftProfile.displayName?.trim() || 'Blockchain Student',
            email: draftProfile.email?.trim() || 'student@university.edu',
            walletAddress:
                draftProfile.walletAddress?.trim() ||
                '0xA4f0fA32F7bA19EfA72fD8B601845513d19b4aD0',
            bio:
                draftProfile.bio?.trim() ||
                'University student building a Web3 learning platform.',
        };

        const nextState = updateAppState((currentState) => ({
            ...currentState,
            profile: normalizedProfile,
        }));

        setAppState(nextState);
        setDraftProfile({
            ...nextState.profile,
        });
        setIsEditing(false);
    };

    const renderPurchasedCourses = () => {
        if (purchasedCourses.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <h3>No purchased courses yet</h3>
                    <p>
                        Browse courses and use the mock Buy/Enroll flow to see
                        your learning dashboard here.
                    </p>
                    <button
                        type='button'
                        onClick={() => navigate('/')}
                    >
                        Browse Courses
                    </button>
                </div>
            );
        }

        return (
            <div className={styles.itemsGrid}>
                {purchasedCourses.map((course) => (
                    <article key={course.id} className={styles.courseCard}>
                        <img src={course.thumbnail} alt={course.title} />
                        <div className={styles.courseCardBody}>
                            <p className={styles.cardLabel}>Enrolled</p>
                            <h3>{course.title}</h3>
                            <p>{course.instructor}</p>
                            <p>
                                Enrolled at: {formatDateLabel(course.enrolledAt)}
                            </p>
                            <div className={styles.progressRow}>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${Math.min(
                                                Math.max(course.progress, 0),
                                                100,
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span>{Math.round(course.progress)}%</span>
                            </div>
                            <div className={styles.actionsRow}>
                                <button
                                    type='button'
                                    onClick={() =>
                                        navigate(
                                            `${COURSE_DETAIL_BASE_PATH}/${course.id}`,
                                        )
                                    }
                                >
                                    Open Details
                                </button>
                                <button
                                    type='button'
                                    onClick={() =>
                                        navigate(`/learn-course/${course.id}`)
                                    }
                                >
                                    Continue Learning
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    const renderCreatedCourses = () => {
        if (createdCourses.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <h3>No courses created yet</h3>
                    <p>
                        Build your first Web3 course and publish it when you are
                        ready.
                    </p>
                    <button
                        type='button'
                        onClick={() => navigate('/create-course')}
                    >
                        Create Your First Course
                    </button>
                </div>
            );
        }

        return (
            <div className={styles.itemsGrid}>
                {createdCourses.map((course, index) => (
                    <article
                        key={course.id ?? `${course.title}-${index}`}
                        className={styles.courseCard}
                    >
                        <div className={styles.courseCardBody}>
                            <p className={styles.cardLabel}>
                                {course.status ?? 'Draft'}
                            </p>
                            <h3>{course.title ?? 'Untitled Course'}</h3>
                            <p>Category: {course.category ?? 'Uncategorized'}</p>
                            <p>
                                Lessons: {getLessonCount(course)} | Price:{' '}
                                {Number(course.price ?? 0).toFixed(2)}{' '}
                                {course.token ?? 'MATIC'}
                            </p>
                            <div className={styles.actionsRow}>
                                <button
                                    type='button'
                                    onClick={() =>
                                        navigate(
                                            course.id
                                                ? `/edit-course/${course.id}`
                                                : '/create-course',
                                        )
                                    }
                                >
                                    Edit Course
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    const renderCertificates = () => {
        if (appState.certificates.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <h3>No certificates yet</h3>
                    <p>
                        Complete a course in Learn Course to unlock certificate
                        generation.
                    </p>
                    <button
                        type='button'
                        onClick={() =>
                            navigate(
                                allCourses[0]?.id
                                    ? `/learn-course/${allCourses[0].id}`
                                    : '/',
                            )
                        }
                    >
                        Start Learning
                    </button>
                </div>
            );
        }

        return (
            <div className={styles.itemsGrid}>
                {appState.certificates.map((certificate, index) => {
                    const course = allCourses.find(
                        (item) =>
                            String(item.id) === String(certificate.courseId),
                    );

                    return (
                        <article
                            key={certificate.id ?? `${certificate.courseId}-${index}`}
                            className={styles.courseCard}
                        >
                            <div className={styles.courseCardBody}>
                                <p className={styles.cardLabel}>Issued</p>
                                <h3>{course?.title ?? 'Completed Course'}</h3>
                                <p>Certificate ID: {certificate.id}</p>
                                <p>
                                    Issued at:{' '}
                                    {formatDateLabel(certificate.issuedAt)}
                                </p>
                                <div className={styles.actionsRow}>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            navigate(
                                                `/certificate/${certificate.courseId}`,
                                            )
                                        }
                                    >
                                        View Certificate
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    };

    const renderActiveTabContent = () => {
        if (activeTab === 'created') {
            return renderCreatedCourses();
        }

        if (activeTab === 'certificates') {
            return renderCertificates();
        }

        return renderPurchasedCourses();
    };

    return(
        <main className={styles.main_Profile}>
            <section className={styles.profileHeader}>
                {catalogError ? (
                    <p className={styles.catalogError}>can't fetch data from MongoDB</p>
                ) : null}

                <div className={styles.profileIdentityCard}>
                    <div className={styles.avatar}>
                        {appState.profile.displayName?.[0] ?? 'B'}
                    </div>

                    <div className={styles.identityMeta}>
                        <p className={styles.identityLabel}>Account Profile</p>
                        <h1>{appState.profile.displayName}</h1>
                        <p>{appState.profile.email}</p>
                        <p className={styles.walletAddress}>
                            Wallet: {formatWalletAddress(appState.profile.walletAddress)}
                        </p>
                    </div>

                    <div className={styles.profileActions}>
                        <button
                            type='button'
                            onClick={onEditStart}
                        >
                            Edit Profile
                        </button>
                        <button
                            type='button'
                            onClick={() => navigate('/create-course')}
                        >
                            Create Course
                        </button>
                    </div>
                </div>

                <div className={styles.statCards}>
                    <article>
                        <p>Created Courses</p>
                        <h3>{createdCourses.length}</h3>
                    </article>
                    <article>
                        <p>Purchased Courses</p>
                        <h3>{appState.purchasedCourses.length}</h3>
                    </article>
                    <article>
                        <p>Completed Courses</p>
                        <h3>{completedCoursesCount}</h3>
                    </article>
                </div>
            </section>

            {isEditing ? (
                <section className={styles.editSection}>
                    <h2>Edit Profile</h2>
                    <form onSubmit={onEditSave}>
                        <label htmlFor='displayName'>Display Name</label>
                        <input
                            id='displayName'
                            type='text'
                            value={draftProfile.displayName}
                            onChange={(event) =>
                                setDraftProfile((previous) => ({
                                    ...previous,
                                    displayName: event.target.value,
                                }))
                            }
                        />

                        <label htmlFor='email'>Email</label>
                        <input
                            id='email'
                            type='email'
                            value={draftProfile.email}
                            onChange={(event) =>
                                setDraftProfile((previous) => ({
                                    ...previous,
                                    email: event.target.value,
                                }))
                            }
                        />

                        <label htmlFor='walletAddress'>Wallet Address</label>
                        <input
                            id='walletAddress'
                            type='text'
                            value={draftProfile.walletAddress}
                            onChange={(event) =>
                                setDraftProfile((previous) => ({
                                    ...previous,
                                    walletAddress: event.target.value,
                                }))
                            }
                        />

                        <label htmlFor='bio'>Bio</label>
                        <textarea
                            id='bio'
                            value={draftProfile.bio}
                            onChange={(event) =>
                                setDraftProfile((previous) => ({
                                    ...previous,
                                    bio: event.target.value,
                                }))
                            }
                        />

                        <div className={styles.formActions}>
                            <button type='submit'>Save Profile</button>
                            <button
                                type='button'
                                onClick={onEditCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            ) : null}

            <section className={styles.contentSection}>
                <div className={styles.tabBar}>
                    {PROFILE_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            className={
                                activeTab === tab.id
                                    ? styles.activeTab
                                    : styles.inactiveTab
                            }
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {renderActiveTabContent()}
            </section>
        </main>
    );
}

export default Co_Profile