import { UserData } from '../auth/types';
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

export interface Chat {
  _id: string,
  createdAt: string,
  isMine: boolean,
  text: string,
  requestId: string,
  button?: {
    text: string,
    deeplink: string,
  },
}

export interface Preview {
  link: string,
  image: string,
  title: string,
  desc: string,
}

export interface GetPreviewParams extends Pick<Preview, 'link'> {};

export interface SendChatParams extends Pick<Chat, 'text' | 'requestId'> {};
export interface GetRequestParams extends Pick<Chat, 'requestId'> {};

export interface Product {
  title: string,
  desc: string,
  url: string,
  price: number,
  tags: string[],
}

export interface DiscoverProduct {
  name: string,
  price: number,
  origin_price: number,
  discount_rate: number,
  ratings: number,
  reviews: number,
  thumbnail: string,
  url: string,
}

interface RequestBase {
  _id: string,
  name: string,
  status: RequestStatus,
  createdAt: string,
  chats: Chat[],
  userId?: UserData,
  text: string,                    
  answer: {
    text: string,
    products: Product[]
  },
  review?: {
    text: string,
    rating: number
  }
}

export interface PostAnswerParams extends Pick<Request, 'answer'>, Pick<Chat, 'requestId'> {
};

export interface RecommendRequestParams {
  type: RequestType.RECOMMEND,                         
  price: string,
  text: string,                              
}

export interface ResearchRequestParams {
  text: string,                              
  type: RequestType.RESEARCH,
  link: string,
}

export interface QuestionRequestParams {
  type: RequestType.QUESTION,
  text: string,
  product: DiscoverProduct,
}

interface RecommendRequest extends RequestBase, RecommendRequestParams {
}

interface ResearchRequest extends RequestBase, ResearchRequestParams {
}

interface QuestionRequest extends RequestBase, QuestionRequestParams {
}

export type Request = RecommendRequest | ResearchRequest | QuestionRequest;

export interface GetRequestsParams {
  page?: number,
  pageSize?: number,
  start?: string,
  end?: string,
  type?: string,
};

export interface GetRequestsResponse {
  requests: Request[],
  totalRequests: number,
  totalPages: number,
  currentPage: number,
}
