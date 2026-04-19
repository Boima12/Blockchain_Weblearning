import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/loading-spinner/LoadingSpinner';
import usePublishedCourses from '../../hooks/usePublishedCourses';
import {
    formatWalletAddress,
    getAppState,
    updateAppState,
} from '../../utils/appLocalState';
import styles from './BuyCourse.module.css';

const TX_STATES = {
    idle: 'idle',
    signing: 'signing',
    pending: 'pending',
    success: 'success',
    failed: 'failed',
};

const toCurrencyLabel = (value, token) =>
    `${Number(value ?? 0).toFixed(2)} ${token}`;

const buildMockTxHash = () => {
    const randomHex = Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64);
    return `0x${randomHex}`;
};

const getInstructorLabel = (course) => {
    const instructorNames = Array.isArray(course?.visible_instructors)
        ? course.visible_instructors
            .map((instructor) => instructor?.name ?? instructor?.title)
            .filter(Boolean)
        : [];

    if (instructorNames.length > 0) {
        return instructorNames.join(', ');
    }

    return course?.ownerDisplayName ?? 'Unknown Instructor';
};

function Co_BuyCourse() {
    const navigate = useNavigate();
    const { courseId = '' } = useParams();
    const courseIdKey = String(courseId);

    const { courses, isLoading, error } = usePublishedCourses();
    const [appState, setAppState] = useState(() => getAppState());
    const [simulationOutcome, setSimulationOutcome] = useState('success');
    const [txState, setTxState] = useState(TX_STATES.idle);
    const [txHash, setTxHash] = useState('');

    const timerHandles = useRef([]);

    const clearTimers = () => {
        timerHandles.current.forEach((timerId) => {
            window.clearTimeout(timerId);
        });
        timerHandles.current = [];
    };

    useEffect(
        () => () => {
            clearTimers();
        },
        [],
    );

    const selectedCourse = useMemo(
        () =>
            courses.find(
                (courseItem) => String(courseItem?.id) === courseIdKey,
            ) ?? null,
        [courseIdKey, courses],
    );

    const isPurchased = useMemo(
        () =>
            appState.purchasedCourses.some(
                (purchaseItem) => String(purchaseItem.courseId) === courseIdKey,
            ),
        [appState.purchasedCourses, courseIdKey],
    );

    const token = String(selectedCourse?.token ?? 'MATIC').toUpperCase();
    const basePrice = Number(selectedCourse?.price ?? 0);
    const discount = Math.min(99, Math.max(0, Number(selectedCourse?.discount ?? 0)));
    const finalPrice = basePrice * (1 - discount / 100);

    const beginMockTransaction = () => {
        if (!selectedCourse) {
            return;
        }

        if (isPurchased) {
            navigate(`/learn-course/${courseIdKey}`);
            return;
        }

        clearTimers();
        setTxHash('');
        setTxState(TX_STATES.signing);

        const signingTimer = window.setTimeout(() => {
            setTxState(TX_STATES.pending);

            const pendingTimer = window.setTimeout(() => {
                if (simulationOutcome === 'failed') {
                    setTxState(TX_STATES.failed);
                    return;
                }

                const nextTxHash = buildMockTxHash();

                updateAppState((currentState) => {
                    const alreadyPurchased = currentState.purchasedCourses.some(
                        (purchaseItem) =>
                            String(purchaseItem.courseId) === courseIdKey,
                    );

                    if (alreadyPurchased) {
                        return currentState;
                    }

                    return {
                        ...currentState,
                        purchasedCourses: [
                            {
                                courseId: courseIdKey,
                                enrolledAt: new Date().toISOString(),
                                progress: 0,
                            },
                            ...currentState.purchasedCourses,
                        ],
                    };
                });

                setAppState(getAppState());
                setTxHash(nextTxHash);
                setTxState(TX_STATES.success);
            }, 1600);

            timerHandles.current.push(pendingTimer);
        }, 900);

        timerHandles.current.push(signingTimer);
    };

    const txMessage =
        txState === TX_STATES.signing
            ? 'Waiting for wallet signature...'
            : txState === TX_STATES.pending
                ? 'Transaction submitted. Waiting for block confirmation...'
                : txState === TX_STATES.success
                    ? 'Transaction confirmed. Enrollment completed.'
                    : txState === TX_STATES.failed
                        ? 'Transaction failed in simulation. Retry with Success to continue.'
                        : 'Ready to simulate a purchase transaction.';

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <main className={styles.main_buyCourse}>
                <section className={styles.stateCard}>
                    <h1>can't fetch data from MongoDB</h1>
                    <div className={styles.stateActions}>
                        <button type='button' onClick={() => navigate('/')}>
                            Browse Courses
                        </button>
                        <button type='button' onClick={() => navigate('/profile')}>
                            Open Profile
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    if (!selectedCourse) {
        return (
            <main className={styles.main_buyCourse}>
                <section className={styles.stateCard}>
                    <h1>Course Not Found</h1>
                    <p>We could not find this course in the published catalog.</p>
                    <div className={styles.stateActions}>
                        <button type='button' onClick={() => navigate('/')}>
                            Browse Courses
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.main_buyCourse}>
            <section className={styles.buyShell}>
                <header className={styles.headerSection}>
                    <p className={styles.badge}>Checkout Simulation</p>
                    <h1>{selectedCourse.title}</h1>
                    <p>
                        Instructor: <strong>{getInstructorLabel(selectedCourse)}</strong>
                    </p>
                </header>

                <section className={styles.gridSection}>
                    <article className={styles.card}>
                        <h2>Order Summary</h2>
                        <div className={styles.priceRows}>
                            <p>
                                Base Price:
                                <span>{toCurrencyLabel(basePrice, token)}</span>
                            </p>
                            <p>
                                Discount:
                                <span>{discount}%</span>
                            </p>
                            <p className={styles.totalRow}>
                                Total:
                                <span>{toCurrencyLabel(finalPrice, token)}</span>
                            </p>
                        </div>

                        <div className={styles.walletBox}>
                            <p className={styles.walletLabel}>Buyer Wallet</p>
                            <p>{formatWalletAddress(appState.profile.walletAddress)}</p>
                        </div>

                        <div className={styles.simulationControls}>
                            <label htmlFor='simulationOutcome'>Simulation Outcome</label>
                            <select
                                id='simulationOutcome'
                                value={simulationOutcome}
                                onChange={(event) =>
                                    setSimulationOutcome(event.target.value)
                                }
                                disabled={isPurchased || txState === TX_STATES.pending || txState === TX_STATES.signing}
                            >
                                <option value='success'>Success</option>
                                <option value='failed'>Fail</option>
                            </select>

                            <button
                                type='button'
                                className={styles.primaryButton}
                                onClick={beginMockTransaction}
                                disabled={txState === TX_STATES.pending || txState === TX_STATES.signing}
                            >
                                {isPurchased
                                    ? 'Open Learn Course'
                                    : txState === TX_STATES.pending || txState === TX_STATES.signing
                                        ? 'Processing...'
                                        : 'Simulate Transaction'}
                            </button>

                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={() => navigate(`/Blockchain-Weblearning/courses/${courseIdKey}`)}
                            >
                                Back to Course Details
                            </button>
                        </div>
                    </article>

                    <article className={styles.card}>
                        <h2>Transaction Status</h2>
                        <p className={styles.statusText}>{txMessage}</p>

                        {txHash ? (
                            <div className={styles.hashBox}>
                                <p>Mock Tx Hash</p>
                                <code>{txHash}</code>
                            </div>
                        ) : null}

                        <div className={styles.statusActions}>
                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={() => navigate(`/learn-course/${courseIdKey}`)}
                                disabled={!isPurchased}
                            >
                                Start Learning
                            </button>
                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={() => navigate('/profile')}
                            >
                                Open Profile
                            </button>
                        </div>
                    </article>
                </section>
            </section>
        </main>
    );
}

export default Co_BuyCourse;