import { ProductType } from 'models/product';

function productConverter(value: ProductType): number {
  switch (value) {
    case ProductType.PURCHASE:
      return 0;
    case ProductType.SUBSCRIPTION:
      return 1;
    default:
      return 0;
  }
}

export { productConverter };
