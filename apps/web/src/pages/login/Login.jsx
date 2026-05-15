import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import {
    clearAuthSession,
    getAuthSessionSnapshot,
    subscribeToAuthSession,
} from '../../utils/appLocalState';
import { logoutUserAccount } from '../../utils/userAccountApi';

function Co_Login() {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState({
        type: 'info',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const localSession = useSyncExternalStore(
        subscribeToAuthSession,
        getAuthSessionSnapshot,
        () => null,
    );

    const isAuthenticated = Boolean(localSession?.accountId);

    const feedbackClass =
        feedback.type === 'error'
            ? styles.feedbackError
            : feedback.type === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackInfo;

    const onLogout = async () => {
        setIsSubmitting(true);

        try {
            await logoutUserAccount();
        } catch {
            // Continue with local sign out if API call fails.
        }

        clearAuthSession();
        setFeedback({
            type: 'info',
            message: 'You have been logged out.',
        });
        setIsSubmitting(false);
    };

    return (
        <main className={styles.main_login}>
            <section className={styles.shell}>
                <header className={styles.header}>
                    <p className={styles.badge}>Account Access</p>
                    <h1>Blockchain Weblearning Access</h1>
                    <p>
                        Connect your wallet from the top navigation to sign in.
                        Your wallet becomes your account automatically.
                    </p>
                </header>

                {feedback.message ? (
                    <p className={`${styles.feedback} ${feedbackClass}`}>
                        {feedback.message}
                    </p>
                ) : null}

                {isAuthenticated ? (
                    <section className={styles.loggedInCard}>
                        <h2>Session Active</h2>
                        <p>
                            Logged in as <strong>{localSession.displayName || 'User'}</strong>
                        </p>
                        <p>{localSession.walletAddress}</p>
                        <div className={styles.actions}>
                            <button
                                type='button'
                                className={styles.primaryButton}
                                onClick={() => navigate('/profile')}
                            >
                                Open Profile
                            </button>
                            <button
                                type='button'
                                className={styles.secondaryButton}
                                onClick={onLogout}
                                disabled={isSubmitting}
                            >
                                Logout
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className={styles.loggedOutCard}>
                        <p>
                            Use the Connect Wallet button in the navigation bar
                            to create your account and sign in.
                        </p>
                        <button
                            type='button'
                            className={styles.primaryButton}
                            onClick={() => navigate('/')}
                        >
                            Browse Courses
                        </button>
                    </section>
                )}
            </section>
        </main>
    );
}

export default Co_Login;