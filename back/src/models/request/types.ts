import { Document } from 'mongoose';

export interface IRequest extends Document {
  userId: {
    email: string;
    // 다른 필요한 userId 관련 필드들
  };
  status: string;
  type: string;
  name: string;
  text: string;
  product: {
    name: string;
    price: number;
    origin_price: number;
    discount_rate: number;
    reviews: number;
    ratings: number;
    url: string;
    thumbnail: string;
  };
  review: {
    text: string;
    rating?: number | string;
  };
  answer: {
    text: string;
    products: Array<{
      title: string;
      desc: string;
      price: number;
      tags: string[];
      url: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}
