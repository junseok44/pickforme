import db from 'models';

interface CreateTestUserOptions {
  email: string;
  point?: number;
  aiPoint?: number;
  MembershipAt?: Date | null;
  lastMembershipAt?: Date | null;
  MembershipExpiresAt?: Date | null;
  currentMembershipProductId?: string | null;
  event?: number | null;
}

export async function createTestUser(options: CreateTestUserOptions) {
  const {
    email,
    point = 100,
    aiPoint = 1000,
    MembershipAt = null,
    lastMembershipAt = null,
    MembershipExpiresAt = null,
    currentMembershipProductId = null,
    event = null,
  } = options;

  return db.User.create({
    email,
    point,
    aiPoint,
    MembershipAt,
    lastMembershipAt,
    MembershipExpiresAt,
    currentMembershipProductId,
    event,
  });
}

interface CreateTestProductOptions {
  productId: string;
  type: number;
  displayName: string;
  point?: number;
  aiPoint?: number;
  platform?: string;
  periodDate?: number;
  renewalPeriodDate?: number;
  eventId?: number | null;
}

export async function createTestProduct(options: CreateTestProductOptions) {
  const {
    productId,
    type,
    displayName,
    point = 30,
    aiPoint = 100,
    platform = 'ios',
    periodDate = 30,
    renewalPeriodDate = 30,
    eventId = null,
  } = options;

  return db.Product.create({
    productId,
    type,
    displayName,
    point,
    aiPoint,
    platform,
    periodDate,
    renewalPeriodDate,
    eventId,
  });
}

interface CreateTestPurchaseOptions {
  userId: string;
  productId: string;
  product: any;
  createdAt: Date;
  isExpired?: boolean;
}

export async function createTestPurchase(options: CreateTestPurchaseOptions) {
  const { userId, productId, product, createdAt, isExpired = false } = options;

  return db.Purchase.create({
    userId,
    productId,
    product,
    createdAt,
    isExpired,
  });
}
