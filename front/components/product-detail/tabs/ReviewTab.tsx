import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View as RNView,
    findNodeHandle,
    AccessibilityInfo,
    InteractionManager,
    Pressable
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Text, View } from '@components';
import useColorScheme from '../../../hooks/useColorScheme';
import { Colors } from '@constants';
import { ProductDetailState } from '../../../stores/product/types';

interface ReviewTabProps {
    productDetail: ProductDetailState;
    isTabPressed: boolean;
    handleLoadMore: () => void;
}

const ReviewTab: React.FC<ReviewTabProps> = ({ productDetail, isTabPressed, handleLoadMore }) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const markdownStyles = {
        body: {
            color: Colors[colorScheme].text.primary,
            fontSize: 14,
            lineHeight: 20
        }
    };

    const review = productDetail?.review;
    const contentRef = useRef<RNView>(null);

    useEffect(() => {
        if (contentRef.current && isTabPressed) {
            InteractionManager.runAfterInteractions(() => {
                const nodeHandle = findNodeHandle(contentRef.current);
                if (nodeHandle) {
                    setTimeout(() => {
                        AccessibilityInfo.setAccessibilityFocus(nodeHandle);
                    }, 500); // 0.5초 후에 시도
                }
            });
        }
    }, [contentRef.current, isTabPressed]);

    return (
        <>
            {review?.pros?.length !== 0 && (
                <View style={styles.detailWrap}>
                    <View ref={contentRef} accessible={true}>
                        <Text
                            style={styles.reviewListTitle}
                            accessible={true}
                            accessibilityRole="header"
                            accessibilityLabel="긍정적인 리뷰"
                        >
                            긍정적인 리뷰
                        </Text>
                    </View>
                    {review?.pros.map((row: string, i: number) => (
                        <View key={`positive-review-${i}`} accessible={true} accessibilityLabel={`${i + 1}. ${row}`}>
                            <Markdown style={markdownStyles}>{`${i + 1}. ${row}`}</Markdown>
                        </View>
                    ))}
                </View>
            )}
            {review?.cons?.length !== 0 && (
                <View style={styles.detailWrap}>
                    <Text
                        style={styles.reviewListTitle}
                        accessible={true}
                        accessibilityRole="header"
                        accessibilityLabel="부정적인 리뷰"
                    >
                        부정적인 리뷰
                    </Text>
                    {review?.cons.map((row: string, i: number) => (
                        <View key={`negative-review-${i}`} accessible={true} accessibilityLabel={`${i + 1}. ${row}`}>
                            <Markdown style={markdownStyles}>{`${i + 1}. ${row}`}</Markdown>
                        </View>
                    ))}
                </View>
            )}
            {review?.bests?.length !== 0 && (
                <View style={styles.detailWrap}>
                    <Text
                        style={styles.reviewListTitle}
                        accessible={true}
                        accessibilityRole="header"
                        accessibilityLabel="베스트 리뷰"
                    >
                        베스트 리뷰
                    </Text>
                    {review?.bests.map((row: string, i: number) => (
                        <View key={`best-review-${i}`} accessible={true} accessibilityLabel={`리뷰 ${i + 1}: ${row}`}>
                            <Markdown style={markdownStyles}>{`**리뷰 ${i + 1}:** ${row}`}</Markdown>
                        </View>
                    ))}
                </View>
            )}
        </>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        detailWrap: {
            padding: 28
        },
        reviewListTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: Colors[colorScheme].text.primary,
            marginBottom: 8
        },
        loadMoreButton: {
            marginTop: 20,
            padding: 12,
            backgroundColor: Colors[colorScheme].background.secondary,
            borderRadius: 8,
            alignItems: 'center'
        },
        loadMoreText: {
            fontSize: 14,
            fontWeight: '600',
            color: Colors[colorScheme].text.primary
        }
    });

export default ReviewTab;
