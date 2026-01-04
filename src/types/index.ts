import {
    PostType,
    PostAudience,
    AccountPrivacy,
    DMPrivacy,
    GoalType,
    WeightUnit,
    NotificationType,
} from "@prisma/client";

// Re-export enums for client use
export {
    PostType,
    PostAudience,
    AccountPrivacy,
    DMPrivacy,
    GoalType,
    WeightUnit,
    NotificationType,
};

// User types
export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    location: string | null;
    website: string | null;
    pronouns: string | null;
    gymSplit: string | null;
    trainingDays: string[];
    goal: GoalType;
    createdAt: Date;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isFollowing?: boolean;
    isFollowedBy?: boolean;
}

export interface UserStats {
    followers: number;
    following: number;
    posts: number;
}

// Post types
export interface PostMetadata {
    exercise?: string;
    sets?: number;
    reps?: number;
    weight?: number;
    unit?: WeightUnit;
    rpe?: number;
    duration?: number;
}

export interface PostAuthor {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface PostData {
    id: string;
    content: string;
    imageUrl: string | null;
    type: PostType;
    metadata: PostMetadata | null;
    audience: PostAudience;
    parentId: string | null;
    threadRootId: string | null;
    repostOfId: string | null;
    isQuote: boolean;
    likesCount: number;
    repliesCount: number;
    repostsCount: number;
    author: PostAuthor;
    createdAt: Date;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isReposted?: boolean;
    parent?: PostData | null;
    repostOf?: PostData | null;
}

// Feed types
export interface FeedResponse {
    posts: PostData[];
    nextCursor: string | null;
    hasMore: boolean;
}

// Weight tracking types
export interface WeightLogData {
    id: string;
    weight: number;
    unit: WeightUnit;
    notes: string | null;
    loggedAt: Date;
}

export interface WeightChartData {
    date: string;
    weight: number;
}

// Personal Record types
export interface PersonalRecordData {
    id: string;
    exercise: string;
    weight: number;
    unit: WeightUnit;
    reps: number;
    achievedAt: Date;
}

// Notification types
export interface NotificationData {
    id: string;
    type: NotificationType;
    read: boolean;
    actor: PostAuthor;
    post?: {
        id: string;
        content: string;
    } | null;
    createdAt: Date;
}

// Settings types
export interface PrivacySettings {
    accountPrivacy: AccountPrivacy;
    allowDMs: DMPrivacy;
    showMetrics: boolean;
    discoverable: boolean;
}

export interface AppearanceSettings {
    theme: "light" | "dark" | "system";
    fontSize: "small" | "medium" | "large";
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Search types
export interface SearchResult {
    users: UserProfile[];
    posts: PostData[];
}
