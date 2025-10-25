import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useColorScheme from '../hooks/useColorScheme';
import type { ColorScheme } from '../hooks/useColorScheme';
import Colors from '../constants/Colors';

import { BackHeader, SelectButton } from '@components';
import { FAQS } from '@constants';
import { useRouter } from 'expo-router';

export default function FAQScreen() {
    const colorScheme = useColorScheme();
    const style = useStyle(colorScheme);
    const router = useRouter();

    return (
        <View style={style.FAQScreenContainer} onAccessibilityEscape={() => router.back()}>
            <BackHeader />
            <View style={style.FAQContent}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.FAQScroll}>
                    <Text style={style.FAQTitle}>자주 묻는 질문</Text>

                    <Text
                        style={style.FAQHeader}
                        accessible
                        accessibilityLabel={FAQS['PICKFORME'].name}
                        accessibilityRole="header"
                    >
                        {FAQS['PICKFORME'].name}
                    </Text>
                    <View style={style.FAQRows}>
                        {FAQS['PICKFORME'].questions.map(function ({ question, answer }, index) {
                            return (
                                <View style={style.FAQItem} key={`faq-row-${index}`}>
                                    <Text style={style.FAQQuestion}>{question}</Text>
                                    <Text style={style.FAQAnswer}>{answer}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <Text
                        style={[style.FAQHeader, { marginTop: 36 }]}
                        accessible
                        accessibilityLabel={FAQS['AI'].name}
                        accessibilityRole="header"
                    >
                        {FAQS['AI'].name}
                    </Text>
                    <View style={style.FAQRows}>
                        {FAQS['AI'].questions.map(function ({ question, answer }, index) {
                            return (
                                <View style={style.FAQItem} key={`faq-row-${index}`}>
                                    <Text style={style.FAQQuestion}>{question}</Text>
                                    <Text style={style.FAQAnswer}>{answer}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <Text
                        style={[style.FAQHeader, { marginTop: 36 }]}
                        accessible
                        accessibilityLabel={FAQS['POINT'].name}
                        accessibilityRole="header"
                    >
                        {FAQS['POINT'].name}
                    </Text>
                    <View style={style.FAQRows}>
                        {FAQS['POINT'].questions.map(function ({ question, answer }, index) {
                            return (
                                <View style={style.FAQItem} key={`faq-row-${index}`}>
                                    <Text style={style.FAQQuestion}>{question}</Text>
                                    <Text style={style.FAQAnswer}>{answer}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

function useStyle(colorScheme: ColorScheme) {
    const insets = useSafeAreaInsets();
    const theme = Colors[colorScheme];

    return StyleSheet.create({
        FAQScreenContainer: {
            flex: 1,
            backgroundColor: theme.background.primary
        },
        FAQContent: {
            flex: 1,
            paddingHorizontal: 20
        },
        FAQScroll: {
            paddingTop: 24,
            paddingBottom: insets.bottom + 24
        },
        FAQTitle: {
            fontWeight: '600',
            fontSize: 22,
            lineHeight: 34,
            marginBottom: 48,
            color: theme.text.primary
        },
        FAQHeader: {
            fontWeight: '600',
            fontSize: 24,
            lineHeight: 34,
            color: theme.text.primary
        },
        FAQRows: {
            marginTop: 24,
            color: theme.text.primary
        },
        FAQItem: {
            flexDirection: 'column',
            paddingVertical: 24,
            flex: 1,
            gap: 8
        },
        FAQQuestion: {
            fontSize: 16,
            fontWeight: '800',
            color: theme.text.primary
        },
        FAQAnswer: {
            fontSize: 12,
            lineHeight: 30,
            fontWeight: '500',
            color: theme.text.primary
        }
    });
}
