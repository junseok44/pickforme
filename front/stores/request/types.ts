import { Product } from '../product/types';

interface Review {
  text: string,
  rating: number,
}

export enum RequestStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CLOSED = 'CLOSED',
}

export enum RequestType {
  RECOMMEND = 'RECOMMEND', // 픽포미 추천 (2.0)
  RESEARCH = 'RESEARCH', // 픽포미 분석 (2.0)
  QUESTION = 'QUESTION', // 픽포미 질문 (3.0)
  AI = 'AI', // AI 포미 (2.0)
}

export interface AnswerProduct { // 2.0 매니저 답변에 포함되는 상품 정보 포맷
  title: string,
  desc: string,
  url: string,
  price: number,
  tags: string[],
}

interface RequestBase {
  _id: string,
  name: string, // 의뢰 제목
  text: string, // 의뢰 내용
  status: RequestStatus, // 의뢰 상태
  product?: Product, // 의뢰 상품 (3.0)
  link?: string, // 의뢰 상품 링크 (2.0)                   
  answer?: { // 매니저 답변
    text: string,
    products: AnswerProduct[] // (2.0)
  },
  review?: Review, // 사용자 리뷰 (2.0)
  createdAt: string,
  updatedAt: string,
}

export interface RecommendRequestParams {
  type: RequestType.RECOMMEND,                         
  price: string, // 희망 가격대
  text: string,
  isPublic: boolean, // 공개 여부
}

export interface ResearchRequestParams {
  type: RequestType.RESEARCH,
  text: string,                              
  link?: string,
}

export interface QuestionRequestParams {
  type: RequestType.QUESTION,
  text: string,
  product?: Product,
}

interface RecommendRequest extends RequestBase, RecommendRequestParams {
}

interface ResearchRequest extends RequestBase, ResearchRequestParams {
}

interface QuestionRequest extends RequestBase, QuestionRequestParams {
}

export type Request = RecommendRequest | ResearchRequest | QuestionRequest;
export type RequestParams = RecommendRequestParams | ResearchRequestParams | QuestionRequestParams;

export interface GetRequestsParams {};