import dotenv from 'dotenv';

dotenv.config();

import mongoose from 'mongoose';
import { google } from 'googleapis';
import db from 'models';
import { EventMembershipProductReward } from 'models/product';
import { EVENT_IDS } from 'constants/events';

/**
 * 한시련 이벤트 신청자 대상으로 멤버쉽 처리를 해주기 위한 스크립트입니다.
 * back 폴더 아래에 google_api_credentials.json 파일을 넣어주고 (노션 픽포미 개발문서 > .env 파일 참고)
 * env를 production용 .env로 교체한다음에
 * (노션 픽포미 개발문서 > .env의 production env로 교체.)
 * npm run membership-events 로 실행해주세요.
 *
 * 여기서 지급하게 되는 포인트는 DB에 저장된 한시련 이벤트 멤버쉽 상품 (productId: pickforme_hansiryun_event_membership)의 포인트 값입니다.
 * 만약 해당 상품이 없으면 에러가 발생합니다.
 *
 * 주의! 스크립트 실행 이후에는 다시 local용 .env로 변경해주세요!
 */

// 구글 API 인증 설정
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.EVENTS_HANSIRYUN_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

interface FormResponse {
  timestamp: string;
  name: string;
  phoneNumber: string;
  email: string;
  membershipProcessed: string;
}

async function processUser(
  response: FormResponse,
  eventRewards: EventMembershipProductReward
): Promise<void> {
  try {
    const normalizedPhoneNumber = response.phoneNumber.replace(/-/g, '');

    const user = await db.User.findOne(
      {
        $or: [{ phone: normalizedPhoneNumber }, { email: response.email }],
      },
      {
        event: 1,
        MembershipAt: 1,
        point: 1,
        aiPoint: 1,
        email: 1,
        phone: 1,
      }
    );

    if (!user) {
      console.log(
        `유저 ${response.name}을 찾을 수 없습니다. phone: ${normalizedPhoneNumber} or email: ${response.email}`
      );
      return;
    }

    if ((await user.getCurrentEventId()) === EVENT_IDS.HANSIRYUN) {
      console.log(`유저 ${response.name} 이미 처리되었습니다.`);
      return;
    }

    if (response.membershipProcessed == 'o') {
      console.log(`유저 ${response.name} 이미 처리되었습니다2.`);
      return;
    }

    await user.applyEventMembershipRewards(eventRewards);

    console.log(
      `유저 ${response.name} userId ${user._id} MembershipAt ${user.MembershipAt} 처리 완료`
    );
  } catch (error) {
    console.error(`유저 ${response.email} 처리 중 오류 발생:`, error);
    throw error;
  }
}

async function main() {
  try {
    // MongoDB 연결
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI environment variable is required');
    }

    // Google Sheets API 초기화
    const sheets = google.sheets({ version: 'v4', auth });

    // 스프레드시트 ID와 범위 설정
    const spreadsheetId = process.env.EVENTS_HANSIRYUN_GOOGLE_SHEET_ID;
    const range = '설문지 응답 시트1!A:H';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is required');
    }

    // 스프레드시트 데이터 가져오기
    console.log('getting data from google sheet');
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = resp.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    // 헤더 행 제외하고 처리
    const formResponses = rows.slice(1).map((row: string[]) => ({
      timestamp: row[0],
      name: row[1],
      email: row[2],
      phoneNumber: row[3],
      membershipProcessed: row[6],
    }));

    const eventProducts = await db.Product.findOne({
      eventId: EVENT_IDS.HANSIRYUN,
    });

    if (!eventProducts) {
      console.log('No event products found');
      return;
    }

    const eventRewards = eventProducts.getEventRewards();

    // 각 응답 처리
    for (const response of formResponses) {
      await processUser(response, eventRewards);
    }

    console.log('Processing completed successfully');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error in main process:', error);
    process.exit(1);
  });
}
