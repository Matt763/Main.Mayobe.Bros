import { getSupabaseClient } from './supabase.js';

export type ActivityType =
  | 'post'
  | 'page'
  | 'comment'
  | 'review'
  | 'subscriber'
  | 'publisher'
  | 'user'
  | 'system';

export type ActivityAction =
  | 'published'
  | 'created'
  | 'updated'
  | 'deleted'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'subscribed'
  | 'unsubscribed'
  | 'registered'
  | 'email_changed'
  | 'password_changed'
  | 'profile_updated';

export interface LogActivityOptions {
  userId?: string;
  userName?: string;
  userRole?: string;
  activityType: ActivityType;
  action: ActivityAction;
  contentTitle?: string;
  contentId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export function logActivity(opts: LogActivityOptions): void {
  const supabase = getSupabaseClient();

  const record = {
    user_id: opts.userId ?? null,
    user_name: opts.userName ?? 'System',
    user_role: opts.userRole ?? 'system',
    activity_type: opts.activityType,
    action: opts.action,
    content_title: opts.contentTitle ?? null,
    content_id: opts.contentId ?? null,
    description: opts.description,
    metadata: opts.metadata ?? null,
  };

  supabase
    .from('activity_logs')
    .insert(record)
    .then(({ error }) => {
      if (error) {
        console.error('[ActivityLogger] Failed to log activity:', error.message);
      }
    });
}
