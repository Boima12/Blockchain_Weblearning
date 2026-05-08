import React, {useState} from 'react';
import styles from './Card.module.css';
import StarsRating from '../stars-rating/StarsRating';
import {useNavigate} from 'react-router-dom';

const Card = ({course}) => {
    const title = course?.title ?? 'Untitled Course';

    const instructors = Array.isArray(course?.visible_instructors)
        ? course.visible_instructors
            .map((instructor) => instructor?.title ?? instructor?.name)
            .filter(Boolean)
            .join(', ')
        : '';

    const instructorLabel = instructors || course?.ownerDisplayName || 'Unknown Instructor';
    const image = course?.image_304x171 ?? course?.thumbnailUrl ?? course?.image_480x270;

    const ratingValue = Number(course?.rating ?? 4.5);
    const ratingLabel = Number.isFinite(ratingValue)
        ? ratingValue.toPrecision(2)
        : '4.5';

    const priceLabel =
        typeof course?.price === 'number'
            ? `${course.price.toFixed(2)} ${course?.token ?? 'MATIC'}`
            : '$15';

    const [anchorEl] = useState(null);
    
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/Blockchain-Weblearning/courses/${course.id}`);
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
                        <p className={styles.instructors}>{instructorLabel}</p>
                        <p className={styles.rating}>{ratingLabel}</p>
                        <StarsRating rating={ratingValue}/>
                        <p className={styles.price}>{priceLabel}</p>
                    </section>
                </article>
            </div>
        </>
    );
};

export default Card;
