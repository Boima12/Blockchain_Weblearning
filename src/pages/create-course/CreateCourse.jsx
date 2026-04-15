import styles from './CreateCourse.module.css';
import { useNavigate } from 'react-router-dom';


function Co_CreateCourse() {
    const navigate = useNavigate();

    return(
        <main className={styles.main_CreateCourse}>
            <section className={styles.placeholderBox}>
                <p className={styles.badge}>Step In Progress</p>
                <h1>Create Course Wizard</h1>
                <p>
                    The full multi-step course creation flow will be implemented
                    in the next iteration.
                </p>

                <div className={styles.actions}>
                    <button
                        type='button'
                        onClick={() => navigate('/')}
                    >
                        Back to Home
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

export default Co_CreateCourse