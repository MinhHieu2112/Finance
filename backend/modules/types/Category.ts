import { type Types } from 'mongoose';

export interface CategorySchema{
    userId: Types.ObjectId;
    name: string;
    description: string;
}

export interface DefaultCategorySchema{
    name: string;
    description: string;
}