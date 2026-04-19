import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import {
    clearAuthSession,
    getAuthSession,
    loadAppStateFromAccount,
    saveAuthSession,
} from '../../utils/appLocalState';
import {
    loginUserAccount,
    logoutUserAccount,
    registerUserAccount,
} from '../../utils/userAccountApi';

const LOGIN_DEFAULTS = {
    identifier: '',
    password: '',
};

const REGISTER_DEFAULTS = {
    displayName: '',
    email: '',
    walletAddress: '',
    password: '',
    confirmPassword: '',
};

const buildSessionFromAccount = (account) => ({
    accountId: String(account?.accountId ?? ''),
    displayName: String(account?.profile?.displayName ?? ''),
    email: String(account?.email ?? account?.profile?.email ?? ''),
    walletAddress: String(
        account?.walletAddress ?? account?.profile?.walletAddress ?? '',
    ),
    loggedInAt: new Date().toISOString(),
});

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value ?? '').trim());

function Co_Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [loginForm, setLoginForm] = useState(LOGIN_DEFAULTS);
    const [registerForm, setRegisterForm] = useState(REGISTER_DEFAULTS);
    const [feedback, setFeedback] = useState({
        type: 'info',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localSession, setLocalSession] = useState(() => getAuthSession());

    const isAuthenticated = Boolean(localSession?.accountId);

    const feedbackClass = useMemo(() => {
        if (feedback.type === 'error') {
            return styles.feedbackError;
        }

        if (feedback.type === 'success') {
            return styles.feedbackSuccess;
        }

        return styles.feedbackInfo;
    }, [feedback.type]);

    const setErrorFeedback = (message) => {
        setFeedback({
            type: 'error',
            message,
        });
    };

    const onLoginSubmit = async (event) => {
        event.preventDefault();

        const identifier = loginForm.identifier.trim();
        const password = loginForm.password;

        if (!identifier || !password) {
            setErrorFeedback('Please provide identifier and password.');
            return;
        }

        setIsSubmitting(true);
        setFeedback({ type: 'info', message: '' });

        try {
            const payload = await loginUserAccount({
                identifier,
                password,
            });

            const account = payload?.account;
            if (!account?.accountId) {
                throw new Error('Login response missing account details.');
            }

            const session = saveAuthSession(buildSessionFromAccount(account));
            loadAppStateFromAccount(account);
            setLocalSession(session);
            setFeedback({
                type: 'success',
                message: 'Login successful. Redirecting to profile...',
            });

            navigate('/profile');
        } catch (error) {
            setErrorFeedback(
                error instanceof Error
                    ? error.message
                    : 'Unable to login right now.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const onRegisterSubmit = async (event) => {
        event.preventDefault();

        const displayName = registerForm.displayName.trim();
        const email = registerForm.email.trim();
        const walletAddress = registerForm.walletAddress.trim();
        const password = registerForm.password;
        const confirmPassword = registerForm.confirmPassword;

        if (!displayName || !email || !walletAddress || !password) {
            setErrorFeedback('Please complete all registration fields.');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorFeedback('Please use a valid email address.');
            return;
        }

        if (password.length < 6) {
            setErrorFeedback('Password must contain at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorFeedback('Password and confirm password do not match.');
            return;
        }

        setIsSubmitting(true);
        setFeedback({ type: 'info', message: '' });

        try {
            const payload = await registerUserAccount({
                displayName,
                email,
                walletAddress,
                password,
            });

            const account = payload?.account;
            if (!account?.accountId) {
                throw new Error('Register response missing account details.');
            }

            const session = saveAuthSession(buildSessionFromAccount(account));
            loadAppStateFromAccount(account);
            setLocalSession(session);
            setFeedback({
                type: 'success',
                message: 'Registration successful. Redirecting to profile...',
            });

            navigate('/profile');
        } catch (error) {
            setErrorFeedback(
                error instanceof Error
                    ? error.message
                    : 'Unable to register right now.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const onLogout = async () => {
        setIsSubmitting(true);

        try {
            await logoutUserAccount();
        } catch {
            // Continue with local sign out if API call fails.
        }

        clearAuthSession();
        setLocalSession(null);
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
                    <h1>Blockchain Weblearning Login</h1>
                    <p>
                        Register with email + wallet now. Later, this will be
                        replaced by on-chain wallet auth.
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
                        <p>{localSession.email}</p>
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
                    <>
                        <nav className={styles.tabRow}>
                            <button
                                type='button'
                                className={mode === 'login' ? styles.activeTab : styles.inactiveTab}
                                onClick={() => setMode('login')}
                            >
                                Login
                            </button>
                            <button
                                type='button'
                                className={mode === 'register' ? styles.activeTab : styles.inactiveTab}
                                onClick={() => setMode('register')}
                            >
                                Register
                            </button>
                        </nav>

                        {mode === 'login' ? (
                            <form className={styles.form} onSubmit={onLoginSubmit}>
                                <label htmlFor='identifier'>Email or Wallet Address</label>
                                <input
                                    id='identifier'
                                    type='text'
                                    value={loginForm.identifier}
                                    onChange={(event) =>
                                        setLoginForm((previous) => ({
                                            ...previous,
                                            identifier: event.target.value,
                                        }))
                                    }
                                />

                                <label htmlFor='loginPassword'>Password</label>
                                <input
                                    id='loginPassword'
                                    type='password'
                                    value={loginForm.password}
                                    onChange={(event) =>
                                        setLoginForm((previous) => ({
                                            ...previous,
                                            password: event.target.value,
                                        }))
                                    }
                                />

                                <button
                                    type='submit'
                                    className={styles.primaryButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Logging in...' : 'Login'}
                                </button>
                            </form>
                        ) : (
                            <form className={styles.form} onSubmit={onRegisterSubmit}>
                                <label htmlFor='displayName'>Display Name</label>
                                <input
                                    id='displayName'
                                    type='text'
                                    value={registerForm.displayName}
                                    onChange={(event) =>
                                        setRegisterForm((previous) => ({
                                            ...previous,
                                            displayName: event.target.value,
                                        }))
                                    }
                                />

                                <label htmlFor='registerEmail'>Email</label>
                                <input
                                    id='registerEmail'
                                    type='email'
                                    value={registerForm.email}
                                    onChange={(event) =>
                                        setRegisterForm((previous) => ({
                                            ...previous,
                                            email: event.target.value,
                                        }))
                                    }
                                />

                                <label htmlFor='walletAddress'>Wallet Address</label>
                                <input
                                    id='walletAddress'
                                    type='text'
                                    value={registerForm.walletAddress}
                                    onChange={(event) =>
                                        setRegisterForm((previous) => ({
                                            ...previous,
                                            walletAddress: event.target.value,
                                        }))
                                    }
                                />

                                <label htmlFor='registerPassword'>Password</label>
                                <input
                                    id='registerPassword'
                                    type='password'
                                    value={registerForm.password}
                                    onChange={(event) =>
                                        setRegisterForm((previous) => ({
                                            ...previous,
                                            password: event.target.value,
                                        }))
                                    }
                                />

                                <label htmlFor='confirmPassword'>Confirm Password</label>
                                <input
                                    id='confirmPassword'
                                    type='password'
                                    value={registerForm.confirmPassword}
                                    onChange={(event) =>
                                        setRegisterForm((previous) => ({
                                            ...previous,
                                            confirmPassword: event.target.value,
                                        }))
                                    }
                                />

                                <button
                                    type='submit'
                                    className={styles.primaryButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Registering...' : 'Register'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

export default Co_Login;