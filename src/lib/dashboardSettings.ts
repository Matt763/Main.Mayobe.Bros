/**
 * Shared type for the singleton dashboard_settings.config blob.
 * Any change here must keep backward compatibility — existing rows in the DB
 * may not have new fields. Use defaults() to merge stored config with current shape.
 */

export interface DashboardSettings {
  features: {
    personalizedFeed: boolean;
    savedContent: boolean;
    learningSystem: boolean;
    jobsTracker: boolean;
    notifications: boolean;
    userStats: boolean;
    aiAssistant: boolean;
  };
  limits: {
    freeSavedPostsMax: number;
    freeReadingHistoryMax: number;
    freeNotificationsPerDay: number;
  };
  layout: {
    sectionVisibility: {
      recommended: boolean;
      saved: boolean;
      learning: boolean;
      jobs: boolean;
      notifications: boolean;
    };
    sectionOrder: string[];
  };
  personalization: {
    recommendationSource: 'category' | 'activity' | 'trending';
    defaultInterestIds: string[];
  };
  premium: {
    enabled: boolean;
    priceUsd: number;
    currency: string;
    premiumOnlyFeatures: string[];
  };
  notifications: {
    globalEnabled: boolean;
  };
  jobs: {
    showOnDashboard: boolean;
    featuredJobIds: string[];
  };
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  features: {
    personalizedFeed: true,
    savedContent: true,
    learningSystem: false,
    jobsTracker: true,
    notifications: true,
    userStats: true,
    aiAssistant: false,
  },
  limits: {
    freeSavedPostsMax: 10,
    freeReadingHistoryMax: 100,
    freeNotificationsPerDay: 5,
  },
  layout: {
    sectionVisibility: {
      recommended: true,
      saved: true,
      learning: false,
      jobs: true,
      notifications: true,
    },
    sectionOrder: ['recommended', 'saved', 'learning', 'jobs', 'notifications'],
  },
  personalization: {
    recommendationSource: 'category',
    defaultInterestIds: [],
  },
  premium: {
    enabled: true,
    priceUsd: 5,
    currency: 'USD',
    premiumOnlyFeatures: [],
  },
  notifications: {
    globalEnabled: true,
  },
  jobs: {
    showOnDashboard: true,
    featuredJobIds: [],
  },
};

/** Deep-merge stored config with defaults so missing keys in older rows don't crash UI. */
export function mergeWithDefaults(partial: Partial<DashboardSettings> | null | undefined): DashboardSettings {
  const d = DEFAULT_DASHBOARD_SETTINGS;
  if (!partial) return d;
  return {
    features:        { ...d.features,        ...(partial.features        || {}) },
    limits:          { ...d.limits,          ...(partial.limits          || {}) },
    layout: {
      sectionVisibility: { ...d.layout.sectionVisibility, ...(partial.layout?.sectionVisibility || {}) },
      sectionOrder:      partial.layout?.sectionOrder      || d.layout.sectionOrder,
    },
    personalization: { ...d.personalization, ...(partial.personalization || {}) },
    premium:         { ...d.premium,         ...(partial.premium         || {}) },
    notifications:   { ...d.notifications,   ...(partial.notifications   || {}) },
    jobs:            { ...d.jobs,            ...(partial.jobs            || {}) },
  };
}

export const DASHBOARD_SECTION_LABELS: Record<string, string> = {
  recommended:  'Recommended',
  saved:        'Saved',
  learning:     'Learning',
  jobs:         'Jobs',
  notifications:'Notifications',
};
