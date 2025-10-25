import client, { handleApiError } from '../../utils/axios';

import { PostLogParams } from './types';

export const PostLogAPI = (params: PostLogParams) =>
    client.post('/log', params).catch(error => handleApiError(error, 'PostLog'));
