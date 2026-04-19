import React from 'react';
import styles from './NavBar.module.css';
import SearchBar from '../search-bar/SearchBar';
import { useNavigate } from 'react-router-dom';
import {
    clearAuthSession,
    formatWalletAddress,
    getAppState,
    getAuthSession,
    resetAppState,
} from '../../utils/appLocalState';
import blockchainWeblearningIcon from '../../assets/Blockchain_weblearning_icon.png';
import { logoutUserAccount } from '../../utils/userAccountApi';

function NavBar() {

    const navigate = useNavigate();
    const authSession = getAuthSession();

    const isAuthenticated = Boolean(authSession?.accountId);
    const walletAddress =
        authSession?.walletAddress || getAppState().profile.walletAddress;

    const onLogout = async () => {
        try {
            await logoutUserAccount();
        } catch {
            // Proceed with local logout even when network request fails.
        }

        clearAuthSession();
        resetAppState();
        navigate('/login');
    };

    return (
        <nav className={styles.nav}>
            <ul className={styles.ul}>
                <li className={styles.logo}>
                    <img
                        src={blockchainWeblearningIcon}
                        alt='blockchain-weblearning-logo'
                        onClick={() => navigate('/')}
                    />
                </li>

                <li className={styles.coursesButton}>
                    <button
                        type='button'
                        name='courses-button'
                        onClick={() => navigate('/')}
                    >
                        Courses
                    </button>
                </li>

                <SearchBar/>

                <li className={styles.createCourseButton}>
                    <button
                        type='button'
                        name='create-course-button'
                        onClick={() =>
                            navigate(
                                isAuthenticated
                                    ? '/create-course'
                                    : '/login',
                            )
                        }
                    >
                        Create Course
                    </button>
                </li>

                <li className={styles.profileButton}>
                    <button
                        type='button'
                        name='profile-button'
                        onClick={() =>
                            navigate(isAuthenticated ? '/profile' : '/login')
                        }
                    >
                        {isAuthenticated ? 'Profile' : 'Login'}
                    </button>
                </li>

                <li className={styles.walletLogoutButton}>
                    <button
                        type='button'
                        name='wallet-logout-button'
                        onClick={() =>
                            isAuthenticated
                                ? onLogout()
                                : navigate('/login')
                        }
                    >
                        {isAuthenticated
                            ? `Logout (${formatWalletAddress(walletAddress)})`
                            : 'Register / Login'}
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default NavBar;
