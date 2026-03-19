// Shared state cho auto process
let isAutoRunning = false;
let autoLikeInterval: ReturnType<typeof setInterval> | null = null;
let autoLikeCatalogInterval: ReturnType<typeof setInterval> | null = null;
let autoMessageInterval: ReturnType<typeof setInterval> | null = null;
let sentMessages: Set<string> = new Set();
let currentDistanceFilter = 0;

export const autoState = {
    get isAutoRunning() {
        return isAutoRunning;
    },
    set isAutoRunning(value: boolean) {
        isAutoRunning = value;
        if (!value) {
            sentMessages.clear();
        }
    },
    get autoLikeInterval() {
        return autoLikeInterval;
    },
    set autoLikeInterval(value: ReturnType<typeof setInterval> | null) {
        autoLikeInterval = value;
    },
    get autoLikeCatalogInterval() {
        return autoLikeCatalogInterval;
    },
    set autoLikeCatalogInterval(value: ReturnType<typeof setInterval> | null) {
        autoLikeCatalogInterval = value;
    },
    get autoMessageInterval() {
        return autoMessageInterval;
    },
    set autoMessageInterval(value: ReturnType<typeof setInterval> | null) {
        autoMessageInterval = value;
    },
    hasSentMessage(matchId: string): boolean {
        return sentMessages.has(matchId);
    },
    markMessageSent(matchId: string) {
        sentMessages.add(matchId);
    },
    get currentDistanceFilter() {
        return currentDistanceFilter;
    },
    set currentDistanceFilter(value: number) {
        currentDistanceFilter = value;
    },
    stopAll() {
        isAutoRunning = false;
        sentMessages.clear();
        currentDistanceFilter = 0;
        if (autoLikeInterval) {
            clearInterval(autoLikeInterval);
            autoLikeInterval = null;
        }
        if (autoLikeCatalogInterval) {
            clearInterval(autoLikeCatalogInterval);
            autoLikeCatalogInterval = null;
        }
        if (autoMessageInterval) {
            clearInterval(autoMessageInterval);
            autoMessageInterval = null;
        }
    }
};
