import type { Types } from 'mongoose';

export type CategoryType = 'income' | 'expense';

export interface CategoryPayload {
  name: string;
  type: CategoryType;
  catalogId: Types.ObjectId;
}

export interface CategoryUpdatePayload {
  name: string;
  description?: string;
}

export interface CategoryWithUserPayload extends CategoryPayload {
  userId: Types.ObjectId;
  catalogId: Types.ObjectId;
}

export type CategoryListItem = CategoryWithUserPayload & {
  _id: Types.ObjectId;
  catalogId: Types.ObjectId | { _id: Types.ObjectId; name?: string };
  createdAt?: Date;
  updatedAt?: Date;
};