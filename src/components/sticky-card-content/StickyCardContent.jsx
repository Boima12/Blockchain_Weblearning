import React, {useEffect, useState} from 'react';
import styles from './StickyCardContent.module.css';
import ThisCourseIncludes from '../this-course-includes/ThisCourseIncludes';

function StickyCardContent({details, additionalDetails}) {
    const {image_750x422: image} = details;

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
                <p className={styles.price}>E£679.99</p>
                <button className={[styles.buyNowButton, styles.button].join(' ')}>
                    Buy now
                </button>

                <ThisCourseIncludes details={additionalDetails}/>

                <section className={styles.buttonsWrapper}></section>
            </div>
        </main>
    );
}

export default StickyCardContent;
