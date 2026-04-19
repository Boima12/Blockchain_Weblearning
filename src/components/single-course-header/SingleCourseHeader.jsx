import React from 'react';
import styles from './SingleCourseHeader.module.css';
import './iconStyle.css';
import { useNavigate } from 'react-router-dom';
import StarsRating from '../stars-rating/StarsRating';

function SingleCourseHeader({courseDetails}) {

    const navigate = useNavigate();

    const title = courseDetails?.title ?? 'Untitled Course';
    const headline =
        courseDetails?.headline || courseDetails?.subtitle || courseDetails?.description;

    const ratingValue = Number(courseDetails?.rating ?? 4.5);
    const subscribers = Number(courseDetails?.num_subscribers ?? 0);

    const instructors = Array.isArray(courseDetails?.visible_instructors)
        ? courseDetails.visible_instructors
        : [
            {
                name: courseDetails?.ownerDisplayName ?? 'Instructor',
            },
        ];

    const lastUpdate =
        courseDetails?.last_update_date ||
        String(courseDetails?.updatedAt ?? new Date().toISOString()).slice(0, 10);

    const [year, month] = String(lastUpdate).split('-');
    const parsedDate = new Date(Number(year), Number(month) - 1);
    const date = Number.isNaN(parsedDate.getTime())
        ? new Date()
        : parsedDate;

    const languages =
        Array.isArray(courseDetails?.caption_languages) &&
        courseDetails.caption_languages.length > 0
            ? courseDetails.caption_languages
            : [courseDetails?.language ?? 'English'];

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
                                {ratingValue.toPrecision(2)}
                            </p>

                            <StarsRating rating={ratingValue}/>
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
                                        .map((instructor) =>
                                            instructor?.name ?? instructor?.title,
                                        )
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
