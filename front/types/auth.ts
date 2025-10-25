import { PushService } from '@constants';

export interface IBaseAuthPayload {
    accessToken: string;
}

export interface IAppleAuthPayload {
    identityToken: string;
}

export interface IPush {
    service?: PushService;
}

export interface IUser {
    _id?: string;
    email?: string;
    point?: number;
    aiPoint?: number;
    level?: number;
    lastLoginAt?: string;
    token?: string;
    push?: IPush;
}

export interface ILogin {
    user: IUser;
    isRegister: boolean;
    isNewLoginInEvent: boolean;
}
