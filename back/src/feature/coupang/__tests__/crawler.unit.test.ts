import coupangCrawlerService from '../crawler.service';

describe('Coupang Crawler Service', () => {
  it('should initialize and cleanup properly', async () => {
    await coupangCrawlerService.initialize();
    const status = coupangCrawlerService.getStatus();
    expect(status.isInitialized).toBe(true);
    await coupangCrawlerService.cleanup();
  });
});

async function testParallelProcessing() {
  console.log('🚀 병렬 처리 테스트 시작...');

  try {
    // 크롤러 초기화
    await coupangCrawlerService.initialize();
    console.log('✅ 크롤러 초기화 완료');

    const startTime = Date.now();

    // 테스트할 URL 배열
    const testUrls = [
      'https://invalid-url-that-does-not-exist.com',
      'https://link.coupang.com/a/cxAfeD',
      'https://link.coupang.com/a/cDC9IM',
      'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239',
      'https://m.coupang.com/vm/products/7225189423?',
      'https://link.coupang.com/re/AFFSDP?lptag=AF1661964&subid=pickforme&pageKey=5205138931&itemId=18044793093&vendorItemId=85199041808&traceid=V0-113-7601ef489708a8eb',
      'https://www.coupang.com/vp/products/8597104219?itemId=24927818789&vendorItemId=92219765728&sourceType=sdp_carousel_3_ads&clickEventId=c99a3390-5c84-11f0-ae7e-096b39f82f0e&templateId=5177',
      'https://www.coupang.com/vp/products/6671243928?itemId=19026712612&vendorItemId=3073291162&sourceType=gm_crm_goldbox&subSourceType=cmgoms_gm_crm_gwsrtcut&omsPageId=121237&omsPageUrl=121237',
      'https://www.coupang.com/vp/products/5071892418?itemId=18296977677&vendorItemId=74157319832&sourceType=gm_crm_goldbox&subSourceType=cmgoms_gm_crm_gwsrtcut&omsPageId=121237&omsPageUrl=121237',
      'https://www.coupang.com/vp/products/5071892418?itemId=18296977677&vendorItemId=74157319832&sourceType=gm_crm_goldbox&subSourceType=cmgoms_gm_crm_gwsrtcut&omsPageId=121237&omsPageUrl=121237',
      'https://www.coupang.com/vp/products/7599769341?vendorItemId=88277400971&sourceType=sdp_bottom_promotion&searchId=feed-48445764eaa242efb7971ca6b56a5668-gw_promotion',
      'https://www.coupang.com/vp/products/8313424981?itemId=23990305722&searchId=feed-eef7c520b04643cf9ef6eae386aca0f5-view_together_ads-P7599769341&vendorItemId=91011302435&sourceType=SDP_ADS&clickEventId=e756f6c0-5c84-11f0-a68b-9d778fa00cd3',
      'https://www.coupang.com/vp/products/8349392977?vendorItemId=91139103559&sourceType=HOME_RELATED_ADS&searchId=feed-312dfc4f92974eed9954d049e1d2f611-related_ads&clickEventId=f3f39230-5c84-11f0-8151-42f0b1dbbafc',
      'https://www.coupang.com/vp/products/8689258726?itemId=25227855502&searchId=feed-fca98b061663453ab4cd5b7dc46b12e6-view_together_ads-P8349392977&vendorItemId=91922526198&sourceType=SDP_ADS&clickEventId=f6029c10-5c84-11f0-abb6-41fe3428bd40',
      'https://www.coupang.com/vp/products/8756786700?itemId=25459158235&vendorItemId=92451806560&q=%EC%9A%94%EB%84%A4%EC%A6%88%20%EC%BC%84%EC%8B%9C&searchId=3a03c975541539&sourceType=search&itemsCount=36&searchRank=7&rank=7',
      'https://www.coupang.com/vp/products/7605326917?itemId=20128870013&vendorItemId=88897431689&q=%EC%9A%94%EB%84%A4%EC%A6%88%20%EC%BC%84%EC%8B%9C&searchId=3a03c975541539&sourceType=search&itemsCount=36&searchRank=0&rank=0',
    ];

    console.log(`📋 테스트 URL ${testUrls.length}개:`);
    testUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    // 7개 요청 동시 시작 (5개 초과)
    const promises = Array(testUrls.length)
      .fill(null)
      .map((_, index) => {
        const url = testUrls[index % testUrls.length]; // URL 순환 사용
        return coupangCrawlerService
          .crawl(url)
          .then((result) => {
            const completionTime = Date.now() - startTime;
            console.log(`\n📦 요청 ${index + 1} 완료: ${completionTime}ms`);
            console.log(`   URL: ${url}`);
            console.log(`   상품명: ${result.name}`);
            console.log(`   브랜드: ${result.brand}`);
            console.log(`   가격: ${result.price.toLocaleString()}원`);
            console.log(`   원가: ${result.origin_price.toLocaleString()}원`);
            console.log(
              `   할인율: ${result.discount_rate ? result.discount_rate + '%' : '할인없음'}`
            );
            console.log(`   평점: ${result.ratings}/5`);
            console.log(`   리뷰수: ${result.reviews_count}개`);
            console.log(`   썸네일: ${result.thumbnail}`);
            console.log(`   상세이미지: ${result.detail_images.length}개`);
            console.log(`   리뷰: ${result.reviews.length}개`);
            return { result, completionTime, index, url };
          })
          .catch((error) => {
            const completionTime = Date.now() - startTime;
            console.error(
              `\n❌ 요청 ${index + 1} 실패 (${completionTime}ms):`,
              (error as Error).message
            );
            console.error(`   URL: ${url}`);
            return { error, completionTime, index, url };
          });
      });

    console.log('\n⏳ 모든 요청 처리 대기 중...');
    const results = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`\n📊 테스트 결과:`);
    console.log(`총 처리 시간: ${endTime - startTime}ms`);

    // 완료 순서 분석
    const successfulResults = results.filter((r) => !('error' in r));
    const failedResults = results.filter((r) => 'error' in r);

    console.log(`성공: ${successfulResults.length}개, 실패: ${failedResults.length}개`);

    if (successfulResults.length > 0) {
      const completionOrder = successfulResults
        .sort((a, b) => a.completionTime - b.completionTime)
        .map((r) => r.index + 1);

      console.log('\n🏁 완료 순서:', completionOrder);

      // 병렬 처리 확인
      const firstBatch = completionOrder.slice(0, 5);
      const secondBatch = completionOrder.slice(5);

      console.log('첫 번째 배치 (병렬 처리):', firstBatch);
      console.log('두 번째 배치 (큐 처리):', secondBatch);

      // 병렬 처리 효율성 확인
      const avgTime =
        successfulResults.reduce((sum, r) => sum + r.completionTime, 0) / successfulResults.length;
      console.log(`평균 처리 시간: ${avgTime.toFixed(0)}ms`);

      if (secondBatch.length > 0) {
        const firstBatchAvg =
          firstBatch.length > 0
            ? successfulResults
                .filter((r) => firstBatch.includes(r.index + 1))
                .reduce((sum, r) => sum + r.completionTime, 0) / firstBatch.length
            : 0;
        const secondBatchAvg =
          successfulResults
            .filter((r) => secondBatch.includes(r.index + 1))
            .reduce((sum, r) => sum + r.completionTime, 0) / secondBatch.length;

        console.log(`첫 번째 배치 평균: ${firstBatchAvg.toFixed(0)}ms`);
        console.log(`두 번째 배치 평균: ${secondBatchAvg.toFixed(0)}ms`);
      }

      // 성공한 요청들의 상세 정보 요약
      console.log('\n📋 성공한 요청 상세 정보:');
      successfulResults.forEach((result, index) => {
        console.log(`\n${index + 1}. 요청 ${result.index + 1} (${result.completionTime}ms)`);
        console.log(`   상품: ${(result as any).result.name}`);
        console.log(`   가격: ${(result as any).result.price.toLocaleString()}원`);
        console.log(`   평점: ${(result as any).result.ratings}/5`);
      });
    }

    if (failedResults.length > 0) {
      console.log('\n❌ 실패한 요청들:');
      failedResults.forEach((result, index) => {
        console.log(`${index + 1}. 요청 ${result.index + 1}: ${(result.error as Error).message}`);
      });
    }

    // 상태 확인
    const status = coupangCrawlerService.getStatus();
    console.log('\n📈 최종 상태:', status);
  } catch (error) {
    console.error('❌ 테스트 실패:', (error as Error).message);
  } finally {
    // 정리
    await coupangCrawlerService.cleanup();
    console.log('🧹 크롤러 정리 완료');
  }
}

// 테스트 실행
if (require.main === module) {
  void testParallelProcessing();
}

export { testParallelProcessing };
