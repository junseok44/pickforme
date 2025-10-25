import { useRef, useState, useEffect } from 'react';
import { TextInput, StyleSheet, AccessibilityInfo, findNodeHandle, InteractionManager } from 'react-native';

import { useAtom, useSetAtom, useAtomValue } from 'jotai';

import useColorScheme from '../../hooks/useColorScheme';
import { requestBottomSheetAtom, addRequestAtom } from '../../stores/request/atoms';
import { isShowRequestModalAtom, membershipModalTypeAtom } from '@stores';
import { scrapedProductDetailAtom } from '../../stores/product/atoms';

import { QuestionRequestParams, RequestType } from '../../stores/request/types';
import { Colors } from '@constants';
import { Text, View, Button_old as Button } from '@components';
import { createStyles } from './Base';
import useCheckMembership from '../../hooks/useCheckMembership';
import useCheckPoint from '../../hooks/useCheckPoint';
import type { ColorScheme } from '@hooks';
import useCheckLogin from '../../hooks/useCheckLogin';
import { Pressable } from 'react-native';
import CloseIcon from '@/assets/icons/CloseIcon';

export default function RequestBottomSheet() {
    const headerTitleRef = useRef(null);

    const addRequest = useSetAtom(addRequestAtom);
    const colorScheme = useColorScheme();
    const localStyles = useLocalStyles(colorScheme);
    const styles = createStyles(colorScheme);

    const scrapedProductDetail = useAtomValue(scrapedProductDetailAtom);

    const setIsShowRequestModal = useSetAtom(isShowRequestModalAtom);

    const [data, setData] = useState<Omit<QuestionRequestParams, 'product'>>({
        type: RequestType.QUESTION,
        text: ''
    });
    const prevTextRef = useRef('');
    const checkMembership = useCheckMembership((params: QuestionRequestParams) => {
        if (product) {
            addRequest(params);
        }
    });
    const checkPoint = useCheckPoint((params: QuestionRequestParams) => {
        if (product) {
            addRequest(params);
        }
    });
    const setMembershipModalType = useSetAtom(membershipModalTypeAtom);
    const handleSubmit = useCheckLogin(() => {
        setMembershipModalType('MANAGER');
        const params = {
            ...data,
            product,
            images: scrapedProductDetail?.images,
            reviews: scrapedProductDetail?.reviews
        } as QuestionRequestParams;
        onClose();
        checkPoint(params);
        setIsShowRequestModal(false);
    });
    const disabled = !data.text;
    const [product, setProduct] = useAtom(requestBottomSheetAtom);
    const onClose = () => {
        setData({ ...data, text: '' });
        setProduct(undefined);
    };

    const announceMessage = (message: string) => {
        AccessibilityInfo.announceForAccessibility(message);
    };

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            if (headerTitleRef.current) {
                const node = findNodeHandle(headerTitleRef.current);
                if (node) {
                    setTimeout(() => {
                        AccessibilityInfo.setAccessibilityFocus(node);
                    }, 1000);
                }
            }
        });
        return () => task.cancel();
    }, []); // 빈 배열로 최초 1회만 실행

    return (
        <View style={styles.base}>
            <View style={[styles.bottomSheet, localStyles.root]}>
                <Pressable
                    onPress={() => {
                        setIsShowRequestModal(false);
                    }}
                    accessible
                    accessibilityLabel="닫기"
                    accessibilityRole="button"
                    onAccessibilityEscape={() => {
                        setIsShowRequestModal(false);
                    }}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        marginBottom: 20,
                        marginTop: 20,
                        paddingRight: 20
                    }}
                >
                    <CloseIcon size={24} color={Colors[colorScheme].text.primary} />
                </Pressable>
                <Text
                    style={[styles.title, localStyles.title]}
                    ref={headerTitleRef}
                    accessible
                    accessibilityLabel="상품에 대해 궁금한 점을 자유롭게 적어주세요. 예를 들어, 이 제품의 색상과 디자인을 자세히 설명해 주세요 라고 물어볼 수 있어요."
                >
                    상품에 대해 궁금한 점을 자유롭게 적어주세요.{'\n'} {'\n'}
                    예를 들어, "이 제품의 색상과 디자인을 자세히 설명해 주세요." 라고 물어볼 수 있어요.
                </Text>
                <View style={localStyles.textAreaContainer} accessible accessibilityLabel="질문 입력 영역, 텍스트 필드">
                    <TextInput
                        accessibilityRole="none"
                        accessibilityHint="텍스트 입력창"
                        style={[localStyles.textArea, localStyles.textAreaBig]}
                        underlineColorAndroid="transparent"
                        numberOfLines={4}
                        textAlignVertical="top"
                        returnKeyType="done"
                        onChangeText={text => {
                            setData({ ...data, text });
                            
                            // 이전 텍스트와 비교하여 텍스트가 삭제되었는지 확인
                            const prevText = prevTextRef.current;
                            if (prevText.length > text.length) {
                                // 삭제된 글자 찾기
                                let deletedChars = '';
                                
                                // 간단한 경우: 마지막 글자만 삭제된 경우
                                if (prevText.startsWith(text)) {
                                    deletedChars = prevText.substring(text.length);
                                } 
                                // 앞쪽이나 중간에서 삭제된 경우, 더 복잡한 비교 필요
                                else {
                                    // 최대 연속 공통 부분을 찾아 삭제된 부분 유추
                                    for (let i = 0; i < prevText.length; i++) {
                                        if (i >= text.length || prevText[i] !== text[i]) {
                                            deletedChars += prevText[i];
                                        }
                                    }
                                }
                                
                                if (deletedChars) {
                                    announceMessage(`삭제됨: ${deletedChars}`);
                                } else {
                                    announceMessage('삭제됨');
                                }
                            } else if (text) {
                                announceMessage(text);
                            }
                            
                            // 현재 텍스트를 이전 텍스트로 저장
                            prevTextRef.current = text;
                        }}
                        onSubmitEditing={handleSubmit}
                    />
                </View>
                <Button
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="매니저에게 질문하기"
                    style={[
                        styles.button,
                        {
                            backgroundColor: Colors[colorScheme].button.primary.background
                        }
                    ]}
                    title="매니저에게 질문하기"
                    onPress={handleSubmit}
                    disabled={disabled}
                    textStyle={{ color: Colors[colorScheme].button.primary.text, fontSize: 14 }}
                />
            </View>
        </View>
    );
}

const useLocalStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        root: {
            paddingBottom: 40
        },
        title: {
            fontSize: 14,
            lineHeight: 17,
            fontWeight: '400',
            marginBottom: 20,
            color: Colors[colorScheme].text.primary
        },
        textAreaContainer: {
            width: '100%',
            borderColor: Colors[colorScheme].borderColor.secondary,
            borderWidth: 1,
            padding: 5,
            marginBottom: 24
        },
        textArea: {
            color: Colors[colorScheme].text.primary
        },
        textAreaBig: {
            height: 116
        },
        buttonText: {
            color: Colors[colorScheme].text.primary
        }
    });
