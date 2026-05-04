import React from 'react';
import styles from './CourseDescription.module.css';
import FadedText from '../faded-text/FadedText';

const normalizeDescriptionHtml = (courseDetails) => {
    const sourceText = String(
        courseDetails?.description ??
            courseDetails?.headline ??
            courseDetails?.subtitle ??
            '',
    ).trim();

    if (!sourceText) {
        return '<p>No description provided yet.</p>';
    }

    const containsHtmlTags = /<\/?[a-z][\s\S]*>/i.test(sourceText);
    if (containsHtmlTags) {
        return sourceText;
    }

    const escaped = sourceText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

    return `<p>${escaped}</p>`;
};

function CourseDescription({courseDetails}) {
    return (
        <div className={styles.mainContainer}>
            <p className={styles.header}>Description</p>
            <FadedText rawHTML={normalizeDescriptionHtml(courseDetails)} />
        </div>
    );
}

export default CourseDescription;
