import { Context, Next } from 'koa';
import { AnyZodObject } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (ctx: Context, next: Next) => {
    const validationResult = schema.safeParse(ctx.request.body);

    if (!validationResult.success) {
      ctx.status = 400;
      ctx.body = {
        error: '잘못된 요청 형식입니다.',
        details: validationResult.error.flatten(),
      };
      return;
    }

    ctx.request.body = validationResult.data;
    await next();
  };
};
