// back/src/scripts/migration/product-migration.ts
import 'env';
import mongoose from 'mongoose';
import db from 'models';

interface ProductMigrationResult {
  productId: string;
  displayName: string;
  currentPeriodDate: number | null;
  currentRenewalPeriodDate: number | null;
  newPeriodDate: number;
  newRenewalPeriodDate: number;
  changes: string[];
}

class ProductMigrationService {
  private dryRun: boolean;

  private results: ProductMigrationResult[] = [];

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
  }

  async migrate() {
    console.log(`🚀 상품 마이그레이션 시작 (${this.dryRun ? 'DRY RUN' : '실제 실행'})`);

    try {
      // 1. 일반 멤버십 상품 마이그레이션
      await this.migrateRegularProducts();

      // 2. 이벤트 상품 마이그레이션
      await this.migrateEventProducts();

      // 3. 결과 출력
      this.printResults();
    } catch (error) {
      console.error('❌ 마이그레이션 중 오류 발생:', error);
      throw error;
    }
  }

  private async migrateRegularProducts() {
    console.log('\n📋 일반 멤버십 상품 마이그레이션 시작...');

    // 일반 멤버십 상품들 (pickforme_plus, pickforme_member)
    const regularProductIds = ['pickforme__plus', 'pickforme_member'];

    for (const productId of regularProductIds) {
      const products = await db.Product.find({ productId });
      console.log(`  - ${productId}: ${products.length}개 상품 발견`);

      for (const product of products) {
        const changes: string[] = [];
        const newPeriodDate = 30;
        const newRenewalPeriodDate = 30;

        // periodDate 설정
        if (product.periodDate !== newPeriodDate) {
          changes.push(`periodDate: ${product.periodDate || 'null'} → ${newPeriodDate}`);
        }

        // renewalPeriodDate 설정
        if (product.renewalPeriodDate !== newRenewalPeriodDate) {
          changes.push(
            `renewalPeriodDate: ${product.renewalPeriodDate || 'null'} → ${newRenewalPeriodDate}`
          );
        }

        if (changes.length > 0) {
          this.results.push({
            productId: product.productId,
            displayName: product.displayName,
            currentPeriodDate: product.periodDate || null,
            currentRenewalPeriodDate: product.renewalPeriodDate || null,
            newPeriodDate,
            newRenewalPeriodDate,
            changes,
          });

          if (!this.dryRun) {
            product.periodDate = newPeriodDate;
            product.renewalPeriodDate = newRenewalPeriodDate;
            await product.save();
          }
        }
      }
    }
  }

  private async migrateEventProducts() {
    console.log('\n📋 이벤트 상품 마이그레이션 시작...');

    // 한시련 이벤트 상품
    await this.migrateHansiryunProducts();

    // 픽포미 체험단 이벤트 상품
    await this.migratePickformeTestProducts();
  }

  private async migrateHansiryunProducts() {
    console.log('  - 한시련 이벤트 상품 처리...');

    const products = await db.Product.find({
      productId: 'pickforme_hansiryun_event_membership',
    });

    console.log(`  한시련 이벤트 상품: ${products.length}개 발견`);

    for (const product of products) {
      const changes: string[] = [];
      const newPeriodDate = 180; // 6개월 (30일 * 6)
      const newRenewalPeriodDate = 30;

      // periodDate 설정 (6개월)
      if (product.periodDate !== newPeriodDate) {
        changes.push(`periodDate: ${product.periodDate || 'null'} → ${newPeriodDate} (6개월)`);
      }

      // renewalPeriodDate 설정 (30일)
      if (product.renewalPeriodDate !== newRenewalPeriodDate) {
        changes.push(
          `renewalPeriodDate: ${product.renewalPeriodDate || 'null'} → ${newRenewalPeriodDate}`
        );
      }

      if (changes.length > 0) {
        this.results.push({
          productId: product.productId,
          displayName: product.displayName,
          currentPeriodDate: product.periodDate || null,
          currentRenewalPeriodDate: product.renewalPeriodDate || null,
          newPeriodDate,
          newRenewalPeriodDate,
          changes,
        });

        if (!this.dryRun) {
          product.periodDate = newPeriodDate;
          product.renewalPeriodDate = newRenewalPeriodDate;
          await product.save();
        }
      }
    }
  }

  private async migratePickformeTestProducts() {
    console.log('  - 픽포미 체험단 이벤트 상품 처리...');

    const products = await db.Product.find({
      productId: 'pickforme_test_group_event_membership',
    });

    console.log(`  픽포미 체험단 이벤트 상품: ${products.length}개 발견`);

    for (const product of products) {
      const changes: string[] = [];
      const newPeriodDate = 90; // 3개월 (30일 * 3)
      const newRenewalPeriodDate = 30;

      // periodDate 설정 (3개월)
      if (product.periodDate !== newPeriodDate) {
        changes.push(`periodDate: ${product.periodDate || 'null'} → ${newPeriodDate} (3개월)`);
      }

      // renewalPeriodDate 설정 (30일)
      if (product.renewalPeriodDate !== newRenewalPeriodDate) {
        changes.push(
          `renewalPeriodDate: ${product.renewalPeriodDate || 'null'} → ${newRenewalPeriodDate}`
        );
      }

      if (changes.length > 0) {
        this.results.push({
          productId: product.productId,
          displayName: product.displayName,
          currentPeriodDate: product.periodDate || null,
          currentRenewalPeriodDate: product.renewalPeriodDate || null,
          newPeriodDate,
          newRenewalPeriodDate,
          changes,
        });

        if (!this.dryRun) {
          product.periodDate = newPeriodDate;
          product.renewalPeriodDate = newRenewalPeriodDate;
          await product.save();
        }
      }
    }
  }

  private printResults() {
    console.log('\n📊 상품 마이그레이션 결과 요약');
    console.log('='.repeat(80));

    const productTypeCounts = this.results.reduce(
      (acc, result) => {
        const type = this.getProductType(result.productId);
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('📈 상품 타입별 대상자 수:');
    Object.entries(productTypeCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}개`);
    });

    console.log(`\n📋 총 대상 상품: ${this.results.length}개`);

    if (this.results.length > 0) {
      console.log('\n📝 상세 변경 내역:');
      this.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.displayName} (${result.productId})`);
        result.changes.forEach((change) => {
          console.log(`   - ${change}`);
        });
      });
    }

    if (this.dryRun) {
      console.log('\n⚠️  DRY RUN 모드입니다. 실제 변경사항은 적용되지 않았습니다.');
      console.log('실제 실행하려면 dryRun: false로 설정하세요.');
    } else {
      console.log('\n✅ 상품 마이그레이션이 완료되었습니다.');
    }
  }

  private getProductType(productId: string): string {
    if (productId === 'pickforme_plus' || productId === 'pickforme_member') {
      return '일반 멤버십';
    } else if (productId === 'pickforme_hansiryun_event_membership') {
      return '한시련 이벤트';
    } else if (productId === 'pickforme_test_group_event_membership') {
      return '픽포미 체험단 이벤트';
    }
    return '기타';
  }
}

// 스크립트 실행
async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dry');
  const actualRun = process.argv.includes('--run');

  if (!dryRun && !actualRun) {
    console.log('사용법:');
    console.log('  npm run migration:product -- --dry-run  (시뮬레이션)');
    console.log('  npm run migration:product -- --run     (실제 실행)');
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

    const migrationService = new ProductMigrationService(dryRun);
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

export default ProductMigrationService;
