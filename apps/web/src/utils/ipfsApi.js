const IPFS_COURSE_METADATA_ENDPOINT = '/api/ipfs/course-metadata';

const parseApiResponse = async (response) => {
    let payload = {};

    try {
        payload = await response.json();
    } catch {
        payload = {};
    }

    if (!response.ok) {
        throw new Error(payload?.error || 'Unable to upload metadata to IPFS.');
    }

    return payload;
};

export const uploadCourseMetadata = async ({ course, profile }) => {
    if (!course || typeof course !== 'object') {
        throw new Error('Course data is required to upload metadata.');
    }

    const response = await fetch(IPFS_COURSE_METADATA_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course, profile }),
    });

    return parseApiResponse(response);
};
