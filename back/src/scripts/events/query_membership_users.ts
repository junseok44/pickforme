import 'env';

import mongoose from 'mongoose';
import { google } from 'googleapis';
import db from 'models';

/**
 * 스프레드시트에서 멤버쉽 지급여부가 'o'인 유저들의 DB 정보를 조회하는 스크립트입니다.
 *
 * 실행 방법:
 * npm run query-membership-users
 *
 * 또는 직접 실행:
 * NODE_ENV=production NODE_PATH=./src ts-node src/scripts/events/query_membership_users.ts
 */

// 구글 API 인증 설정 (읽기 권한 필요)
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.EVENTS_PICKFORME_TEST_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

interface FormResponse {
  timestamp: string;
  name: string;
  phoneNumber: string;
  email: string;
  membershipProcessed: string;
  rowIndex: number;
  activityStarted: string;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  MembershipAt: Date | null;
  lastMembershipAt: Date | null;
  point: number;
  aiPoint: number;
  event: number | null;
  _id: string;
}

async function queryMembershipUsers(): Promise<void> {
  try {
    // MongoDB 연결
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI environment variable is required');
    }

    await mongoose.connect(uri);

    // Google Sheets API 초기화
    const sheets = google.sheets({ version: 'v4', auth });

    // 스프레드시트 ID와 범위 설정
    const spreadsheetId = process.env.EVENTS_PICKFORME_TEST_GOOGLE_SHEET_ID;
    const range = '설문지 응답 시트1!A:L';

    if (!spreadsheetId) {
      throw new Error('EVENTS_PICKFORME_TEST_GOOGLE_SHEET_ID environment variable is required');
    }

    // 스프레드시트 데이터 가져오기
    console.log('스프레드시트에서 데이터를 가져오는 중...');
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = resp.data.values;
    if (!rows || rows.length === 0) {
      console.log('스프레드시트에서 데이터를 찾을 수 없습니다.');
      return;
    }

    // 헤더 행 제외하고 처리
    const formResponses = rows.slice(1).map((row: string[], index: number) => ({
      timestamp: row[0],
      name: row[2], // 이름은 C컬럼 (인덱스 2)
      email: row[4], // 이메일은 E컬럼 (인덱스 4)
      phoneNumber: row[3], // 전화번호는 D컬럼 (인덱스 3)
      membershipProcessed: row[10], // 멤버쉽 지급여부는 K컬럼 (인덱스 10)
      rowIndex: index, // 0-based index (헤더 제외)
      activityStarted: row[11], // 활동시작여부는 L컬럼 (인덱스 11)
    }));
    console.log('🚀 ~ queryMembershipUsers ~ formResponses:', formResponses);

    // 멤버쉽 지급여부가 'o'인 응답만 필터링
    const membershipProcessedResponses = formResponses.filter((r) => r.membershipProcessed === 'o');

    console.log(
      `총 응답: ${formResponses.length}, 멤버쉽 지급된 응답: ${membershipProcessedResponses.length}`
    );

    if (membershipProcessedResponses.length === 0) {
      console.log('멤버쉽이 지급된 유저가 없습니다.');
      return;
    }

    // 각 유저의 DB 정보 조회
    const userInfos: UserInfo[] = [];
    const notFoundUsers: string[] = [];

    for (const response of membershipProcessedResponses) {
      try {
        const normalizedPhoneNumber = response.phoneNumber.replace(/-/g, '');

        const user = await db.User.findOne(
          {
            $or: [{ phone: normalizedPhoneNumber }, { email: response.email }],
          },
          {
            MembershipAt: 1,
            lastMembershipAt: 1,
            point: 1,
            aiPoint: 1,
            email: 1,
            phone: 1,
            event: 1,
            _id: 1,
          }
        );

        if (!user) {
          notFoundUsers.push(`${response.name} (${response.email})`);
          continue;
        }

        userInfos.push({
          name: response.name,
          email: user.email,
          phone: user.phone || '',
          MembershipAt: user.MembershipAt,
          lastMembershipAt: user.lastMembershipAt,
          point: user.point,
          aiPoint: user.aiPoint,
          event: user.event || null,
          _id: user._id.toString(),
        });
      } catch (error) {
        console.error(`유저 ${response.name} (${response.email}) 조회 중 오류:`, error);
        notFoundUsers.push(`${response.name} (${response.email})`);
      }
    }

    // 결과 출력
    console.log('\n=== 멤버쉽 지급된 유저 정보 ===');
    console.log(`총 ${userInfos.length}명의 유저 정보를 찾았습니다.\n`);

    // 테이블 헤더
    console.log(
      '이름'.padEnd(15) +
        '이메일'.padEnd(30) +
        '전화번호'.padEnd(15) +
        '멤버쉽시작'.padEnd(20) +
        '마지막멤버쉽'.padEnd(20) +
        '포인트'.padEnd(10) +
        'AI포인트'.padEnd(10) +
        '이벤트'
    );
    console.log('-'.repeat(150));

    // 각 유저 정보 출력
    userInfos.forEach((user, index) => {
      const membershipAt = user.MembershipAt
        ? user.MembershipAt.toISOString().split('T')[0]
        : 'N/A';
      const lastMembershipAt = user.lastMembershipAt
        ? user.lastMembershipAt.toISOString().split('T')[0]
        : 'N/A';
      const event = user.event || 'N/A';

      console.log(
        user.name.padEnd(15) +
          user.email.padEnd(30) +
          user.phone.padEnd(15) +
          membershipAt.padEnd(20) +
          lastMembershipAt.padEnd(20) +
          user.point.toString().padEnd(10) +
          user.aiPoint.toString().padEnd(10) +
          event
      );
    });
  } catch (error) {
    console.error('스크립트 실행 중 오류 발생:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  queryMembershipUsers().catch((error) => {
    console.error('스크립트 실행 중 오류:', error);
    process.exit(1);
  });
}
