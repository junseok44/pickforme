import React from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import BottomSheet from "react-native-modal";
import { useAtomValue, useSetAtom } from "jotai";

import { View, Text, Button } from "@components";
import { Props as BaseProps, styles } from "./Base";
import {
    bottomSheetsAtom,
    closeBottomSheetAtom,
} from "../../stores/layout/atoms";
import { BottomSheetInfo } from "../../stores/layout/types";

const localStyles = StyleSheet.create({});

interface Props extends BaseProps {
    info: BottomSheetInfo;
    index: number;
}

const CommongBottomSheet: React.FC<Props> = ({ info, index }) => {
    const bottomSheets = useAtomValue(bottomSheetsAtom);
    const isFirst =
        bottomSheets.findIndex(({ isVisible }) => !!isVisible) === index;
    const [isVisible, setIsVisible] = React.useState(info.isVisible);
    const router = useRouter();
    const closeBottomSheet = useSetAtom(closeBottomSheetAtom);

    const onClose = () => {
        setIsVisible(false);
    };

    const onHide = () => {
        closeBottomSheet(index);
    };
    return (
        <BottomSheet
            style={styles.base}
            isVisible={isVisible && isFirst}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            onModalHide={onHide}
        >
            <View style={styles.bottomSheet}>
                {info.nodes.map((node) => (
                    // @ts-ignore
                    <Text
                        style={styles[node.type as keyof typeof styles]}
                        lineBreakStrategyIOS="hangul-word"
                    >
                        {node.text}
                    </Text>
                ))}
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrap}>
                        <Button
                            color="secondary"
                            title="확인"
                            onPress={onClose}
                            style={styles.button}
                        />
                    </View>
                </View>
            </View>
        </BottomSheet>
    );
};
export default CommongBottomSheet;
