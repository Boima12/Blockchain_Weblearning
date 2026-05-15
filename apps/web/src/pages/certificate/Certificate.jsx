import styles from './Certificate.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import LoadingSpinner from '../../components/loading-spinner/LoadingSpinner';
import usePublishedCourses from '../../hooks/usePublishedCourses';
import {
    formatWalletAddress,
    getAppState,
    updateAppState,
} from '../../utils/appLocalState';
import { hasAccessOnChain } from '../../web3/ethersClient';

const buildCourseCode = (courseId) =>
    String(courseId ?? '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(-8)
        .toUpperCase() || 'COURSE';

const formatIssuedDate = (isoValue) => {
    const parsedDate = new Date(isoValue ?? Date.now());
    if (Number.isNaN(parsedDate.getTime())) {
        return new Date().toLocaleDateString();
    }

    return parsedDate.toLocaleDateString();
};

const createCertificateId = (courseId, issuedAt) => {
    const timestamp = String(new Date(issuedAt).getTime()).slice(-5);
    return `CERT-${new Date(issuedAt).getFullYear()}-${buildCourseCode(courseId)}-${timestamp}`;
};

const toFileSlug = (value) =>
    String(value ?? 'certificate')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'certificate';


function Co_Certificate() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const courseIdKey = String(courseId ?? '');

    const { courses, isLoading, error } = usePublishedCourses();
    const [appState, setAppState] = useState(() => getAppState());
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [actionError, setActionError] = useState('');
    const certificateRef = useRef(null);

    const course = useMemo(
        () =>
            courses.find(
                (courseItem) => String(courseItem?.id) === courseIdKey,
            ) ?? null,
        [courseIdKey, courses],
    );

    const purchaseRecord = useMemo(
        () =>
            appState.purchasedCourses.find(
                (item) => String(item.courseId) === courseIdKey,
            ) ?? null,
        [appState.purchasedCourses, courseIdKey],
    );

    const progressRecord = appState.learningProgress?.[courseIdKey] ?? {};
    const progressPercent = Number(
        progressRecord.percent ?? purchaseRecord?.progress ?? 0,
    );

    const certificateRecord = useMemo(
        () =>
            appState.certificates.find(
                (item) => String(item.courseId) === courseIdKey,
            ) ?? null,
        [appState.certificates, courseIdKey],
    );

    const isCompleted = progressPercent >= 100 || Boolean(certificateRecord);

    const displayIssuedAt =
        certificateRecord?.issuedAt ??
        progressRecord.updatedAt ??
        purchaseRecord?.enrolledAt ??
        new Date().toISOString();

    const displayCertificateId =
        certificateRecord?.id ??
        `CERT-${new Date(displayIssuedAt).getFullYear()}-${buildCourseCode(courseIdKey)}-PREVIEW`;

    const ensureCertificateRecord = () => {
        const latestState = getAppState();
        const existing = latestState.certificates.find(
            (item) => String(item.courseId) === courseIdKey,
        );

        if (existing) {
            setAppState(latestState);
            return existing;
        }

        if (!isCompleted) {
            return null;
        }

        const issuedAt = new Date().toISOString();
        const nextCertificate = {
            id: createCertificateId(courseIdKey, issuedAt),
            courseId: courseIdKey,
            issuedAt,
        };

        const nextState = updateAppState((currentState) => ({
            ...currentState,
            certificates: [...currentState.certificates, nextCertificate],
        }));

        setAppState(nextState);
        return nextCertificate;
    };

    const onDownloadPdf = async () => {
        if (!course || !isCompleted || !certificateRef.current) {
            return;
        }

        setActionError('');
        setIsGeneratingPdf(true);

        try {
            const ensuredCertificate = ensureCertificateRecord();
            if (!ensuredCertificate) {
                throw new Error('Certificate is not available yet.');
            }

            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height],
            });

            const imageData = canvas.toDataURL('image/png');
            pdf.addImage(
                imageData,
                'PNG',
                0,
                0,
                canvas.width,
                canvas.height,
            );

            pdf.save(`${toFileSlug(course.title)}-certificate.pdf`);
        } catch {
            setActionError('Unable to generate certificate PDF right now.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const onVerifyOnChain = async () => {
        setActionError('');
        if (!appState.profile?.walletAddress) {
            setActionError('Connect a wallet to verify on-chain enrollment.');
            return;
        }

        try {
            const ok = await hasAccessOnChain(Number(courseIdKey), appState.profile.walletAddress);
            if (!ok) {
                setActionError('No on-chain enrollment found for this account.');
                return;
            }

            ensureCertificateRecord();
        } catch (err) {
            setActionError('Unable to verify on-chain enrollment right now.');
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <main className={styles.main_Certificate}>
                <section className={styles.stateCard}>
                    <h1>can't fetch data from MongoDB</h1>
                    <div className={styles.actions}>
                        <button
                            type='button'
                            onClick={() => navigate('/')}
                        >
                            Browse Courses
                        </button>
                        <button
                            type='button'
                            onClick={() => navigate('/profile')}
                        >
                            Open Profile
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    if (!course) {
        return (
            <main className={styles.main_Certificate}>
                <section className={styles.stateCard}>
                    <h1>Course Not Found</h1>
                    <p>We could not locate this course in the published catalog.</p>
                    <div className={styles.actions}>
                        <button
                            type='button'
                            onClick={() => navigate('/')}
                        >
                            Browse Courses
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    if (!isCompleted) {
        return (
            <main className={styles.main_Certificate}>
                <section className={styles.stateCard}>
                    <p className={styles.badge}>Not Eligible Yet</p>
                    <h1>Certificate Locked</h1>
                    <p>
                        Complete this course to unlock your certificate. Current progress: {Math.round(progressPercent)}%.
                    </p>
                    <div className={styles.actions}>
                        <button
                            type='button'
                            onClick={() => navigate(`/learn-course/${courseIdKey}`)}
                        >
                            Continue Learning
                        </button>
                        <button
                            type='button'
                            onClick={() => navigate('/profile')}
                        >
                            Open Profile
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return(
        <main className={styles.main_Certificate}>
            <section className={styles.certificateShell}>
                <div ref={certificateRef} className={styles.certificateCanvas}>
                    <p className={styles.certificateLabel}>Certificate of Completion</p>
                    <h1>{course.title}</h1>
                    <p className={styles.subtitle}>This certifies that</p>
                    <h2>{appState.profile.displayName || 'Blockchain Student'}</h2>
                    <p className={styles.subtitle}>
                        has successfully completed the course requirements.
                    </p>

                    <div className={styles.metaGrid}>
                        <article>
                            <p>Certificate ID</p>
                            <strong>{displayCertificateId}</strong>
                        </article>
                        <article>
                            <p>Issued On</p>
                            <strong>{formatIssuedDate(displayIssuedAt)}</strong>
                        </article>
                        <article>
                            <p>Wallet</p>
                            <strong>{formatWalletAddress(appState.profile.walletAddress)}</strong>
                        </article>
                    </div>
                </div>

                {actionError ? <p className={styles.errorText}>{actionError}</p> : null}

                <div className={styles.actions}>
                    <button
                        type='button'
                        onClick={onVerifyOnChain}
                    >
                        Verify On-chain Enrollment
                    </button>
                    <button
                        type='button'
                        onClick={onDownloadPdf}
                        disabled={isGeneratingPdf}
                    >
                        {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                    <button
                        type='button'
                        onClick={() => navigate(`/learn-course/${courseIdKey}`)}
                    >
                        Open Learn Course
                    </button>
                    <button
                        type='button'
                        onClick={() => navigate('/profile')}
                    >
                        Open Profile
                    </button>
                </div>
            </section>
        </main>
    );
}

export default Co_Certificate