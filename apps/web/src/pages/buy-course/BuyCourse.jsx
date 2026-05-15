import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ActionProgressPanel from '../../components/action-progress-panel/ActionProgressPanel';
import LoadingSpinner from '../../components/loading-spinner/LoadingSpinner';
import { buyCourseOnChain } from '../../web3/ethersClient';
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

const BUY_PROGRESS_STEPS = [
    {
        id: 'switch-network',
        label: 'Switch wallet to Polygon Amoy',
        hint: 'MetaMask may need to switch networks before the purchase can start.',
    },
    {
        id: 'signing',
        label: 'Approve the purchase transaction',
        hint: 'Confirm the payment in MetaMask.',
    },
    {
        id: 'submitted',
        label: 'Wait for chain confirmation',
        hint: 'The purchase is submitted and waiting for final confirmation.',
    },
    {
        id: 'confirmed',
        label: 'Sync local enrollment',
        hint: 'Mark the course as purchased inside the app.',
    },
];

const toCurrencyLabel = (value, token) =>
    `${Number(value ?? 0).toFixed(2)} ${token}`;

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
    const [txState, setTxState] = useState(TX_STATES.idle);
    const [txHash, setTxHash] = useState('');
    const [buyProgress, setBuyProgress] = useState(null);

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
    const onChainCourseId = Number(
        selectedCourse?.onChainCourseId ?? selectedCourse?.chainCourseId ?? courseIdKey,
    );
    const hasValidOnChainId = Number.isFinite(onChainCourseId);

    const beginOnChainPurchase = async () => {
        if (!selectedCourse) return;
        if (isPurchased) {
            navigate(`/learn-course/${courseIdKey}`);
            return;
        }

        if (!hasValidOnChainId) {
            console.error('On-chain purchase failed: Missing on-chain course id.', {
                courseId: courseIdKey,
                onChainCourseId: selectedCourse?.onChainCourseId,
            });
            setTxState(TX_STATES.failed);
            setBuyProgress({
                stage: 'failed',
                note: 'Course is not published on-chain yet.',
                txHash: '',
            });
            return;
        }

        try {
            setTxHash('');
            setTxState(TX_STATES.signing);
            setBuyProgress({
                stage: 'switch-network',
                note: 'Open MetaMask to switch to Polygon Amoy if needed.',
                txHash: '',
            });

            const result = await buyCourseOnChain(onChainCourseId, String(finalPrice), {
                onStatus: (stage, nextTxHash) => {
                    const progressNotes = {
                        'switch-network': 'Approve the Polygon Amoy network switch in MetaMask.',
                        signing: 'Approve the transaction in MetaMask.',
                        submitted: 'Transaction submitted. Waiting for confirmation...',
                        confirmed: 'Transaction confirmed. Syncing local enrollment...',
                    };

                    if (stage === 'submitted') {
                        setTxState(TX_STATES.pending);
                    }

                    if (stage === 'confirmed') {
                        setTxState(TX_STATES.success);
                    }

                    setBuyProgress((previous) => ({
                        ...(previous ?? {}),
                        stage,
                        txHash: nextTxHash ?? previous?.txHash ?? '',
                        note: progressNotes[stage] ?? previous?.note ?? '',
                    }));
                },
            });

            setTxHash(result.txHash);
            updateAppState((currentState) => {
                const alreadyPurchased = currentState.purchasedCourses.some(
                    (purchaseItem) => String(purchaseItem.courseId) === courseIdKey,
                );

                if (alreadyPurchased) return currentState;

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
            setTxState(TX_STATES.success);
            setBuyProgress({
                stage: 'confirmed',
                note: 'Transaction confirmed. Enrollment completed.',
                txHash: result.txHash,
            });
        } catch (err) {
            console.error('On-chain purchase failed:', err);
            setTxState(TX_STATES.failed);
            setBuyProgress({
                stage: 'failed',
                note:
                    err instanceof Error
                        ? err.message
                        : 'Transaction failed. Please try again.',
                txHash,
            });
        }
    };

    let txMessage = 'Ready to complete your purchase.';

    if (buyProgress?.note) {
        txMessage = buyProgress.note;
    } else if (txState === TX_STATES.signing) {
        txMessage = 'Waiting for wallet signature...';
    } else if (txState === TX_STATES.pending) {
        txMessage = 'Transaction submitted. Waiting for block confirmation...';
    } else if (txState === TX_STATES.success) {
        txMessage = 'Transaction confirmed. Enrollment completed.';
    } else if (txState === TX_STATES.failed) {
        txMessage = hasValidOnChainId
            ? 'Transaction failed. Please try again.'
            : 'Course is not published on-chain yet.';
    }

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
                    <p className={styles.badge}>Checkout</p>
                    <h1>{selectedCourse.title}</h1>
                    <p>
                        Instructor: <strong>{getInstructorLabel(selectedCourse)}</strong>
                    </p>
                </header>

                {buyProgress ? (
                    <ActionProgressPanel
                        title="Buying course"
                        description={buyProgress.note}
                        currentStage={buyProgress.stage}
                        steps={BUY_PROGRESS_STEPS}
                        txHash={buyProgress.txHash}
                        tone={buyProgress.stage === 'failed' ? 'error' : buyProgress.stage === 'confirmed' ? 'success' : 'info'}
                    />
                ) : null}

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
                            <button
                                type='button'
                                className={styles.primaryButton}
                                onClick={beginOnChainPurchase}
                                disabled={
                                    !hasValidOnChainId ||
                                    txState === TX_STATES.pending ||
                                    txState === TX_STATES.signing
                                }
                            >
                                {isPurchased
                                    ? 'Open Learn Course'
                                    : txState === TX_STATES.pending || txState === TX_STATES.signing
                                        ? 'Processing on-chain...'
                                        : 'Purchase On-chain'}
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
                                <p>Tx Hash</p>
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