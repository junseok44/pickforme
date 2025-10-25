import mongoose, { ClientSession } from 'mongoose';
import jwt from 'utils/jwt';

import { UserDocument, UserModel, LocalRegisterPayload, PushService } from './types';
import {
  EventMembershipProductReward,
  IProduct,
  MembershipProductReward,
  ProductReward,
} from 'models/product';
import constants from '../../constants';

const { POINTS } = constants;

const uniqueValidator = require('mongoose-unique-validator');

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    // 매니저 요청 횟수
    point: {
      type: Number,
      default: 0,
    },
    // AI 요청 횟수
    aiPoint: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    pushToken: {
      type: String,
    },
    push: {
      service: {
        type: String,
        enum: Object.values(PushService),
        default: PushService.on,
      },
    },
    originEmail: {
      type: String,
    },
    // 멤버쉽 시작 시점.
    MembershipAt: {
      type: Date,
      default: null,
    },
    // 멤버쉽 갱신 시점.
    lastMembershipAt: {
      type: Date,
      default: null,
    },
    // 멤버쉽 만료 시점.
    MembershipExpiresAt: {
      type: Date,
      default: null,
    },
    currentMembershipProductId: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
    },
    // 이벤트 멤버십을 적용한 경우 이벤트 번호를 저장.
    // currentProductId쪽으로 migration 하는 중.
    event: {
      type: Number,
      default: null,
    },
    hide: [
      {
        // popup 모델의 popup_id 값을 저장.
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.plugin(uniqueValidator, {
  message: 'is already taken.',
});

UserSchema.methods.generateToken = async function generateToken() {
  const { _id, email } = this;
  const payload = {
    _id,
    email,
  };
  const token = await jwt.generateAccessToken(payload);
  return token;
};

UserSchema.methods.generateRefreshToken = async function generateRefreshToken() {
  const { _id, email } = this;
  const payload = { _id, email };
  const refreshToken = await jwt.generateRefreshToken(payload);

  this.refreshToken = refreshToken;
  await this.save();

  return refreshToken;
};

// ✅ Refresh Token 제거 (로그아웃 시 사용)
UserSchema.methods.clearRefreshToken = async function clearRefreshToken() {
  this.refreshToken = null;
  await this.save();
};

UserSchema.methods.usePoint = async function usePoint(payload: number) {
  if (this.point < payload) {
    throw new Error('포인트가 부족합니다.');
  }
  this.point -= payload;
  await this.save();
  return this.point;
};

UserSchema.methods.useAiPoint = async function useAiPoint(payload: number) {
  if (this.aiPoint < payload) {
    throw new Error('포인트가 부족합니다.');
  }
  this.aiPoint -= payload;
  await this.save();
  return this.aiPoint;
};

UserSchema.methods._applyProductRewards = async function _applyProductRewards(
  rewards: ProductReward,
  isAdditional = false
) {
  if (isAdditional) {
    this.point += rewards.point;
    this.aiPoint += rewards.aiPoint;
  } else {
    this.point = rewards.point;
    this.aiPoint = rewards.aiPoint;
  }
};

UserSchema.methods.applyProductRewards = async function applyProductRewards(
  rewards: ProductReward,
  session?: mongoose.ClientSession,
  isAdditional = false
) {
  await this._applyProductRewards(rewards, isAdditional);

  await this.save({ session });
};

UserSchema.methods._applyInitialMembershipRewards = async function _applyInitialMembershipRewards(
  rewards: MembershipProductReward,
  isAdditional = false
) {
  const currentStatus = this.getMembershipStatus();

  if (currentStatus.isActive) {
    await this._processExpiredMembership();
  }

  await this._applyProductRewards(rewards, isAdditional);

  this.MembershipAt = new Date();
  this.lastMembershipAt = new Date();

  this.MembershipExpiresAt = new Date(
    this.MembershipAt.getTime() + rewards.periodDate * 24 * 60 * 60 * 1000
  );

  this.currentMembershipProductId = rewards.productId;
};

// 멤버쉽 첫 구매 시 포인트 충전 메서드.
UserSchema.methods.applyInitialMembershipRewards = async function applyInitialMembershipRewards(
  rewards: MembershipProductReward,
  session?: mongoose.ClientSession,
  isAdditional = false
) {
  await this._applyInitialMembershipRewards(rewards, isAdditional);

  await this.save({ session });
};

UserSchema.methods._applyMembershipRenewalRewards = async function _applyMembershipRenewalRewards(
  rewards: MembershipProductReward,
  isAdditional = false
) {
  await this._applyProductRewards(rewards, isAdditional);

  this.lastMembershipAt = new Date();
  this.markModified('lastMembershipAt');
};

// 멤버쉽 갱신 시 포인트 충전 메서드.
UserSchema.methods.applyMembershipRenewalRewards = async function applyMembershipRenewalRewards(
  rewards: MembershipProductReward,
  session?: mongoose.ClientSession,
  isAdditional = false
) {
  await this._applyMembershipRenewalRewards(rewards, isAdditional);

  await this.save({ session });
};

UserSchema.methods._applyEventMembershipRewards = async function _applyEventMembershipRewards(
  rewards: EventMembershipProductReward,
  isAdditional = false
) {
  this.event = rewards.event;
  await this._applyInitialMembershipRewards(rewards, isAdditional);
};

UserSchema.methods.applyEventMembershipRewards = async function applyEventMembershipRewards(
  rewards: EventMembershipProductReward,
  session?: mongoose.ClientSession,
  isAdditional = false
) {
  await this._applyEventMembershipRewards(rewards, isAdditional);
  await this.save({ session });
};

UserSchema.methods._processExpiredMembership = async function _processExpiredMembership() {
  this.point = POINTS.DEFAULT_POINT;
  this.aiPoint = POINTS.DEFAULT_AI_POINT;
  this.MembershipAt = null;
  this.lastMembershipAt = null;
  this.MembershipExpiresAt = null;
  this.currentMembershipProductId = null;
  this.event = null;
};

UserSchema.methods.processExpiredMembership = async function processExpiredMembership(options?: {
  session?: ClientSession;
}) {
  await this._processExpiredMembership();
  await this.save(options);
};

UserSchema.methods.getCurrentEventId = async function getCurrentEventId() {
  return this.event || null;
};

// User 모델에 추가
UserSchema.methods.getMembershipStatus = function getMembershipStatus() {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // 멤버십이 없는 경우
  if (!this.MembershipAt || !this.MembershipExpiresAt) {
    return {
      isActive: false,
      leftDays: 0,
      expiresAt: null,
      membershipAt: null,
      msg: '멤버십이 없습니다.',
    };
  }

  const membershipAt = new Date(this.MembershipAt);
  membershipAt.setHours(0, 0, 0, 0);

  const expiresAt = new Date(this.MembershipExpiresAt);
  expiresAt.setHours(0, 0, 0, 0);

  const timeDifference = expiresAt.getTime() - currentDate.getTime();
  const leftDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  if (leftDays > 0) {
    return {
      isActive: true,
      leftDays,
      expiresAt: this.MembershipExpiresAt,
      membershipAt: this.MembershipAt,
      msg: this.event ? '이벤트 멤버십이 활성화되어 있습니다.' : '멤버십이 활성화되어 있습니다.',
    };
  } else {
    return {
      isActive: false,
      leftDays: 0,
      expiresAt: this.MembershipExpiresAt,
      membershipAt: this.MembershipAt,
      msg: '멤버십이 만료되었습니다.',
    };
  }
};

// 간단한 활성화 여부만 확인하는 메서드
UserSchema.methods.isMembershipActive = function isMembershipActive() {
  return this.getMembershipStatus().isActive;
};

UserSchema.methods.shouldRenewMembership = function shouldRenewMembership(
  currentProduct: IProduct
) {
  const now = new Date();

  if (!currentProduct.renewalPeriodDate) {
    throw new Error('상품 갱신 주기 정보가 존재하지 않습니다.');
  }

  // 멤버십이 없으면 갱신할 필요 없음
  if (!this.MembershipAt || !this.MembershipExpiresAt) {
    return false;
  }

  // 만료되었으면 갱신할 필요 없음 (만료 처리해야 함)
  if (now >= this.MembershipExpiresAt) {
    return false;
  }

  // lastMembershipAt이 없으면 갱신 필요
  if (!this.lastMembershipAt) {
    return true;
  }

  // lastMembershipAt + renewalPeriodDate가 현재 시간보다 이전이면 갱신 필요
  const nextRenewalDate = new Date(this.lastMembershipAt);
  nextRenewalDate.setTime(
    nextRenewalDate.getTime() + currentProduct.renewalPeriodDate * 24 * 60 * 60 * 1000
  );

  return now >= nextRenewalDate;
};

// 남은 일수만 확인하는 메서드
UserSchema.methods.getMembershipLeftDays = function getMembershipLeftDays() {
  return this.getMembershipStatus().leftDays;
};

UserSchema.methods.initMonthPoint = async function initMonthPoint() {
  this.aiPoint = POINTS.DEFAULT_AI_POINT;
  await this.save();
};

UserSchema.statics.localRegister = function localRegister({ email }: LocalRegisterPayload) {
  const user = new this({
    email,
  });

  return user.save();
};

const model: UserModel =
  (mongoose.models.Users as UserModel) ||
  mongoose.model<UserDocument, UserModel>('Users', UserSchema);

export default model;
