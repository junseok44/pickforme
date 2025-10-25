import React from 'react';
import { StyleSheet } from 'react-native';
import { Button_old as Button, View } from '@components';
import { TABS, tabName } from '../../utils/common';
import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '@constants';

interface TabNavigationProps {
    tab: TABS;
    handlePressTab: (tab: TABS) => void;
    isLocal: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tab, handlePressTab, isLocal }) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);

    return (
        <View style={styles.tabWrap}>
            {Object.values(TABS).map(TAB =>
                isLocal && TAB === TABS.QUESTION ? null : (
                    <View style={styles.tab} key={`Requests-Tab-${TAB}`}>
                        <Button
                            style={[styles.tabButton, tab === TAB && styles.tabButtonActive]}
                            textStyle={[styles.tabButtonText, tab === TAB && styles.tabButtonTextActive]}
                            variant="text"
                            title={tabName[TAB]}
                            size="medium"
                            color={tab === TAB ? 'primary' : 'tertiary'}
                            onPress={() => handlePressTab(TAB)}
                            accessible
                            accessibilityLabel={`${tabName[TAB]} 탭`}
                            accessibilityRole="button"
                            selected={tab === TAB}
                        />
                    </View>
                )
            )}
        </View>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        tabWrap: {
            flexDirection: 'row',
            alignContent: 'stretch',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: Colors[colorScheme].background.primary
        },
        tab: {
            flex: 1
        },
        tabButton: {
            paddingVertical: 16,
            flex: 1,
            flexDirection: 'row',
            borderRadius: 0,
            borderBottomWidth: 1,
            borderColor: Colors[colorScheme].border.third
        },
        tabButtonActive: {
            borderBottomColor: Colors[colorScheme].text.primary,
            borderBottomWidth: 2
        },
        tabButtonText: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 17,
            color: Colors[colorScheme].text.primary
        },
        tabButtonTextActive: {
            fontWeight: '700',
            color: Colors[colorScheme].text.primary
        }
    });

export default TabNavigation;
