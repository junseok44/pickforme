import { Fragment, useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';
import { RadioButton } from 'react-native-paper';

import useStyle from './style';

import type { ISetting, TVision } from '@types';
import type { IInfoForm } from './type';

const translationMap = {
    none: '비장애',
    low: '저시력',
    blind: '전맹'
};

export default function InfoForm({ value, onChange }: IInfoForm) {
    const style = useStyle();

    const [payload, onPayload] = useState<ISetting>(value || {});

    useEffect(
        function () {
            onChange?.(payload);
        },
        [payload, onChange]
    );

    const selectedVision = useMemo(
        function () {
            return payload?.vision || value?.vision || undefined;
        },
        [payload, value]
    );

    return (
        <View style={style.InfoFormContainer}>
            <View style={[style.InfoFormSection, style.InfoFormSection2]}>
                <Text style={style.InfoFormTitle}>닉네임을 입력해주세요.</Text>
                <TextInput
                    style={style.InfoFormInput}
                    underlineColorAndroid="transparent"
                    accessibilityLabel="닉네임 입력창"
                    value={payload?.name || value?.name || ''}
                    onChangeText={function (value) {
                        onPayload(function (prev) {
                            return { ...prev, name: value };
                        });
                    }}
                />
            </View>

            <View style={style.InfoFormSection}>
                <Text style={style.InfoFormTitle}>시각장애 정도를 선택해주세요.</Text>
                <View style={style.InfoFormRadioContainer}>
                    {Object.entries(translationMap).map(function ([key, label], index) {
                        return (
                            <Fragment key={`vision-${key}`}>
                                {index !== 0 && <View style={style.InfoFormRadioButtonDivider} />}

                                <View style={style.InfoFormRadioButtonContainer}>
                                    <Text
                                        style={style.InfoFormRadioButtonLabel}
                                        accessible={false}
                                        importantForAccessibility="no"
                                    >
                                        {label}
                                    </Text>
                                    <RadioButton.Android
                                        accessibilityLabel={`${key === selectedVision ? '선택됨,' : ''}${label}`}
                                        accessibilityRole="button"
                                        color="#111E4F"
                                        value={key}
                                        status={key === selectedVision ? 'checked' : 'unchecked'}
                                        onPress={function () {
                                            onPayload(function (prev) {
                                                return {
                                                    ...prev,
                                                    vision: key as TVision
                                                };
                                            });
                                        }}
                                    />
                                </View>
                            </Fragment>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
