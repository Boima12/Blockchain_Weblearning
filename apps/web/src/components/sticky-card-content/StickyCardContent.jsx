import React, {useEffect, useState} from 'react';
import styles from './StickyCardContent.module.css';
import ThisCourseIncludes from '../this-course-includes/ThisCourseIncludes';

const toCurrencyLabel = (value, token) =>
    `${Number(value ?? 0).toFixed(2)} ${token}`;

function StickyCardContent({
    details,
    additionalDetails,
    onBuyNow,
    buyButtonLabel = 'Buy now',
    isBuyDisabled = false,
}) {
    const image =
        details?.image_750x422 ?? details?.thumbnailUrl ?? details?.image_480x270;

    const token = String(details?.token ?? 'MATIC').toUpperCase();
    const basePrice = Number(details?.price ?? 199.99);
    const discount = Math.min(99, Math.max(0, Number(details?.discount ?? 0)));
    const finalPrice = basePrice * (1 - discount / 100);

    const [hidden, toggleHidden] = useState(false);

    const handleStyles = () => {
        if (window.scrollY > 400) {
            toggleHidden(true);
        } else {
            toggleHidden(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleStyles);
    }, []);

    return (
        <main
            className={styles.mainContainer}
            style={{
                position: 'absolute',
                marginTop: hidden ? '1rem' : '0',
                boxShadow: hidden ? '0 10px 10px #c2c9d6' : 'none'
            }}
        >
            <figure className={hidden ? styles.hide : styles.imageWrapper}>
                <img
                    className='d-block w-100'
                    src={image}
                    alt=''
                />
            </figure>

            <div className={styles.cardBody}>
                <p className={styles.price}>{toCurrencyLabel(finalPrice, token)}</p>
                {discount > 0 ? (
                    <p className={styles.oldPrice}>{toCurrencyLabel(basePrice, token)}</p>
                ) : null}

                <button
                    type='button'
                    className={[styles.buyNowButton, styles.button].join(' ')}
                    onClick={onBuyNow}
                    disabled={isBuyDisabled}
                >
                    {buyButtonLabel}
                </button>

                <ThisCourseIncludes details={additionalDetails}/>

                <section className={styles.buttonsWrapper}></section>
            </div>
        </main>
    );
}

export default StickyCardContent;
