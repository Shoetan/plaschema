export const ID_CARD_QUEUE_PORT = Symbol('ID_CARD_QUEUE_PORT');

export type IdCardJobPayload = {
  enrollmentIds: string[];
  requestedByUserId: string;
};

export type IdCardJobResult = {
  objectKey: string;
  enrollmentIds: string[];
};

export interface IdCardQueuePort {
  enqueue(payload: IdCardJobPayload, jobId: string): Promise<string>;
}

export const ID_CARD_QUEUE_NAME = 'id-card-generation';
