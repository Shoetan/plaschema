export const ID_CARD_QUEUE_PORT = Symbol('ID_CARD_QUEUE_PORT');

export type IdCardJobPayload = {
  enrollmentIds: string[];
  requestedByUserId: string;
};

export type IdCardJobResult = {
  objectKey: string;
  enrollmentIds: string[];
};

export type IdCardQueueJobState =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'unknown';

export type IdCardQueueJobView = {
  id: string;
  state: IdCardQueueJobState;
  failedReason?: string;
  returnvalue?: IdCardJobResult | null;
};

export interface IdCardQueuePort {
  enqueue(payload: IdCardJobPayload): Promise<string>;
  getJob(jobId: string): Promise<IdCardQueueJobView | null>;
}

export const ID_CARD_QUEUE_NAME = 'id-card-generation';
