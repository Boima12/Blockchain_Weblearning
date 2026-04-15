import styles from './LearnCourse.module.css';
import { useNavigate, useParams } from 'react-router-dom';


function Co_LearnCourse() {
    const navigate = useNavigate();
    const { courseId } = useParams();

    return(
        <main className={styles.main_LearnCourse}>
            <section className={styles.placeholderBox}>
                <p className={styles.badge}>Step In Progress</p>
                <h1>Learn Course Experience</h1>
                <p>
                    Course ID: <strong>{courseId}</strong>
                </p>
                <p>
                    Sidebar lessons, video area, and progress tracking will be
                    implemented next.
                </p>

                <div className={styles.actions}>
                    <button
                        type='button'
                        onClick={() => navigate(`/Blockchain-Weblearning/courses/${courseId}`)}
                    >
                        Open Course Details
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

export default Co_LearnCourse