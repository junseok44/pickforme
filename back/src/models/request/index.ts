import mongoose from 'mongoose';
import { IRequest } from './types';

export enum RequestStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CLOSED = 'CLOSED',
}

export enum RequestType {
  RECOMMEND = 'RECOMMEND',
  RESEARCH = 'RESEARCH',
  QUESTION = 'QUESTION',
  AI = 'AI',
}

const RequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    type: {
      type: String,
      enum: Object.values(RequestType),
      default: RequestType.RECOMMEND,
    },
    name: {
      type: String,
    },
    text: {
      type: String,
      default: '',
    },
    product: {
      name: String,
      price: Number,
      origin_price: Number,
      discount_rate: Number,
      reviews: Number,
      ratings: Number,
      url: String,
      thumbnail: String,
    },
    review: {
      text: String,
      rating: Number,
    },
    answer: {
      default: undefined,
      type: {
        text: {
          type: String,
        },
        products: [
          {
            title: {
              type: String,
              default: '',
            },
            desc: {
              type: String,
              default: '',
            },
            price: {
              type: Number,
              default: 0,
            },
            tags: [
              {
                type: String,
              },
            ],
            url: {
              type: String,
            },
          },
        ],
      },
    },
    // price: {
    //   type: String,
    //   default: '0',
    // },
    // link: {
    //   type: String,
    // },
    // unreadCount: {
    //   type: Number,
    //   default: 0,
    // },
    // data: mongoose.Schema.Types.Mixed,
    // chats: [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Chats',
    // }],
    // isPublic: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  {
    timestamps: true,
  }
);
const RequestModel = mongoose.model<IRequest>('Requests', RequestSchema);

export default RequestModel;
