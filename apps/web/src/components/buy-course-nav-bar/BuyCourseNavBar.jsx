import React, {useEffect, useState} from 'react';
import styles from './BuyCourseNavBar.module.css';
import StarsRating from '../stars-rating/StarsRating';

const toCurrencyLabel = (value, token) =>
    `${Number(value ?? 0).toFixed(2)} ${token}`;

function BuyCourseNavBar({
    details,
    onBuyNow,
    buyButtonLabel = 'Buy now',
    isBuyDisabled = false,
}) {
    const [hidden, toggleHidden] = useState(true);

    const token = String(details?.token ?? 'MATIC').toUpperCase();
    const basePrice = Number(details?.price ?? 199.99);
    const discount = Math.min(99, Math.max(0, Number(details?.discount ?? 0)));
    const finalPrice = basePrice * (1 - discount / 100);

    useEffect(() => {
        const hideNav = () => {
            toggleHidden(window.scrollY <= 150);
        };

        const editMargin = () => {
            const footer = document.querySelector('#page-footer');
            if (!footer) {
                return;
            }

            if (window.innerWidth >= 1080) {
                footer.style.marginBottom = 0;
            } else {
                footer.style.marginBottom = '4rem';
            }
        };

        hideNav();
        editMargin();
        window.addEventListener('scroll', hideNav);
        window.addEventListener('resize', editMargin);

        return () => {
            window.removeEventListener('scroll', hideNav);
            window.removeEventListener('resize', editMargin);
        };
    }, []);

    const {title, rating, num_subscribers: subscribers} = details;

    return (<div
        id='buyBar'
        className={hidden ? styles.hide : styles.bar}
    >
        <div className={styles.barContent}>
            <div className={styles.barLeftContent}>
                <p className={styles.courseTitle}>{title}</p>
                <span>
                    <StarsRating rating={rating}/>
                    {' '}

                    <span className={styles.ratingDetails}>
                        <span className={styles.numOfRatings}>
                            (3,322 ratings)
                        </span>
                        {' '}
                        {subscribers} students
                    </span>
                </span>
            </div>

            {/* barRightContent là cho mobile, mà làm Blockchain thì chắc không cần Responsive :d */}
            <div className={styles.barRightContent}>
                <div className={styles.price}>
                    <span className={styles.newPrice}>{toCurrencyLabel(finalPrice, token)}</span>
                    {discount > 0 ? (
                        <span className={styles.oldPrice}>{toCurrencyLabel(basePrice, token)}</span>
                    ) : null}
                </div>
                <button
                    type='button'
                    className={styles.buyNowButton}
                    onClick={onBuyNow}
                    disabled={isBuyDisabled}
                >
                    {buyButtonLabel}
                </button>
            </div>
        </div>
    </div>);
}

export default BuyCourseNavBar;
