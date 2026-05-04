import React from 'react';
import styles from './ThisCourseIncludes.module.css';
import {
    AllInclusive,
    Download,
    EmojiEvents,
    InsertDriveFile,
    OndemandVideo,
    StayCurrentPortrait,
} from '@mui/icons-material';
import {List, ListItem, ListItemIcon, ListItemText} from '@mui/material';

const toMinutes = (durationValue) => {
    if (typeof durationValue === 'number' && Number.isFinite(durationValue)) {
        return Math.max(0, durationValue);
    }

    const raw = String(durationValue ?? '').trim().toLowerCase();
    if (!raw) {
        return 0;
    }

    const hourMatch = raw.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/i);
    if (hourMatch) {
        return Number(hourMatch[1]) * 60;
    }

    const minuteMatch = raw.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/i);
    if (minuteMatch) {
        return Number(minuteMatch[1]);
    }

    const clockMatch = raw.match(/^(\d+):(\d{1,2})$/);
    if (clockMatch) {
        return Number(clockMatch[1]) + Number(clockMatch[2]) / 60;
    }

    const numericFallback = Number(raw);
    return Number.isFinite(numericFallback) ? numericFallback : 0;
};

const getCourseIncludes = (details) => {
    const fallbackHours = 1;
    const fallbackAssets = 0;

    const seconds = Number(details?.content_length_video);
    const hoursFromSeconds = Number.isFinite(seconds) && seconds > 0
        ? seconds / 3600
        : 0;

    const lessons = Array.isArray(details?.curriculum)
        ? details.curriculum.flatMap((moduleItem) =>
              Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [],
          )
        : [];

    const totalLessonMinutes = lessons.reduce(
        (sum, lesson) => sum + toMinutes(lesson?.duration),
        0,
    );

    const estimatedHoursFromLessons = totalLessonMinutes > 0
        ? totalLessonMinutes / 60
        : lessons.length > 0
            ? lessons.length * 0.35
            : 0;

    const totalHours = Math.max(
        fallbackHours,
        Number((hoursFromSeconds || estimatedHoursFromLessons).toFixed(1)),
    );

    const downloadable = Number.isFinite(Number(details?.num_additional_assets))
        ? Number(details.num_additional_assets)
        : fallbackAssets;

    return {
        totalHours,
        downloadable,
    };
};

function ThisCourseIncludes({details}) {
    const { totalHours, downloadable } = getCourseIncludes(details);

    const icons = [
        <OndemandVideo className={styles.black}/>,
        <InsertDriveFile className={styles.black}/>,
        <Download className={styles.black}/>,
        <AllInclusive className={styles.black}/>,
        <StayCurrentPortrait className={styles.black}/>,
        <EmojiEvents className={styles.black}/>,
    ];
    const itemsText = [
        `${totalHours} hours on-demand video`,
        '1 article',
        `${downloadable} downloadable resources`,
        'Full lifetime access',
        'Access on mobile and TV',
        'Certificate of completion',
    ];

    return (
        <main className={styles.mainContainer}>
            <p className={styles.header}>This course includes:</p>
            <List>
                {icons.map((icon, idx) => {
                    return (
                        <ListItem
                            key={idx}
                            disablePadding
                            className={styles.listItem}
                        >
                            <ListItemIcon>{icon}</ListItemIcon>
                            <ListItemText className={styles.itemText}>
								<span className={styles.black}>
									{itemsText[idx]}
								</span>
                            </ListItemText>
                        </ListItem>
                    );
                })}
            </List>
        </main>
    );
}

export default ThisCourseIncludes;
