import type { Types } from 'mongoose';

export interface CategoryPayload {
  name: string;
  description?: string;
}

export interface CategoryWithUserPayload extends CategoryPayload {
  userId: Types.ObjectId;
}
