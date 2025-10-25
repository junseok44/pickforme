import { Stack } from 'expo-router';

export default function OnBoardingLayout() {
    return (
        <Stack initialRouteName="index">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="nickname" options={{ headerShown: false }} />
        </Stack>
    );
}
