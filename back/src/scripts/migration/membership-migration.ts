// back/src/scripts/migration/membership-migration.ts
import 'env';
import mongoose from 'mongoose';
import db from 'models';
import { ProductType } from 'models/product';
import { EVENT_IDS } from '../../constants/events';

interface MigrationResult {
  userId: string;
  email: string;
  type: 'regular' | 'hansiryun' | 'pickforme_test';
  currentMembershipAt: Date | null;
  currentMembershipExpiresAt: Date | null;
  currentMembershipProductId: string | null;
  newMembershipExpiresAt: Date | null;
  newMembershipProductId: string | null;
  changes: string[];
}

class MembershipMigrationService {
  private dryRun: boolean;

  private results: MigrationResult[] = [];

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
  }

  async migrate() {
    console.log(`🚀 멤버십 마이그레이션 시작 (${this.dryRun ? 'DRY RUN' : '실제 실행'})`);

    try {
      // 1. 일반 멤버십 마이그레이션
      await this.migrateRegularMemberships();

      // 2. 이벤트 멤버십 마이그레이션
      await this.migrateEventMemberships();

      // 3. 결과 출력
      this.printResults();
    } catch (error) {
      console.error('❌ 마이그레이션 중 오류 발생:', error);
      throw error;
    }
  }

  private async migrateRegularMemberships() {
    console.log('\n📋 일반 멤버십 마이그레이션 시작...');

    // Purchase에서 isExpired: false인 구독 조회
    const activePurchases = await db.Purchase.find({
      isExpired: false,
      'product.type': ProductType.SUBSCRIPTION,
      'product.eventId': null, // 이벤트 상품 제외
    }).populate('product');

    console.log(`일반 멤버십 대상: ${activePurchases.length}명`);

    // 유저별로 그룹화하여 중복 처리 방지
    const userPurchasesMap = new Map<string, any[]>();

    for (const purchase of activePurchases) {
      const userId = purchase.userId.toString();
      if (!userPurchasesMap.has(userId)) {
        userPurchasesMap.set(userId, []);
      }
      userPurchasesMap.get(userId)!.push(purchase);
    }

    for (const [userId, purchases] of userPurchasesMap) {
      const user = await db.User.findById(userId);
      if (!user) continue;

      // 한 유저에 여러 개의 활성 구독이 있는 경우 에러 처리
      if (purchases.length > 1) {
        console.error(
          `❌ 에러: 유저 ${user.email}에게 ${purchases.length}개의 활성 구독이 있습니다.`
        );
        this.results.push({
          userId: user._id.toString(),
          email: user.email,
          type: 'regular',
          currentMembershipAt: user.MembershipAt,
          currentMembershipExpiresAt: user.MembershipExpiresAt,
          currentMembershipProductId: user.currentMembershipProductId || null,
          newMembershipExpiresAt: null,
          newMembershipProductId: null,
          changes: [`에러: ${purchases.length}개의 활성 구독 발견 - 처리 건너뜀`],
        });
        continue;
      }

      const purchase = purchases[0];
      const changes: string[] = [];

      // MembershipExpiresAt 설정 (createdAt + 1개월)
      const newExpiresAt = new Date(purchase.createdAt);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

      if (
        !user.MembershipExpiresAt ||
        user.MembershipExpiresAt.getTime() !== newExpiresAt.getTime()
      ) {
        changes.push(
          `MembershipExpiresAt: ${user.MembershipExpiresAt?.toISOString() || 'null'} → ${newExpiresAt.toISOString()}`
        );
      }

      // currentMembershipProductId 설정
      const productId = (purchase.product as any).productId;
      if (productId && user.currentMembershipProductId !== productId) {
        changes.push(
          `currentMembershipProductId: ${user.currentMembershipProductId || 'null'} → ${productId}`
        );
      }

      if (changes.length > 0) {
        this.results.push({
          userId: user._id.toString(),
          email: user.email,
          type: 'regular',
          currentMembershipAt: user.MembershipAt,
          currentMembershipExpiresAt: user.MembershipExpiresAt,
          currentMembershipProductId: user.currentMembershipProductId || null,
          newMembershipExpiresAt: newExpiresAt,
          newMembershipProductId: productId,
          changes,
        });

        if (!this.dryRun) {
          user.MembershipExpiresAt = newExpiresAt;
          if (productId) {
            user.currentMembershipProductId = productId;
          }
          await user.save();
        }
      }
    }
  }

  private async migrateEventMemberships() {
    console.log('\n📋 이벤트 멤버십 마이그레이션 시작...');

    // 한시련 이벤트 멤버십
    await this.migrateHansiryunMemberships();

    // 픽포미 체험단 이벤트 멤버십
    await this.migratePickformeTestMemberships();
  }

  private async migrateHansiryunMemberships() {
    console.log('  - 한시련 이벤트 멤버십 처리...');

    const users = await db.User.find({
      event: EVENT_IDS.HANSIRYUN,
      MembershipAt: { $ne: null },
    });

    console.log(`  한시련 이벤트 대상: ${users.length}명`);

    for (const user of users) {
      const changes: string[] = [];

      // 만료일 계산
      let newExpiresAt: Date;
      const membershipStartDate = new Date(user.MembershipAt!);

      // 2025년 9월 이후 신청자는 1개월, 그 외는 6개월
      const isSeptember2025OrLater =
        membershipStartDate.getFullYear() === 2025 && membershipStartDate.getMonth() >= 8; // 8 = 9월 (0부터 시작)

      if (isSeptember2025OrLater) {
        newExpiresAt = new Date(membershipStartDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
      } else {
        newExpiresAt = new Date(membershipStartDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 6);
      }

      if (
        !user.MembershipExpiresAt ||
        user.MembershipExpiresAt.getTime() !== newExpiresAt.getTime()
      ) {
        changes.push(
          `MembershipExpiresAt: ${user.MembershipExpiresAt?.toISOString() || 'null'} → ${newExpiresAt.toISOString()}`
        );
      }

      // currentMembershipProductId 설정 (한시련 이벤트 상품)
      const eventProduct = await db.Product.findOne({
        eventId: EVENT_IDS.HANSIRYUN,
        type: ProductType.SUBSCRIPTION,
      });

      const eventProductId = eventProduct?.productId;
      if (eventProductId && user.currentMembershipProductId !== eventProductId) {
        changes.push(
          `currentMembershipProductId: ${user.currentMembershipProductId || 'null'} → ${eventProductId}`
        );
      }

      if (changes.length > 0) {
        this.results.push({
          userId: user._id.toString(),
          email: user.email,
          type: 'hansiryun',
          currentMembershipAt: user.MembershipAt,
          currentMembershipExpiresAt: user.MembershipExpiresAt,
          currentMembershipProductId: user.currentMembershipProductId || null,
          newMembershipExpiresAt: newExpiresAt,
          newMembershipProductId: eventProductId || null,
          changes,
        });

        if (!this.dryRun) {
          user.MembershipExpiresAt = newExpiresAt;
          if (eventProductId) {
            user.currentMembershipProductId = eventProductId;
          }
          await user.save();
        }
      }
    }
  }

  private async migratePickformeTestMemberships() {
    console.log('  - 픽포미 체험단 이벤트 멤버십 처리...');

    const users = await db.User.find({
      event: EVENT_IDS.PICKFORME_TEST,
      MembershipAt: { $ne: null },
    });

    console.log(`  픽포미 체험단 이벤트 대상: ${users.length}명`);

    for (const user of users) {
      const changes: string[] = [];

      // 만료일 계산 (3개월)
      const newExpiresAt = new Date(user.MembershipAt!);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 3);

      if (
        !user.MembershipExpiresAt ||
        user.MembershipExpiresAt.getTime() !== newExpiresAt.getTime()
      ) {
        changes.push(
          `MembershipExpiresAt: ${user.MembershipExpiresAt?.toISOString() || 'null'} → ${newExpiresAt.toISOString()}`
        );
      }

      // currentMembershipProductId 설정 (픽포미 체험단 이벤트 상품)
      const eventProduct = await db.Product.findOne({
        eventId: EVENT_IDS.PICKFORME_TEST,
        type: ProductType.SUBSCRIPTION,
      });

      const eventProductId = eventProduct?.productId;
      if (eventProductId && user.currentMembershipProductId !== eventProductId) {
        changes.push(
          `currentMembershipProductId: ${user.currentMembershipProductId || 'null'} → ${eventProductId}`
        );
      }

      if (changes.length > 0) {
        this.results.push({
          userId: user._id.toString(),
          email: user.email,
          type: 'pickforme_test',
          currentMembershipAt: user.MembershipAt,
          currentMembershipExpiresAt: user.MembershipExpiresAt,
          currentMembershipProductId: user.currentMembershipProductId || null,
          newMembershipExpiresAt: newExpiresAt,
          newMembershipProductId: eventProductId || null,
          changes,
        });

        if (!this.dryRun) {
          user.MembershipExpiresAt = newExpiresAt;
          if (eventProductId) {
            user.currentMembershipProductId = eventProductId;
          }
          await user.save();
        }
      }
    }
  }

  private printResults() {
    console.log('\n📊 마이그레이션 결과 요약');
    console.log('='.repeat(80));

    const typeCounts = this.results.reduce(
      (acc, result) => {
        acc[result.type] = (acc[result.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('📈 타입별 대상자 수:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}명`);
    });

    console.log(`\n📋 총 대상자: ${this.results.length}명`);

    if (this.results.length > 0) {
      console.log('\n📝 상세 변경 내역:');
      this.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.email} (${result.type})`);
        result.changes.forEach((change) => {
          console.log(`   - ${change}`);
        });
      });
    }

    if (this.dryRun) {
      console.log('\n⚠️  DRY RUN 모드입니다. 실제 변경사항은 적용되지 않았습니다.');
      console.log('실제 실행하려면 dryRun: false로 설정하세요.');
    } else {
      console.log('\n✅ 마이그레이션이 완료되었습니다.');
    }
  }
}

// 스크립트 실행
async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dry');
  const actualRun = process.argv.includes('--run');

  if (!dryRun && !actualRun) {
    console.log('사용법:');
    console.log('  npm run migration:membership -- --dry-run  (시뮬레이션)');
    console.log('  npm run migration:membership -- --run     (실제 실행)');
    process.exit(1);
  }

  try {
    // MongoDB 연결
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI environment variable is required');
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB 연결 성공');

    const migrationService = new MembershipMigrationService(dryRun);
    await migrationService.migrate();
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 종료');
  }
}

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  void main();
}

export default MembershipMigrationService;
