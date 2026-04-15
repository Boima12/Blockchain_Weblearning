import styles from './Certificate.module.css';
import { useNavigate, useParams } from 'react-router-dom';


function Co_Certificate() {
    const navigate = useNavigate();
    const { courseId } = useParams();

    return(
        <main className={styles.main_Certificate}>
            <section className={styles.placeholderBox}>
                <p className={styles.badge}>Step In Progress</p>
                <h1>Certificate Page</h1>
                <p>
                    Certificate rendering and PDF export for course{' '}
                    <strong>{courseId}</strong> will be implemented next.
                </p>

                <div className={styles.actions}>
                    <button
                        type='button'
                        onClick={() => navigate(`/learn-course/${courseId}`)}
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

export default Co_Certificate