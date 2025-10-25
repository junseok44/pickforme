import { StyleSheet } from 'react-native';
import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '../../constants';

export default function useStyle() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        ProductCard: {
            width: '100%'
        },
        ProductCardContent: {
            borderRadius: 4,
            padding: 15,
            flexDirection: 'row',
            gap: 20,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: theme.background.productCard,
            borderColor: theme.borderColor.primary,
            borderWidth: 1
        },
        ProductCardContentColumn: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0,
            width: '100%',
            maxWidth: '100%'
        },
        ProductCardContentRow: {
            flexDirection: 'row',
            gap: 10,
            backgroundColor: theme.background.productCard,
            width: '100%',
            justifyContent: 'space-between'
        },
        ProductCardName: {
            fontSize: 12,
            color: theme.text.primary,
            fontWeight: '500',
            lineHeight: 20,
            flex: 1,
            width: '100%',
            marginBottom: 8
        },
        ProductCardPrice: {
            fontSize: 12,
            lineHeight: 14.52,
            color: theme.text.primary,
            fontWeight: '700'
        },
        ProductCardDiscount: {
            fontSize: 11,
            lineHeight: 14,
            color: theme.text.discount,
            fontWeight: '500',
            marginLeft: 5
        },
        ProductCardReviews: {
            fontSize: 12,
            lineHeight: 12,
            color: theme.text.primary,
            fontWeight: '400',
            marginBottom: 4,
            width: '100%'
        },
        ProductCardTitleColumn: {
            flexDirection: 'column',
            flex: 1
        },
        ProductCardPriceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 8
        }
    });
}
