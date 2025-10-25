import { Context } from 'koa';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export interface JWT {
  _id: mongoose.Types.ObjectId;
  email: string;
}

const accessTokenOptions = {
  expiresIn: '300d', // 액세스 토큰 만료 시간 단축 (보안)
};

const refreshTokenOptions = {
  expiresIn: '500d', // 리프레시 토큰은 더 긴 유효기간
};

const generateAccessToken = (payload: JWT) =>
  new Promise<string>((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_SECRET!, accessTokenOptions, (error, token) => {
      if (error) reject(error);
      if (!token) reject(new Error('Token generation failed'));
      resolve(token!);
    });
  });

const generateRefreshToken = (payload: JWT) =>
  new Promise<string>((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, refreshTokenOptions, (error, token) => {
      if (error) reject(error);
      if (!token) reject(new Error('Token generation failed'));
      resolve(token!);
    });
  });

export const decodeJWT = (token: string) => jwt.verify(token, process.env.JWT_SECRET!) as JWT;
export const decodeRefreshJWT = (token: string) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWT;

export const requireAuth = (ctx: Context, next: () => void) => {
  if (!ctx.state.user) {
    ctx.body = 'Unauthorized';
    ctx.status = 401;
    return null;
  }
  return next();
};

export default { generateAccessToken, generateRefreshToken };
