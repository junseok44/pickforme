import client from '../../utils/axios';
import { GetUserPointParams, UserPoint } from './types';
import { AxiosResponse } from 'axios';

export const UserPointAPI = (params: GetUserPointParams): Promise<AxiosResponse<UserPoint>> =>
    client.get<UserPoint>('/user/my', params);
