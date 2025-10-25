import { Context } from 'koa';
import db from 'models';

export default async (ctx: Context, next: () => Promise<any>) => {
  const user = await db.User.findById(ctx.state.user._id);
  if (user?.level !== 9) {
    ctx.body = 'login required';
    ctx.status = 401;
    return;
  }
  await next();
};
