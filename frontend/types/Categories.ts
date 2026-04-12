export type CategoryType = 'income' | 'expense';

// Category entity returned by backend API
export interface Category {
  _id: string;
  userId: string;
  catalogId: string;
  catalogName?: string;
  name: string;
  description?: string;
  type: CategoryType;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryOption {
  _id: string;
  catalogId: string;
  catalogName?: string;
  name: string;
  type: CategoryType;
}

export interface ListCategoryResponse {
  success: boolean;
  categories: Category[];
}

export interface SaveCategoryResponse {
  success: boolean;
  category: Category;
}
