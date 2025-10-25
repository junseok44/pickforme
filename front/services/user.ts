import { useMutation } from '@tanstack/react-query';

import client from '../utils/axios';

import type { IPush, IServiceProps } from '@types';

export function useServicePush({ onSuccess }: Partial<IServiceProps> = {}) {
    const { mutateAsync, isPending } = useMutation({
        mutationKey: ['mutatePushSetting'],
        mutationFn: function (payload: IPush) {
            return client.put('/auth/pushsetting', payload);
        },
        onSuccess: function (response) {
            if (response.status === 200) {
                onSuccess?.({ push: response.data });
            }
        }
    });

    return { mutateAsync, isPending };
}
