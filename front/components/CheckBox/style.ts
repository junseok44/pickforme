import { StyleSheet } from 'react-native';

export default function useStyles() {
    return StyleSheet.create({
        wrap: {
            width: 24, 
            height: 24, 
            alignItems: 'center',
            justifyContent: 'center'
        }
    });
}
