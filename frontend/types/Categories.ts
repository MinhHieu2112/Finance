// Category entity returned by backend API
export interface Category {
  _id: string;
  userId: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}
