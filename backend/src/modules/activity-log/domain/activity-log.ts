export type ActivityCategory = 'enrollment' | 'ward' | 'user' | 'sync';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'printed'
  | 'assigned';

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'enrollment',
  'ward',
  'user',
  'sync',
];

export const ACTIVITY_ACTIONS: ActivityAction[] = [
  'created',
  'updated',
  'status_changed',
  'printed',
  'assigned',
];

export type ActivityLogActor = {
  id: string;
  name: string;
};

export type ActivityLogEntry = {
  id: string;
  category: ActivityCategory;
  action: ActivityAction;
  summary: string;
  wardId: string;
  actor: ActivityLogActor | null;
  enrollmentId: string | null;
  occurredAt: Date;
};
