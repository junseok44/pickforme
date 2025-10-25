import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

/**
 * 앱 업데이트를 확인하고 있으면 다운로드 및 적용하는 함수
 * 앱 시작 시 자동으로 호출됩니다
 */
export async function checkAndFetchUpdates() {
    try {
        // 개발 모드에서는 업데이트 확인을 건너뜁니다
        if (__DEV__) {
            console.log('[Updates] 개발 모드에서는 업데이트 확인을 하지 않습니다.');
            return;
        }

        console.log('[Updates] 업데이트 확인 중...');
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
            console.log('[Updates] 새 업데이트가 있습니다. 다운로드 중...');
            await Updates.fetchUpdateAsync();
            console.log('[Updates] 업데이트 다운로드 완료. 앱을 다시 시작합니다.');
            Alert.alert('새로운 업데이트', '업데이트가 설치되어 앱이 다시 시작됩니다.', [
                {
                    text: '확인',
                    onPress: async () => {
                        await Updates.reloadAsync();
                    }
                }
            ]);
        } else {
            console.log('[Updates] 사용 가능한 업데이트가 없습니다.');
        }
    } catch (error) {
        console.error('[Updates] 업데이트 확인 중 오류 발생:', error);
    }
}
