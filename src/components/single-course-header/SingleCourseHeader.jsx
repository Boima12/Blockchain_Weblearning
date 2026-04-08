import React from 'react';
import styles from './SingleCourseHeader.module.css';
import './iconStyle.css';
import { useNavigate } from 'react-router-dom';
import StarsRating from '../stars-rating/StarsRating';

function SingleCourseHeader({courseDetails}) {

    const navigate = useNavigate();

    const {
        title,
        headline,
        rating,
        num_subscribers: subscribers,
        visible_instructors: instructors,
        last_update_date: lastUpdate,
        caption_languages: languages,
    } = courseDetails;

    const [year, month] = lastUpdate.split('-');
    const date = new Date(year, month - 1);

    return (
        <>
            <main className={styles.mainContainer}>
                <div className={styles.body}>
                    <section className={styles.categoriesSection}>
                        <p className={styles.subCategory} onClick={() => navigate('/')}>Home</p>
                    </section>

                    <section className={styles.coursePreview}>
                        {/* <figure className={[styles.imageWrapper, styles.hide].join(' ')}>
                            <img
                                src={image}
                                alt={courseDetails.category}
                            />
                        </figure> */}

                        <section className={styles.mainDetails}>
                            <h1 className={styles.title}>{title}</h1>
                            <p>{headline}</p>
                            <p className={styles.rating}>
                                {rating.toPrecision(2)}
                            </p>

                            <StarsRating rating={rating}/>
                            <p className={styles.linkLikeText}>
                                (2,305 ratings)
                            </p>
                            <p
                                style={{
                                    display: 'inline-block',
                                    marginLeft: '7px',
                                }}
                            >
                                {subscribers} students
                            </p>
                            <p>
                                Created by{' '}
                                <span className={styles.linkLikeText}>
									{instructors
                                        .map((instructor) => instructor.name)
                                        .join(', ')}
								</span>
                            </p>

                            <div className={styles.lastUpdateLangWrapper}>
                                <p>
                                    <i className='fa-solid fa-circle-exclamation'></i>
                                    <span className={styles.lastUpdate}>
										Last updated
										<span className={styles.lastUpdateDate}>
											{date.getMonth() + 1}/
                                            {date.getFullYear()}
										</span>
									</span>
                                </p>

                                <p>
                                    <i className='fa-solid fa-globe'></i>{' '}
                                    English
                                </p>
                                
                                <p>
                                    <i className='fa-solid fa-closed-captioning'></i>
                                    <span className={styles.languages}>
										{languages.join(', ')}
									</span>
                                </p>
                            </div>
                        </section>
                    </section>
                </div>
            </main>
        </>
    );
}

export default SingleCourseHeader;
