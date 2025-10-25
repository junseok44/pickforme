import { useAtomValue, useSetAtom } from "jotai";

import { isShowNonSubscriberManagerModalAtom } from "@stores";
import {
  subscriptionAtom,
  getSubscriptionAtom,
} from "../stores/purchase/atoms";
import { requestBottomSheetAtom } from "../stores/request/atoms";

const useCheckMembership = (callback: (e?: any) => any) => {
  const subscription = useAtomValue(subscriptionAtom);
  const getSubscription = useSetAtom(getSubscriptionAtom);

  return (params: any) => {
    // 구독 정보 갱신
    getSubscription();

    // 구독 정보가 없거나 구독이 만료되었을 때 콜백 호출
    if (
      !subscription ||
      subscription.isExpired ||
      subscription.purchase.status !== 1
    ) {
      // 모달 표시
      // setIsShowNonSubscriberManageModal(true);
      // callback(params);
    } else {
      // setRequestBottomSheet(params)
    }
  };
};

export default useCheckMembership;
