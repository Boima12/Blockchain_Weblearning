import React, { useSyncExternalStore } from 'react';
import styles from './CourseDetailsPage.module.css';
import { useNavigate } from 'react-router-dom';
import {
    getAppState,
    getAuthSessionSnapshot,
    subscribeToAuthSession,
} from '../../utils/appLocalState';

import Sticky from 'react-stickynode';
import StickyCardContent from '../sticky-card-content/StickyCardContent';
import SingleCourseHeader from '../single-course-header/SingleCourseHeader';
import CourseDescription from '../course-description/CourseDescription';
import CourseObjectives from '../course-objectives/CourseObjectives';
import CourseRequirements from '../course-requirements/CourseRequirements';
import BuyCourseNavBar from '../buy-course-nav-bar/BuyCourseNavBar';

function CourseDetailsPage({courseDetails}) {
    const navigate = useNavigate();
    const authSession = useSyncExternalStore(
        subscribeToAuthSession,
        getAuthSessionSnapshot,
        () => null,
    );

    const courseId = String(courseDetails?.id ?? '');
    const isPurchased = getAppState().purchasedCourses.some(
        (purchaseItem) => String(purchaseItem.courseId) === courseId,
    );
    const isAuthenticated = Boolean(authSession?.accountId);
    const isBuyDisabled = !isAuthenticated && !isPurchased;
    const buyButtonLabel = isBuyDisabled
        ? 'Connect to wallet first'
        : isPurchased
            ? 'Go to course'
            : 'Buy now';

    const handleBuyNow = () => {
        if (!courseId) {
            return;
        }

        if (isBuyDisabled) {
            return;
        }

        navigate(
            isPurchased
                ? `/learn-course/${courseId}`
                : `/buy-course/${courseId}`,
        );
    };

    return (
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
                        additionalDetails={courseDetails}
                        onBuyNow={handleBuyNow}
                        buyButtonLabel={buyButtonLabel}
                        isBuyDisabled={isBuyDisabled}
                    />
                </Sticky>

                <SingleCourseHeader courseDetails={courseDetails}/>

                <div className={styles.body}>
                    <CourseObjectives courseDetails={courseDetails}/>
                    <CourseDescription courseDetails={courseDetails}/>
                    <CourseRequirements courseDetails={courseDetails}/>
                </div>

                <BuyCourseNavBar
                    details={courseDetails}
                    onBuyNow={handleBuyNow}
                    buyButtonLabel={buyButtonLabel}
                    isBuyDisabled={isBuyDisabled}
                />
            </section>
        </main>
    );
}

export default CourseDetailsPage;
