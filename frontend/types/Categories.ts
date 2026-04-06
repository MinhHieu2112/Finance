// Category entity returned by backend API
export interface Category {
  _id: string;
  userId: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryOption {
  _id: string;
  name: string;
}

export interface ListCategoryResponse {
  success: boolean;
  categories: Category[];
}

export interface SaveCategoryResponse {
  success: boolean;
  category: Category;
}
