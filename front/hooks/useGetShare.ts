import { useEffect } from "react";
import { useRouter } from "expo-router";
import { searchProductsAtom } from "../stores/product/atoms";
import { useSetAtom } from "jotai";

import ReceiveSharingIntentModule from "react-native-receive-sharing-intent";

type FileType = {
    text: string | null;
    weblink: string | null;
};

const useGetShare = () => {
    const router = useRouter();
    const searchProducts = useSetAtom(searchProductsAtom);

    useEffect(() => {
        ReceiveSharingIntentModule.getReceivedFiles(
            (file: FileType[]) => {
                try {
                    const { text, weblink } = file[0];

                    if (!text && !weblink) return;

                    const link = (weblink || text) as string;
                    searchProducts({
                        query: link,
                        page: 1,
                        sort: "",
                        onLink: router.push,
                        onQuery: () => {},
                    });
                    // router.replace({ pathname: '/research', params: { link: encodeURIComponent(link) } });
                } catch {}
            },
            (error: any) => {},
            "com.sigonggan.pickforme"
        );
    }, []);
};

export default useGetShare;
