/**
 * 검색 입력 컴포넌트
 */
import { useState, useCallback, forwardRef } from 'react';
import { View, TouchableOpacity, Image, TextInput } from 'react-native';
import useColorScheme from '../../hooks/useColorScheme';
import { SearchImage, CloseCircleImage } from '@assets';
import useStyle from './style';

import type { ForwardedRef } from 'react';
import type { ISearchInputProps } from './type';

export default forwardRef(function SearchInput(
    { placeholder, onChange, onSubmit }: ISearchInputProps,
    ref: ForwardedRef<TextInput>
) {
    const style = useStyle();
    const colorScheme = useColorScheme();

    const [innerValue, setInnerValue] = useState<string>('');

    const handleChangeText = useCallback(
        function (value: string) {
            setInnerValue(value);
            onChange?.(value);
        },
        [onChange]
    );

    const onReset = useCallback(
        function () {
            setInnerValue('');
            onChange?.('');
        },
        [onChange]
    );

    const handleSubmit = useCallback(
        function () {
            onSubmit?.(innerValue);
        },
        [onSubmit, innerValue]
    );

    return (
        <View style={style.SearchInputContainer}>
            <TextInput
                style={style.SearchInput}
                ref={ref}
                underlineColorAndroid="transparent"
                returnKeyType="done"
                accessible
                accessibilityLabel="검색어 입력창"
                placeholder={placeholder}
                placeholderTextColor={colorScheme === 'dark' ? '#aaaaaa' : '#888888'}
                value={innerValue}
                onChangeText={handleChangeText}
                onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity
                accessible
                accessibilityLabel="삭제"
                accessibilityRole="button"
                style={style.SearchInputCloseButton}
                onPress={onReset}
            >
                <Image style={style.SearchInputCloseImage} source={CloseCircleImage} />
            </TouchableOpacity>

            <TouchableOpacity
                accessible
                accessibilityLabel="검색하기"
                accessibilityRole="button"
                style={style.SearchInputSendButton}
                onPress={handleSubmit}
            >
                <Image style={style.SearchInputSendImage} source={SearchImage} />
            </TouchableOpacity>
        </View>
    );
});
