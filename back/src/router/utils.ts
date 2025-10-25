/**
 * Product validation 결과 인터페이스
 */
export interface ValidationResult {
  isValid: boolean;
  status: number;
  errorMessage?: string;
}

/**
 * Product 데이터의 required 필드들을 검증하는 함수
 * - 필수 필드 존재 여부 확인 (undefined, null, 빈 문자열 검증)
 * - 데이터 타입 검증 (string, number)
 * - URL 형식 검증 (http/https)
 * @param product - 검증할 product 객체
 * @returns ValidationResult - 검증 결과
 */
export const validateProductData = (product: any): ValidationResult => {
  // Product 데이터 존재 여부 확인
  if (!product) {
    return {
      isValid: false,
      status: 400,
      errorMessage: 'Product 데이터가 필요합니다.',
    };
  }

  // Required 필드들 정의
  const requiredFields = [
    { field: 'name', type: 'string' },
    { field: 'price', type: 'number' },
    { field: 'origin_price', type: 'number' },
    { field: 'discount_rate', type: 'number' },
    { field: 'reviews', type: 'number' },
    { field: 'ratings', type: 'number' },
    { field: 'url', type: 'string' },
    { field: 'thumbnail', type: 'string' },
  ];

  const missingFields: string[] = [];
  const invalidTypeFields: string[] = [];

  // 각 필드 검증
  for (const { field, type } of requiredFields) {
    if (product[field] === undefined || product[field] === null) {
      missingFields.push(field);
    } else if (type === 'string' && typeof product[field] !== 'string') {
      invalidTypeFields.push(`${field} (string 타입이어야 합니다)`);
    } else if (
      type === 'string' &&
      typeof product[field] === 'string' &&
      product[field].trim() === ''
    ) {
      missingFields.push(field);
    } else if (type === 'number' && typeof product[field] !== 'number') {
      invalidTypeFields.push(`${field} (number 타입이어야 합니다)`);
    }
  }

  // 필수 필드 누락 검사 (우선순위가 높음)
  if (missingFields.length > 0) {
    return {
      isValid: false,
      status: 400,
      errorMessage: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
    };
  }

  // 데이터 타입 검사
  if (invalidTypeFields.length > 0) {
    return {
      isValid: false,
      status: 400,
      errorMessage: `잘못된 데이터 타입입니다: ${invalidTypeFields.join(', ')}`,
    };
  }

  // URL 형식 검증
  if (!product.url.startsWith('http')) {
    return {
      isValid: false,
      status: 400,
      errorMessage: 'URL은 http 또는 https로 시작해야 합니다.',
    };
  }

  // 모든 검증 통과
  return {
    isValid: true,
    status: 200,
  };
};
