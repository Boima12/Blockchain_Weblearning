import React from 'react';
import {List, ListItem, ListItemIcon, ListItemText} from '@mui/material';
import styles from './CourseRequirements.module.css';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const getRequirements = (courseDetails) => {
    if (
        Array.isArray(courseDetails?.requirements) &&
        courseDetails.requirements.length > 0
    ) {
        return courseDetails.requirements;
    }

    if (
        Array.isArray(courseDetails?.prerequisites) &&
        courseDetails.prerequisites.length > 0
    ) {
        return courseDetails.prerequisites;
    }

    return ['No formal prerequisites. Bring consistency and curiosity.'];
};

function CourseRequirements({courseDetails}) {
    const requirements = getRequirements(courseDetails);

    return (
        <main className={styles.mainContainer}>
            <p className={styles.header}>Requirements</p>
            <List>
                {requirements.map((requirement, idx) => {
                    return (
                        <ListItem
                            key={idx}
                            className={styles.requirement}
                        >
                            <ListItemIcon>
                                <FiberManualRecordIcon
                                    style={{
                                        fontSize: 'small',
                                        color: '#1c1d1f',
                                    }}
                                ></FiberManualRecordIcon>
                            </ListItemIcon>
                            <ListItemText style={{marginLeft: '-0.5rem'}}>
                                {requirement}
                            </ListItemText>
                        </ListItem>
                    );
                })}
            </List>
        </main>
    );
}

export default CourseRequirements;
