import React from 'react';
import styles from './NavBar.module.css';
import SearchBar from '../search-bar/SearchBar';
import { useNavigate } from 'react-router-dom';

function NavBar() {

    const navigate = useNavigate();

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
                    >
                        Create Course
                    </button>
                </li>

                <li className={styles.profileButton}>
                    <button
                        type='button'
                        name='profile-button'
                    >
                        Profile
                    </button>
                </li>

                <li className={styles.walletLogoutButton}>
                    <button
                        type='button'
                        name='wallet-logout-button'
                    >
                        Wallet name and logout
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default NavBar;
