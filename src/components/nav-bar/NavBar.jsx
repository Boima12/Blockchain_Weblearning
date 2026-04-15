import React from 'react';
import styles from './NavBar.module.css';
import SearchBar from '../search-bar/SearchBar';
import { useNavigate } from 'react-router-dom';
import { formatWalletAddress, getAppState } from '../../utils/appLocalState';

function NavBar() {

    const navigate = useNavigate();
    const walletAddress = getAppState().profile.walletAddress;

    return (
        <nav className={styles.nav}>
            <ul className={styles.ul}>
                <li className={styles.logo}>
                    <img
                        src='https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg'
                        alt='udemy-logo'
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
                        onClick={() => navigate('/create-course')}
                    >
                        Create Course
                    </button>
                </li>

                <li className={styles.profileButton}>
                    <button
                        type='button'
                        name='profile-button'
                        onClick={() => navigate('/profile')}
                    >
                        Profile
                    </button>
                </li>

                <li className={styles.walletLogoutButton}>
                    <button
                        type='button'
                        name='wallet-logout-button'
                        onClick={() => navigate('/profile')}
                    >
                        {formatWalletAddress(walletAddress)}
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default NavBar;
