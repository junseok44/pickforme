import { focusOnRef } from '@/utils/accessibility';
import { Text, View } from '@components';
import { Colors } from '@constants';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, Keyboard, Pressable, View as RNView, StyleSheet, TextInput } from 'react-native';
import Markdown from 'react-native-markdown-display';
import useColorScheme from '../../../hooks/useColorScheme';
import { ProductDetailState } from '../../../stores/product/types';
import { TABS, formatDate, formatTime } from '../../../utils/common';
import { getRequestsAtom } from '@/stores/request/atoms';
import { useSetAtom } from 'jotai';

interface QuestionTabProps {
    question: string;
    setQuestion: (text: string) => void;
    handleClickSend: any;
    request: any;
    productRequests: any[];
    loadingMessages: any;
    loadingStatus: any;
    tab: TABS;
    productDetail: ProductDetailState | void;
    isTabPressed: boolean;
}

const QuestionTab: React.FC<QuestionTabProps> = ({
    question,
    setQuestion,
    handleClickSend,
    request,
    productRequests,
    loadingMessages,
    loadingStatus,
    tab,
    productDetail,
    isTabPressed
}) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const inputRef = useRef<TextInput>(null);
    const loadingRef = useRef<RNView>(null);
    const answerRef = useRef<RNView>(null);
    const managerAnswerRef = useRef<RNView>(null);
    const getRequests = useSetAtom(getRequestsAtom);

    const markdownStyles = StyleSheet.create({
        text: {
            fontSize: 14,
            lineHeight: 20,
            color: Colors[colorScheme].text.primary
        }
    });

    useEffect(() => {
        getRequests();
    }, []);

    // 로딩 상태로 변경시 로딩 인디케이터에 포커스
    useEffect(() => {
        if (loadingStatus[tab] === 1 && loadingRef.current) {
            focusOnRef(loadingRef);
        }
    }, [loadingStatus[tab]]);

    // AI 답변이 완료되면 답변 영역에 포커스
    useEffect(() => {
        if (loadingStatus[tab] === 2 && productDetail?.answer && answerRef.current) {
            focusOnRef(answerRef);
        }
    }, [loadingStatus[tab], productDetail?.answer]);

    // 질문 입력창에 포커스
    useEffect(() => {
        const latestRequest = productRequests?.[0];

        if (isTabPressed && inputRef.current) {
            focusOnRef(inputRef);
        } else if (latestRequest?.answer?.text && managerAnswerRef.current) {
            // 탭을 누르지 않고 딥 링크 등으로 질문 탭으로 이동했을 때 매니저 답변에 포커스
            focusOnRef(managerAnswerRef);
        }
    }, [isTabPressed, productRequests]);

    return (
        <View style={styles.detailWrap}>
            <View style={styles.inputWrap}>
                <View style={{ width: '90%' }}>
                    <TextInput
                        ref={inputRef}
                        style={styles.textArea}
                        underlineColorAndroid="transparent"
                        value={question}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                            handleClickSend(question);
                        }}
                        accessible
                        accessibilityLabel="질문 입력창. 텍스트 필드. 상품에 대해 궁금한 점을 자유롭게 AI포미에게 물어보세요. 예를 들어, 이 상품의 단백질 함량은 몇그램 인가요? 라고 물어볼 수 있어요."
                        onChangeText={text => {
                            setQuestion(text);
                        }}
                        accessibilityHint="예를 들어, 이 상품의 단백질 함량은 몇그램 인가요? 라고 물어볼 수 있어요."
                        placeholder="상품에 대해 궁금한 점을 자유롭게 AI포미에게 물어보세요."
                        placeholderTextColor={colorScheme === 'dark' ? '#aaaaaa' : '#888888'}
                    />
                </View>

                <Pressable
                    onPress={() => {
                        Keyboard.dismiss();
                        if (question.trim()) {
                            handleClickSend(question);
                        }
                    }}
                    accessible
                    accessibilityLabel="질문하기"
                    accessibilityRole="button"
                    onAccessibilityTap={() => {
                        Keyboard.dismiss();
                        if (question.trim()) {
                            handleClickSend(question);
                        }
                    }}
                >
                    <Image
                        style={styles.sendIcon}
                        source={require('../../../assets/images/discover/downSquareArrow.png')}
                    />
                </Pressable>
            </View>

            {loadingStatus[tab] === 1 ? (
                <View
                    ref={loadingRef}
                    style={styles.indicatorWrap}
                    accessible
                    accessibilityLabel={loadingMessages[tab]}
                >
                    <ActivityIndicator />
                    <Text style={styles.loadingMessageText}>{loadingMessages[tab]}</Text>
                </View>
            ) : loadingStatus[tab] === 2 ? (
                <View
                    ref={answerRef}
                    accessible={true}
                    accessibilityLabel={`AI 포미 답변: ${productDetail?.answer || ''}`}
                >
                    <Markdown style={markdownStyles}>{`**AI 포미:** ${
                        productDetail && productDetail.answer
                    }`}</Markdown>
                </View>
            ) : null}

            {/* 전처리된 매니저 질문 응답 목록 표시 (최신순) */}
            {productRequests && productRequests.length > 0 ? (
                <>
                    <View style={styles.seperator}></View>
                    <View accessible={true} accessibilityLabel="매니저 답변">
                        <Text style={styles.boldText} ref={managerAnswerRef}>
                            매니저 답변
                        </Text>
                    </View>

                    <View style={styles.seperator}></View>
                    {productRequests.map((req, index) => (
                        <View key={req._id || index} style={index > 0 ? { marginTop: 20 } : {}}>
                            <Text
                                style={{ color: Colors[colorScheme].text.primary, marginBottom: 5 }}
                                accessible={true}
                                accessibilityLabel={`질문 날짜: ${formatDate(req?.updatedAt)} ${formatTime(
                                    req?.updatedAt
                                )}`}
                            >
                                {`${formatDate(req?.updatedAt)} ${formatTime(req?.updatedAt)}`}
                            </Text>

                            <View accessible={true} accessibilityLabel={`나의 질문: ${req?.text || ''}`}>
                                <Markdown style={markdownStyles}>{`**나의 질문:** ${req?.text || ''}`}</Markdown>
                            </View>

                            {req.answer?.text ? (
                                <View
                                    accessible={true}
                                    accessibilityLabel={`픽포미 매니저 답변: ${req?.answer?.text || ''}`}
                                >
                                    <Markdown style={markdownStyles}>{`**픽포미 매니저:** ${
                                        req?.answer?.text || ''
                                    }`}</Markdown>
                                </View>
                            ) : (
                                <View accessible={true} accessibilityLabel={loadingMessages.manager}>
                                    <Text style={styles.loadingMessageText}>{loadingMessages.manager}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </>
            ) : null}
        </View>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        detailWrap: {
            padding: 28
        },
        inputWrap: {
            flex: 1,
            marginBottom: 16,
            paddingLeft: 12,
            paddingRight: 8,
            paddingVertical: 8,
            borderRadius: 8,
            height: 40,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: Colors[colorScheme].background.primary,
            borderColor: Colors[colorScheme].border.primary,
            borderWidth: 1,
            flexDirection: 'row'
        },
        textArea: {
            fontSize: 14,
            flex: 1,
            width: '100%',
            color: Colors[colorScheme].text.primary
        },
        sendIcon: {
            flexShrink: 0,
            marginLeft: 3,
            width: 26,
            height: 26,
            justifyContent: 'center',
            alignItems: 'center'
        },
        indicatorWrap: {
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center'
        },
        loadingMessageText: {
            fontSize: 14,
            color: Colors[colorScheme].text.secondary
        },
        seperator: {
            width: '100%',
            backgroundColor: Colors[colorScheme].border.primary,
            height: 1,
            marginVertical: 25
        },
        boldText: {
            fontWeight: '700',
            color: Colors[colorScheme].text.primary
        }
    });

export default QuestionTab;
