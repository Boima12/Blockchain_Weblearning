import React from 'react';
import styles from './StarsRating.module.css';

function StarsRating({rating, fontSize: size}) {
    const stars = Array.from({length: 5}, (_, i) => i < Math.round(rating));

    return (
        <div
            className={styles.starsContainer}
            style={{fontSize: size ? `${size}` : 'small'}}
        >
            {stars.map((filled, idx) => (
                <i
                    key={idx}
                    className={`fa-solid ${filled ? 'fa-star' : 'fa-star'}`}
                    style={{color: filled ? '#e59819' : '#ddd'}}
                />
            ))}
        </div>
    );
}

export default StarsRating;
