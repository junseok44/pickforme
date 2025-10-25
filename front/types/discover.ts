export interface IProduct {
  name: string;
  price: number;
  origin_price: number; // 할인 전 가격
  discount_rate: number | null; // 할인율
  reviews: number | null; // 리뷰 수
  ratings: number | null; // 평점
  url: string; // 상품 링크 주소
  thumbnail: string; // 상품 썸네일 이미지 주소
  platform: string;
  detail_images?: string[]; // 상품 상세 이미지 주소 리스트
}

export interface ILocalProductSection {
  name: string; // 협업 상품 섹션 명
  order: number; // 섹션 배치 순서 (작을 수록 먼저 배치)
  products: IProduct[]; // 협업 상품 리스트
}

export interface IDicoverMainProducts {
  special: IProduct[];
  random: IProduct[];
  local: ILocalProductSection[];
}

export interface IProductDetail {
  product: IProduct;
}
