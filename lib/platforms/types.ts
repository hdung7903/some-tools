// ============================================
// COMMON PLATFORM TYPES
// ============================================

export type PlatformId = 'tinder' | 'bumble' | 'badoo';

export interface PlatformInfo {
    id: PlatformId;
    name: string;
    icon: string;
    color: string;
    gradient: string;
    website: string;
}

export interface PlatformUser {
    id: string;
    name: string;
    age?: number;
    bio?: string;
    photos: string[];
    distance?: number;
    /** platform-specific extra data */
    raw?: any;
}

export interface PlatformRecommendation {
    user: PlatformUser;
    /** platform-specific swipe token / s_number */
    swipeToken?: string;
    raw?: any;
}

export interface PlatformMatch {
    id: string;
    person: PlatformUser;
    lastMessage?: string;
    lastMessageTime?: string;
    raw?: any;
}

export interface PlatformMessage {
    id: string;
    fromMe: boolean;
    text: string;
    timestamp: string;
    raw?: any;
}

export interface PlatformProfile {
    id: string;
    name: string;
    age?: number;
    bio?: string;
    photos: string[];
    likesRemaining?: number | null;
    raw?: any;
}

export interface PlatformAuthConfig {
    [key: string]: any;
}

export interface PlatformSettings {
    likeRecommendUser: boolean;
    sendMessageToMatchedUser: boolean;
    message: string[];
    location: { lat: number; long: number };
    distance: number;
    distanceMax: number;
    autoExpandDistance: boolean;
    ageFilterMin: number;
    ageFilterMax: number;
    gender: string;
    likeDelayMs: number;
    messageDelayMs: number;
}

export interface LikeResult {
    success: boolean;
    matched: boolean;
    message?: string;
    rateLimited?: boolean;
}

export interface SendMessageResult {
    success: boolean;
    message?: string;
}

/**
 * Abstract platform adapter interface.
 * Each dating platform must implement this.
 */
export interface PlatformAdapter {
    readonly info: PlatformInfo;

    /** Validate auth and return user name if success */
    validateAuth(auth: PlatformAuthConfig): Promise<{ valid: boolean; name?: string; error?: string }>;

    /** Get profile of the authenticated user */
    getProfile(auth: PlatformAuthConfig): Promise<PlatformProfile | null>;

    /** Get recommendations / encounters */
    getRecommendations(auth: PlatformAuthConfig): Promise<PlatformRecommendation[]>;

    /** Like a user */
    likeUser(auth: PlatformAuthConfig, userId: string, swipeToken?: string): Promise<LikeResult>;

    /** Dislike / pass a user */
    dislikeUser(auth: PlatformAuthConfig, userId: string): Promise<{ success: boolean }>;

    /** Get matches list */
    getMatches(auth: PlatformAuthConfig): Promise<PlatformMatch[]>;

    /** Get messages for a match */
    getMessages(auth: PlatformAuthConfig, matchId: string): Promise<PlatformMessage[]>;

    /** Send a message to a match */
    sendMessage(auth: PlatformAuthConfig, matchId: string, text: string): Promise<SendMessageResult>;

    /** Unmatch a user */
    unmatch(auth: PlatformAuthConfig, matchId: string): Promise<{ success: boolean }>;

    /** Update location (optional, not all platforms support) */
    updateLocation?(auth: PlatformAuthConfig, lat: number, long: number): Promise<{ success: boolean }>;

    /** Update search preferences (distance, age, gender) */
    updatePreferences?(auth: PlatformAuthConfig, settings: PlatformSettings): Promise<{ success: boolean }>;

    /** Get the DevTools auth script for this platform */
    getAuthScript(): string;
}
