import React, {useState} from 'react';
import styles from './Card.module.css';
import StarsRating from '../stars-rating/StarsRating';
import {useNavigate} from 'react-router-dom';

const Card = ({course}) => {
    const {title, visible_instructors, image_304x171: image, rating} = course;
    const instructors = visible_instructors
        .map((instructor) => instructor.title)
        .join(', ');

    const [anchorEl] = useState(null);
    
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/Udemy-Clone-ReactJS/courses/${course.id}`);
    };

    return (
        <>
            <div
                aria-owns={open ? 'mouse-over-popover' : undefined}
                aria-haspopup='true'
                className={styles.courseWrapper}
                onClick={handleClick}
            >
                <article className={styles.card}>
                    <figure className={styles.wrapper}>
                        <img
                            src={image}
                            alt=''
                        />
                    </figure>
                    <section className={styles.body}>
                        <p className={styles.title}>{title}</p>
                        <p className={styles.instructors}>{instructors}</p>
                        <p className={styles.rating}>{rating.toPrecision(2)}</p>
                        <StarsRating rating={rating}/>
                        <p className={styles.price}>$15</p>
                    </section>
                </article>
            </div>
        </>
    );
};

export default Card;
