import Router from '@koa/router';
import db from 'models';
import { productConverter } from 'utils/enumConverter';
import { ProductType } from 'models/product';

const router = new Router({
  prefix: '/product',
});

router.get('/detail/:productId', async (ctx) => {
  const { productsId } = ctx.params;
  const product = await db.Product.findById(productsId);
  ctx.body = product;
});

router.get('/', async (ctx) => {
  const products = await db.Product.find({}).sort({
    createdAt: -1,
  });
  ctx.body = products;
});

// 상품목록
router.get('/:platform', async (ctx) => {
  // NOTE: 상품 노출 시 활성화

  // const {
  //   platform,
  // } = ctx.params;
  // const products = await db.Product.find({
  //   platform,
  //   type: productConverter(ProductType.SUBSCRIPTION),
  // });
  // ctx.body = products;

  ctx.body = [];
  ctx.status = 200;
});

export default router;
