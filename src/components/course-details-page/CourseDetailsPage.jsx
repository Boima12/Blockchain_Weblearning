import React, {useEffect, useState} from 'react';
import styles from './CourseDetailsPage.module.css';
import { useNavigate } from 'react-router-dom';
import { getAppState } from '../../utils/appLocalState';

import Sticky from 'react-stickynode';
import StickyCardContent from '../sticky-card-content/StickyCardContent';
import SingleCourseHeader from '../single-course-header/SingleCourseHeader';
import CourseDescription from '../course-description/CourseDescription';
import CourseObjectives from '../course-objectives/CourseObjectives';
import CourseRequirements from '../course-requirements/CourseRequirements';
import BuyCourseNavBar from '../buy-course-nav-bar/BuyCourseNavBar';
import LoadingSpinner from '../loading-spinner/LoadingSpinner';

function CourseDetailsPage({courseDetails}) {
    const navigate = useNavigate();
    const [fetched, setAsFetched] = useState(false);
    const [additionalDetails, setAdditionalDetails] = useState({});

    const courseId = String(courseDetails?.id ?? '');
    const isPurchased = getAppState().purchasedCourses.some(
        (purchaseItem) => String(purchaseItem.courseId) === courseId,
    );

    const handleBuyNow = () => {
        if (!courseId) {
            return;
        }

        navigate(
            isPurchased
                ? `/learn-course/${courseId}`
                : `/buy-course/${courseId}`,
        );
    };

    useEffect(() => {
        fetch('https://api.npoint.io/427e24cf2470da9aecca')
            .then((response) => response.json())
            .then((jsonFile) => {
                setAdditionalDetails(jsonFile);
                setAsFetched(true);
            });
    }, []);

    return fetched ? (
        <main>
            <section>
                <Sticky
                    top={0}
                    bottomBoundary='#boundary'
                    innerZ={300}
                    enabled={true}
                >
                    <StickyCardContent
                        details={courseDetails}
                        additionalDetails={additionalDetails}
                        onBuyNow={handleBuyNow}
                        buyButtonLabel={isPurchased ? 'Go to course' : 'Buy now'}
                    />
                </Sticky>

                <SingleCourseHeader courseDetails={courseDetails} additionalDetails={additionalDetails}/>

                <div className={styles.body}>
                    <CourseObjectives courseDetails={courseDetails}/>
                    <CourseDescription details={additionalDetails}/>
                    <CourseRequirements details={additionalDetails}/>
                </div>

                <BuyCourseNavBar
                    details={courseDetails}
                    onBuyNow={handleBuyNow}
                    buyButtonLabel={isPurchased ? 'Go to course' : 'Buy now'}
                />
            </section>
        </main>
    ) : (
        <LoadingSpinner/>
    );
}

export default CourseDetailsPage;
