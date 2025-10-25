import {
  EventMembershipProductReward,
  IProduct,
  MembershipProductReward,
  ProductReward,
} from 'models/product';
import { Model, Document, ClientSession } from 'mongoose';

export interface LocalRegisterPayload {
  email: string;
}

export enum PushService {
  on = 'on',
  off = 'off',
}

export interface PushSetting {
  service: PushService;
}

export interface MembershipStatus {
  isActive: boolean;
  leftDays: number;
  expiresAt: Date | null;
  membershipAt: Date | null;
  msg: string;
}

export interface User extends LocalRegisterPayload {
  point: number;
  aiPoint: number;
  level: number;
  push: PushSetting;
  lastLoginAt: Date;
  pushToken?: string;
  originEmail?: string;
  MembershipAt: Date | null;
  lastMembershipAt: Date | null;
  MembershipExpiresAt: Date | null;
  currentMembershipProductId: string | null;
  phone?: string;
  event: number | null;
  hide?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends User, Document {
  generateToken: () => Promise<string>;
  generateRefreshToken: () => Promise<string>; //리프레시 토큰 생성 메서드 추가
  clearRefreshToken: () => Promise<void>; //
  usePoint(payload: number): Promise<number>;
  useAiPoint(payload: number): Promise<number>;
  processExpiredMembership: (options?: { session?: ClientSession }) => Promise<void>;
  initMonthPoint: () => Promise<void>;
  applyProductRewards: (
    rewards: ProductReward,
    session?: ClientSession,
    isAdditional?: boolean
  ) => Promise<void>;
  applyInitialMembershipRewards: (
    rewards: MembershipProductReward,
    session?: ClientSession,
    isAdditional?: boolean
  ) => Promise<void>;
  applyMembershipRenewalRewards: (
    rewards: MembershipProductReward,
    session?: ClientSession,
    isAdditional?: boolean
  ) => Promise<void>;
  applyEventMembershipRewards: (
    rewards: EventMembershipProductReward,
    session?: ClientSession,
    isAdditional?: boolean
  ) => Promise<void>;
  getCurrentEventId: () => Promise<number | null>;
  getMembershipStatus: () => MembershipStatus;
  shouldRenewMembership: (currentProduct: IProduct) => boolean;
}

export interface UserModel extends Model<UserDocument> {
  localRegister(payload: LocalRegisterPayload): UserDocument;
}
