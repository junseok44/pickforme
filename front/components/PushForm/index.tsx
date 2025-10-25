import { Fragment, useState, useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { RadioButton } from 'react-native-paper';

import { PushService } from '@constants';
import useStyle from './style';

import type { IPush } from '@types';
import type { IPushForm } from './type';
import { router } from 'expo-router';

export default function PushForm({ value, onChange }: IPushForm) {
    const style = useStyle();

    const [payload, onPayload] = useState<IPush>(
        value || {
            service: PushService.ON
        }
    );

    useEffect(
        function () {
            onChange?.(payload);
        },
        [payload, onChange]
    );

    const selectedService = useMemo(
        function () {
            return payload?.service || value?.service || PushService.ON;
        },
        [payload, value]
    );

    return (
        <View style={style.PushFormContainer}>
            <Text style={style.PushFormTitle}>서비스 알림</Text>
            <View style={style.PushFormContent}>
                {Object.values(PushService).map(function (value, index) {
                    return (
                        <Fragment key={`push-service-${value}`}>
                            {index !== 0 && <View style={style.PushFormSeperator} />}
                            <View style={style.PushFormRow}>
                                <Text style={style.PushFormLabel}>{value.toUpperCase()}</Text>
                                <RadioButton.Android
                                    color="#111E4F"
                                    value={value}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${value === selectedService ? '선택됨,' : ''}${
                                        value === 'on' ? '알림 켜기' : '알림 끄기'
                                    }`}
                                    status={value === selectedService ? 'checked' : 'unchecked'}
                                    onPress={function () {
                                        onPayload(function (prev) {
                                            return { ...prev, service: value };
                                        });
                                    }}
                                />
                            </View>
                        </Fragment>
                    );
                })}
            </View>
        </View>
    );
}
