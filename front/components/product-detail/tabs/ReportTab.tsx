import { focusOnRef } from '@/utils/accessibility';
import { Text, View } from '@components';
import { Colors } from '@constants';
import React, { useEffect, useRef } from 'react';
import { Platform, View as RNView, StyleSheet } from 'react-native';
import useColorScheme, { ColorScheme } from '../../../hooks/useColorScheme';
import { ProductDetailState } from '../../../stores/product/types';

interface ReportTabProps {
    productDetail: ProductDetailState;
    isTabPressed: boolean;
}

const ReportTab: React.FC<ReportTabProps> = ({ productDetail, isTabPressed }) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const firstSectionRef = useRef<RNView>(null);

    useEffect(() => {
        if (isTabPressed) {
            // 안드로이드에서는 더 긴 딜레이가 필요
            const delay = Platform.OS === 'android' ? 1000 : 500;

            // 첫 번째 섹션이 있으면 그곳에 포커스, 없으면 전체 컨텐츠에 포커스
            if (firstSectionRef.current) {
                focusOnRef(firstSectionRef, delay);
            }
        }
    }, [isTabPressed]);

    // 보고서 내용 준비
    const reportContent = productDetail?.report || '상품 분석 내용이 없습니다.';

    // 대괄호 기준으로 섹션 분리하는 함수
    const parseReportSections = (content: string) => {
        // 대괄호 패턴이 있는지 확인 (최소 하나의 [제목] 형태가 있어야 함)
        const bracketPattern = /\[([^\]]+)\]/g;
        const matches = content.match(bracketPattern);

        if (!matches || matches.length === 0) {
            // 대괄호 형식이 없으면 전체를 하나의 섹션으로 처리
            return [{ title: null, content: content.trim() }];
        }

        // 대괄호로 섹션 분리
        const sections = [];
        const parts = content.split(/(\[[^\]]+\])/);

        let currentTitle = null;
        let currentContent = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();

            if (part.match(/^\[([^\]]+)\]$/)) {
                // 이전 섹션이 있으면 저장
                if (currentTitle && currentContent.trim()) {
                    sections.push({
                        title: currentTitle,
                        content: currentContent.trim()
                    });
                }

                // 새 섹션 시작
                currentTitle = part.replace(/^\[|\]$/g, '');
                currentContent = '';
            } else if (part) {
                currentContent += part + '\n';
            }
        }

        // 마지막 섹션 저장
        if (currentTitle && currentContent.trim()) {
            sections.push({
                title: currentTitle,
                content: currentContent.trim()
            });
        }

        return sections;
    };

    const reportSections = parseReportSections(reportContent);

    return (
        <View style={styles.detailWrap}>
            {reportSections.map((section, index) => (
                <View
                    key={index}
                    ref={index === 0 ? firstSectionRef : null}
                    accessible={true}
                    style={[styles.sectionContainer, index === reportSections.length - 1 && { marginBottom: 0 }]}
                >
                    <Text style={styles.reportText}>
                        {section.title ? `[${section.title}]\n${section.content}` : section.content}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const useStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        detailWrap: {
            padding: 28
        },
        sectionContainer: {
            marginBottom: 16
        },
        reportText: {
            fontSize: 14,
            lineHeight: 20,
            color: Colors[colorScheme].text.primary
        }
    });

export default ReportTab;
