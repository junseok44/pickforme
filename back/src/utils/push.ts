import { Expo, ExpoPushMessage } from 'expo-server-sdk';

type PushMessageType = 'answer' | 'send_test' | 'membership_expiration';

// ExpoPushMessage에서 data 타입을 확장하여 type 키를 필수로 포함
type CustomExpoPushMessage = Omit<ExpoPushMessage, 'data'> & {
  data?: { type: PushMessageType; [key: string]: any };
};

const expo = new Expo();

const sendPush = (message: CustomExpoPushMessage) => {
  if (!message.to || !Expo.isExpoPushToken(message.to)) {
    return;
  }
  const chunks = expo.chunkPushNotifications([
    {
      sound: 'default',
      ...message,
    },
  ]);
  void (async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const chunk of chunks) {
      expo.sendPushNotificationsAsync(chunk).catch(() => {});
    }
  })();
};

export const sendPushs = (tos: string[], message: Omit<CustomExpoPushMessage, 'to'>) => {
  if (tos.some((to) => !to || !Expo.isExpoPushToken(to))) {
    return;
  }
  const chunks = expo.chunkPushNotifications(
    tos.map((to) => ({
      sound: 'default',
      ...message,
      to,
    }))
  );
  void (async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const chunk of chunks) {
      expo.sendPushNotificationsAsync(chunk).catch(() => {});
    }
  })();
};

export default sendPush;
