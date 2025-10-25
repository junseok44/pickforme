import Router from '@koa/router';
import coupangCrawlerService from './crawler.service';
import { log } from 'utils/logger';
import { extractAndValidateCoupangUrl } from './utils';
import { searchProducts, getDeeplinks } from './api.service';

const router = new Router({
  prefix: '/coupang',
});

// 쿠팡 상품 크롤링
router.post('/crawl', async (ctx) => {
  try {
    const { url: inputText } = ctx.request.body as { url: string };

    if (!inputText) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'URL이 필요합니다.',
      };
      return;
    }

    // URL 추출 및 검증
    const validation = extractAndValidateCoupangUrl(inputText);

    if (!validation.success) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: validation.message,
        inputText, // 디버깅용으로 원본 텍스트 반환
        extractedUrl: validation.url,
      };
      return;
    }

    const result = await coupangCrawlerService.crawl(validation.url!);

    ctx.body = {
      success: true,
      data: result,
      extractedUrl: validation.url,
      productId: validation.productId,
    };

    // 로그 기록
    void log.info('쿠팡 크롤링 성공', 'COUPANG', 'LOW', {
      originalInput: inputText,
      extractedUrl: validation.url,
      productId: validation.productId,
      productName: result.name,
      price: result.price,
    });
  } catch (error) {
    console.error('❌ 쿠팡 크롤링 실패:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      message: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.',
    };

    // 에러 로그 기록
    void log.error(
      error instanceof Error ? error.message : '쿠팡 크롤링 실패',
      'COUPANG',
      'MEDIUM',
      {
        originalInput: (ctx.request.body as any)?.url,
        error: error instanceof Error ? error.stack : error,
      }
    );
  }
});

// 쿠팡 상품 검색
router.post('/search', async (ctx) => {
  try {
    const { searchText } = ctx.request.body as { searchText: string };
    if (!searchText) {
      ctx.status = 400;
      ctx.body = { success: false, message: '검색어가 필요합니다.' };
      return;
    }
    const result = await coupangCrawlerService.search(searchText);
    ctx.body = { success: true, data: result };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: error instanceof Error ? error.message : '검색 중 오류 발생',
    };
  }
});

router.post('/deeplink', async (ctx) => {
  const startTime = Date.now();
  const requestId = `deeplink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { urls } = ctx.request.body as { urls: string[] };

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'URLs가 필요합니다.' };
    return;
  }

  if (urls.length !== 1) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'URLs는 하나만 전달해야 합니다.' };
    return;
  }

  let transformSuccess = false;
  let deeplinkSuccess = false;
  let errorMsg: string | undefined;
  let deeplinkErrorMsg: string | undefined;
  let normalizedUrlInfo: any = null;
  let deeplinkResult: any = null;

  try {
    // URL 정규화
    const { CoupangUrlNormalizerService } = await import('./url-normalizer.service');
    normalizedUrlInfo = CoupangUrlNormalizerService.normalizeUrl(urls[0]);
    transformSuccess = true;

    // 정규화된 URL로 딥링크 생성
    deeplinkResult = await getDeeplinks([normalizedUrlInfo.normalizedUrl]);

    if (
      !deeplinkResult ||
      deeplinkResult.length === 0 ||
      !deeplinkResult[0].originalUrl ||
      !deeplinkResult[0].shortenUrl
    ) {
      deeplinkErrorMsg = '딥링크 생성 실패: 결과가 없거나 필수 필드 누락';
    } else {
      deeplinkSuccess = true;
    }
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('URL 변환 중 오류:', error);
  }

  const durationMs = Date.now() - startTime;

  // 로그 저장
  try {
    const { default: UrlTransformLog } = await import('./models');

    const logData = {
      requestId,
      originalInputUrl: urls[0],
      normalizedUrl: normalizedUrlInfo?.normalizedUrl || urls[0],
      productId: normalizedUrlInfo?.productId || '',
      urlType: normalizedUrlInfo?.urlType || 'unknown',
      transformSuccess,
      errorMsg,
      deeplinkSuccess,
      deeplinkErrorMsg,
      originalUrl: deeplinkResult?.[0]?.originalUrl,
      shortenUrl: deeplinkResult?.[0]?.shortenUrl,
      landingUrl: deeplinkResult?.[0]?.landingUrl,
      durationMs,
    };

    const savedLog = await UrlTransformLog.create(logData);
    console.log('📊 URL 변환 로그 저장 완료:', {
      id: savedLog._id,
      requestId: logData.requestId,
      originalInputUrl: logData.originalInputUrl,
      transformSuccess: logData.transformSuccess,
      deeplinkSuccess: logData.deeplinkSuccess,
    });
  } catch (logError) {
    console.error('로그 저장 실패:', logError);
  }

  // 응답 처리
  if (!transformSuccess || !deeplinkSuccess) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: errorMsg || deeplinkErrorMsg || 'URL 변환 중 오류가 발생했습니다.',
    };
    return;
  }

  // 원본 URL 정보와 정규화 정보를 함께 반환
  ctx.body = {
    success: true,
    data: {
      ...deeplinkResult[0],
      originalInputUrl: normalizedUrlInfo.originalUrl,
      normalizedUrl: normalizedUrlInfo.normalizedUrl,
      productId: normalizedUrlInfo.productId,
      urlType: normalizedUrlInfo.urlType,
    },
  };
});

router.post('/api/search', async (ctx) => {
  try {
    const { keyword } = ctx.request.body as { keyword: string };

    // 파트너스 api 최대 허용 검색 개수는 10개입니다.
    const searchLimit = 10;

    if (!keyword) {
      ctx.status = 400;
      ctx.body = { success: false, message: '검색어(keyword)가 필요합니다.' };
      return;
    }

    // 이전에 만든 API 검색 서비스 함수 호출
    const result = await searchProducts(keyword, searchLimit);

    ctx.body = { success: true, data: result };

    void log.info('쿠팡 API 검색 성공', 'COUPANG', 'LOW', {
      keyword,
      resultCount: result.length,
    });
  } catch (error) {
    console.error('❌ 쿠팡 API 검색 실패:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: error instanceof Error ? error.message : 'API 검색 중 오류가 발생했습니다.',
    };
    void log.error('쿠팡 API 검색 실패', 'COUPANG', 'MEDIUM', {
      keyword: (ctx.request.body as any)?.keyword,
      error: error instanceof Error ? error.stack : error,
    });
  }
});

// 크롤러 상태 확인
router.get('/status', async (ctx) => {
  try {
    const status = coupangCrawlerService.getStatus();

    ctx.body = {
      success: true,
      data: status,
    };
  } catch (error) {
    console.error('❌ 크롤러 상태 확인 실패:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '크롤러 상태 확인 중 오류가 발생했습니다.',
    };
  }
});

// 크롤러 초기화
router.post('/initialize', async (ctx) => {
  try {
    await coupangCrawlerService.initialize();

    ctx.body = {
      success: true,
      message: '크롤러가 초기화되었습니다.',
    };
  } catch (error) {
    console.error('❌ 크롤러 초기화 실패:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '크롤러 초기화 중 오류가 발생했습니다.',
    };
  }
});

// 크롤러 정리
router.post('/cleanup', async (ctx) => {
  try {
    await coupangCrawlerService.cleanup();

    ctx.body = {
      success: true,
      message: '크롤러가 정리되었습니다.',
    };
  } catch (error) {
    console.error('❌ 크롤러 정리 실패:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '크롤러 정리 중 오류가 발생했습니다.',
    };
  }
});

export default router;
