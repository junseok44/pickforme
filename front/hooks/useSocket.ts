import io from 'socket.io-client';
import React from 'react';
import { API_HOST } from '../constants/info';
import { setPointAtom } from '../stores/auth/atoms';
import { userAtom } from '@stores';
import { receiveChatAtom } from '../stores/request/atoms';
import { pushBottomSheetAtom } from '../stores/layout/atoms';
import { useAtomValue, useSetAtom } from 'jotai';

const useSocket = () => {
    const userData = useAtomValue(userAtom);
    const setPoint = useSetAtom(setPointAtom);
    const receiveChat = useSetAtom(receiveChatAtom);
    const token = React.useMemo(() => userData?.token, [userData]);
    const pushBottomSheet = useSetAtom(pushBottomSheetAtom);

    React.useEffect(() => {
        console.log('socket', API_HOST);
        if (token) {
            const ws = io(API_HOST, { extraHeaders: { token } });
            ws.on('message', e => {
                receiveChat(e);
            });
            ws.on('point', e => {
                setPoint(e);
            });
            ws.on('bottomsheet', e => {
                pushBottomSheet(e);
            });
            return () => {
                ws.disconnect();
            };
        }
    }, [token, receiveChat, setPoint, pushBottomSheet]);
};

export default useSocket;
