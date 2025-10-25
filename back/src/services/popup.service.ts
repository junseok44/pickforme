import Popup from '../models/popup';
import db from 'models';

export interface PopupData {
  popup_id: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreatePopupData {
  popup_id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export class PopupService {
  /**
   * 모든 팝업을 조회합니다.
   */
  static async getAllPopups(): Promise<PopupData[]> {
    return Popup.find({});
  }

  /**
   * 활성 팝업을 조회합니다. (기간이 지정되지 않은 팝업 + 현재 시간이 범위 내에 있는 팝업)
   */
  static async getActivePopups(): Promise<PopupData[]> {
    // KST 기준 현재 날짜/시간
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9

    // 기간이 지정된 팝업과 기간이 지정되지 않은 팝업을 모두 조회
    const popups = await Popup.find({
      $or: [
        // 기간이 지정되지 않은 팝업 (startDate와 endDate가 모두 null)
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
        // 시작 날짜만 있는 팝업 (현재 시간이 시작 날짜 이후)
        {
          startDate: { $exists: true, $ne: null, $lte: kstNow },
          endDate: { $exists: false },
        },
        {
          startDate: { $exists: true, $ne: null, $lte: kstNow },
          endDate: null,
        },
        // 종료 날짜만 있는 팝업 (현재 시간이 종료 날짜 이전)
        {
          startDate: { $exists: false },
          endDate: { $exists: true, $ne: null, $gte: kstNow },
        },
        {
          startDate: null,
          endDate: { $exists: true, $ne: null, $gte: kstNow },
        },
        // 시작 날짜와 종료 날짜가 모두 있는 팝업 (현재 시간이 범위 내)
        {
          startDate: { $exists: true, $ne: null, $lte: kstNow },
          endDate: { $exists: true, $ne: null, $gte: kstNow },
        },
      ],
    });

    return popups;
  }

  /**
   * 사용자가 숨기지 않은 활성 팝업을 조회합니다.
   */
  static async getActivePopupsForUser(userId: string): Promise<PopupData[]> {
    const activePopups = await this.getActivePopups();

    const user = await db.User.findById(userId);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!user.hide || !Array.isArray(user.hide)) {
      user.hide = [];
    }

    const hidePopupIds = new Set(user.hide.map((id) => id.toString()));

    return activePopups.filter((popup) => !hidePopupIds.has(popup.popup_id));
  }

  /**
   * 팝업을 생성합니다.
   */
  static async createPopup(data: CreatePopupData): Promise<PopupData> {
    const { popup_id: popupId, title, description, startDate, endDate } = data;

    // 필수 필드 검증
    if (!popupId || !title) {
      throw new Error('popup_id와 title은 필수 입력값입니다.');
    }

    // 날짜 유효성 검증 (날짜가 제공된 경우에만)
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new Error('유효하지 않은 시작 날짜 형식입니다.');
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new Error('유효하지 않은 종료 날짜 형식입니다.');
      }
    }

    // 시작 날짜와 종료 날짜가 모두 있는 경우에만 순서 검증
    if (start && end && start >= end) {
      throw new Error('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
    }

    const popup = new Popup({
      popup_id: popupId,
      title,
      description,
      startDate: start,
      endDate: end,
    });

    await popup.save();
    return popup;
  }

  /**
   * 팝업을 삭제합니다.
   */
  static async deletePopup(popupId: string): Promise<void> {
    const result = await Popup.findOneAndDelete({
      popup_id: popupId,
    });

    if (!result) {
      throw new Error('해당하는 팝업을 찾을 수 없습니다.');
    }
  }
}
