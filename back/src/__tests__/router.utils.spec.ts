import { validateProductData, ValidationResult } from '../router/utils';

describe('validateProductData', () => {
  const validProduct = {
    name: '테스트 상품',
    price: 10000,
    origin_price: 15000,
    discount_rate: 33,
    reviews: 100,
    ratings: 4.5,
    url: 'https://example.com/product/1',
    thumbnail: 'https://example.com/thumbnail.jpg',
    detail_images: ['https://example.com/detail1.jpg'],
    platform: 'coupang',
    caption: '테스트 캡션',
    report: '테스트 리포트',
    review: {
      pros: ['장점1', '장점2'],
      cons: ['단점1'],
      bests: ['베스트1'],
    },
  };

  describe('성공 케이스', () => {
    test('유효한 product 데이터 validation 통과', () => {
      const result: ValidationResult = validateProductData(validProduct);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
      expect(result.errorMessage).toBeUndefined();
    });

    test('0값 number 필드들 (유효해야 함)', () => {
      const validProductWithZeros = {
        ...validProduct,
        price: 0,
        origin_price: 0,
        discount_rate: 0,
        reviews: 0,
        ratings: 0,
      };

      const result: ValidationResult = validateProductData(validProductWithZeros);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
      expect(result.errorMessage).toBeUndefined();
    });

    test('음수 값 (유효해야 함 - 비즈니스 로직 validation은 별도)', () => {
      const validProductWithNegatives = {
        ...validProduct,
        price: -1000,
        discount_rate: -10,
      };

      const result: ValidationResult = validateProductData(validProductWithNegatives);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
      expect(result.errorMessage).toBeUndefined();
    });

    test('빈 string 필드 (실패해야 함)', () => {
      const invalidProductWithEmptyString = {
        ...validProduct,
        name: '',
      };

      const result: ValidationResult = validateProductData(invalidProductWithEmptyString);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
    });

    test('https URL', () => {
      const productWithHttpsUrl = {
        ...validProduct,
        url: 'https://secure.example.com/product/1',
      };

      const result: ValidationResult = validateProductData(productWithHttpsUrl);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
    });

    test('http URL', () => {
      const productWithHttpUrl = {
        ...validProduct,
        url: 'http://example.com/product/1',
      };

      const result: ValidationResult = validateProductData(productWithHttpUrl);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('실패 케이스 - Product 데이터 누락', () => {
    test('product 데이터가 undefined일 때', () => {
      const result: ValidationResult = validateProductData(undefined);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toBe('Product 데이터가 필요합니다.');
    });

    test('product 데이터가 null일 때', () => {
      const result: ValidationResult = validateProductData(null);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toBe('Product 데이터가 필요합니다.');
    });

    test('product 데이터가 빈 객체일 때', () => {
      const result: ValidationResult = validateProductData({});

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
    });
  });

  describe('실패 케이스 - Required 필드 누락', () => {
    test('name 필드 누락', () => {
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).name;

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
    });

    test('price 필드 누락', () => {
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).price;

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('price');
    });

    test('url 필드 누락', () => {
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).url;

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('url');
    });

    test('여러 필드 누락', () => {
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).name;
      delete (invalidProduct as any).price;
      delete (invalidProduct as any).url;

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
      expect(result.errorMessage).toContain('price');
      expect(result.errorMessage).toContain('url');
    });

    test('모든 required 필드 각각 테스트', () => {
      const requiredFields = [
        'name',
        'price',
        'origin_price',
        'discount_rate',
        'reviews',
        'ratings',
        'url',
        'thumbnail',
      ];

      for (const field of requiredFields) {
        const invalidProduct = { ...validProduct };
        delete (invalidProduct as any)[field];

        const result: ValidationResult = validateProductData(invalidProduct);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe(400);
        expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
        expect(result.errorMessage).toContain(field);
      }
    });

    test('필드가 null일 때', () => {
      const invalidProduct = {
        ...validProduct,
        name: null,
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
    });
  });

  describe('실패 케이스 - 잘못된 데이터 타입', () => {
    test('string 필드에 number 입력', () => {
      const invalidProduct = {
        ...validProduct,
        name: 123, // string이어야 하는데 number
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('잘못된 데이터 타입입니다');
      expect(result.errorMessage).toContain('name (string 타입이어야 합니다)');
    });

    test('string 필드에 boolean 입력', () => {
      const invalidProduct = {
        ...validProduct,
        thumbnail: true, // string이어야 하는데 boolean
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('잘못된 데이터 타입입니다');
      expect(result.errorMessage).toContain('thumbnail (string 타입이어야 합니다)');
    });

    test('number 필드에 string 입력', () => {
      const invalidProduct = {
        ...validProduct,
        price: '10000', // number이어야 하는데 string
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('잘못된 데이터 타입입니다');
      expect(result.errorMessage).toContain('price (number 타입이어야 합니다)');
    });

    test('number 필드에 boolean 입력', () => {
      const invalidProduct = {
        ...validProduct,
        ratings: false, // number이어야 하는데 boolean
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('잘못된 데이터 타입입니다');
      expect(result.errorMessage).toContain('ratings (number 타입이어야 합니다)');
    });

    test('여러 필드의 잘못된 타입', () => {
      const invalidProduct = {
        ...validProduct,
        name: 123,
        price: '10000',
        url: 456,
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('잘못된 데이터 타입입니다');
      expect(result.errorMessage).toContain('name (string 타입이어야 합니다)');
      expect(result.errorMessage).toContain('price (number 타입이어야 합니다)');
      expect(result.errorMessage).toContain('url (string 타입이어야 합니다)');
    });
  });

  describe('실패 케이스 - URL 형식 검증', () => {
    test('http로 시작하지 않는 URL - ftp', () => {
      const invalidProduct = {
        ...validProduct,
        url: 'ftp://example.com/product',
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toBe('URL은 http 또는 https로 시작해야 합니다.');
    });

    test('http로 시작하지 않는 URL - 상대 경로', () => {
      const invalidProduct = {
        ...validProduct,
        url: '/product/123',
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toBe('URL은 http 또는 https로 시작해야 합니다.');
    });

    test('빈 문자열 URL', () => {
      const invalidProduct = {
        ...validProduct,
        url: '',
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('url');
    });

    test('잘못된 프로토콜 - file', () => {
      const invalidProduct = {
        ...validProduct,
        url: 'file:///path/to/file',
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toBe('URL은 http 또는 https로 시작해야 합니다.');
    });

    test('잘못된 프로토콜 - ws', () => {
      const invalidProduct = {
        ...validProduct,
        url: 'ws://example.com/socket',
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toBe('URL은 http 또는 https로 시작해야 합니다.');
    });
  });

  describe('실패 케이스 - 복합 validation 오류', () => {
    test('필수 필드 누락과 잘못된 타입이 함께 있을 때 (필수 필드 누락 우선)', () => {
      const invalidProduct = {
        price: '10000', // 잘못된 타입
        // name 누락 (필수 필드)
        origin_price: 15000,
        discount_rate: 33,
        reviews: 100,
        ratings: 4.5,
        url: 'https://example.com/product/1',
        thumbnail: 'https://example.com/thumbnail.jpg',
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      // 필수 필드 누락이 먼저 체크되어야 함
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
      // 잘못된 타입 메시지는 포함되지 않아야 함
      expect(result.errorMessage).not.toContain('잘못된 데이터 타입');
    });

    test('잘못된 타입과 URL 형식 오류가 함께 있을 때 (잘못된 타입 우선)', () => {
      const invalidProduct = {
        ...validProduct,
        name: 123, // 잘못된 타입
        url: 'ftp://invalid.com', // 잘못된 URL 형식
      };

      const result: ValidationResult = validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      // 잘못된 타입이 먼저 체크되어야 함
      expect(result.errorMessage).toContain('잘못된 데이터 타입');
      expect(result.errorMessage).toContain('name (string 타입이어야 합니다)');
      // URL 형식 메시지는 포함되지 않아야 함
      expect(result.errorMessage).not.toContain('URL은 http');
    });
  });

  describe('경계값 테스트', () => {
    test('빈 문자열 name 필드 (실패해야 함)', () => {
      const productWithEmptyName = {
        ...validProduct,
        name: '',
      };

      const result: ValidationResult = validateProductData(productWithEmptyName);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
    });

    test('빈 문자열 thumbnail 필드 (실패해야 함)', () => {
      const productWithEmptyThumbnail = {
        ...validProduct,
        thumbnail: '',
      };

      const result: ValidationResult = validateProductData(productWithEmptyThumbnail);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('thumbnail');
    });

    test('공백만 있는 문자열 필드 (실패해야 함)', () => {
      const productWithWhitespaceOnly = {
        ...validProduct,
        name: '   ',
        thumbnail: '\t\n  ',
      };

      const result: ValidationResult = validateProductData(productWithWhitespaceOnly);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.errorMessage).toContain('필수 필드가 누락되었습니다');
      expect(result.errorMessage).toContain('name');
      expect(result.errorMessage).toContain('thumbnail');
    });

    test('매우 큰 숫자 값', () => {
      const productWithLargeNumbers = {
        ...validProduct,
        price: Number.MAX_SAFE_INTEGER,
        reviews: Number.MAX_SAFE_INTEGER,
      };

      const result: ValidationResult = validateProductData(productWithLargeNumbers);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
    });

    test('Infinity 값', () => {
      const productWithInfinity = {
        ...validProduct,
        price: Infinity,
      };

      const result: ValidationResult = validateProductData(productWithInfinity);

      // Infinity도 number 타입이므로 통과해야 함
      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
    });

    test('NaN 값', () => {
      const productWithNaN = {
        ...validProduct,
        price: NaN,
      };

      const result: ValidationResult = validateProductData(productWithNaN);

      // NaN도 number 타입이므로 통과해야 함
      expect(result.isValid).toBe(true);
      expect(result.status).toBe(200);
    });
  });
});
