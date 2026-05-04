import { isSupportedUrl } from './learnCourseDataUtils';

const extractYouTubeId = (urlValue) => {
    try {
        const parsedUrl = new URL(urlValue);
        const host = parsedUrl.hostname.toLowerCase();

        if (host.includes('youtu.be')) {
            const shortId = parsedUrl.pathname.slice(1);
            return shortId || null;
        }

        if (host.includes('youtube.com')) {
            const paramId = parsedUrl.searchParams.get('v');
            if (paramId) {
                return paramId;
            }

            const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
            const embedIndex = pathSegments.findIndex((segment) => segment === 'embed');
            if (embedIndex >= 0 && pathSegments[embedIndex + 1]) {
                return pathSegments[embedIndex + 1];
            }
        }

        return null;
    } catch {
        return null;
    }
};

const extractVimeoId = (urlValue) => {
    try {
        const parsedUrl = new URL(urlValue);
        if (!parsedUrl.hostname.toLowerCase().includes('vimeo.com')) {
            return null;
        }

        const vimeoSegment = parsedUrl.pathname
            .split('/')
            .find((segment) => /^\d+$/.test(segment));

        return vimeoSegment || null;
    } catch {
        return null;
    }
};

export const getLessonMediaSource = (videoUrl) => {
    if (!videoUrl || !isSupportedUrl(videoUrl)) {
        return null;
    }

    const normalizedVideoUrl = videoUrl.trim();

    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(normalizedVideoUrl)) {
        return {
            type: 'video',
            src: normalizedVideoUrl,
        };
    }

    const youtubeId = extractYouTubeId(normalizedVideoUrl);
    if (youtubeId) {
        return {
            type: 'iframe',
            src: `https://www.youtube.com/embed/${youtubeId}`,
        };
    }

    const vimeoId = extractVimeoId(normalizedVideoUrl);
    if (vimeoId) {
        return {
            type: 'iframe',
            src: `https://player.vimeo.com/video/${vimeoId}`,
        };
    }

    return {
        type: 'iframe',
        src: normalizedVideoUrl,
    };
};
