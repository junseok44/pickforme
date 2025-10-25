import 'env';

import mongoose from 'mongoose';
import { google } from 'googleapis';
import db from 'models';
import { EventMembershipProductReward } from 'models/product';
import { EVENT_IDS } from '../../constants/events';

/**
 * 픽포미 체험단 이벤트 신청자 대상으로 멤버쉽 처리를 해주기 위한 스크립트입니다.
 * back 폴더 아래에 google_api_credentials.json 파일을 넣어주고 (노션 픽포미 개발문서 > .env 파일 참고)
 * env를 production용 .env로 교체한다음에
 * (노션 픽포미 개발문서 > .env의 production env로 교체.)
 * npm run membership-events-pickforme 로 실행해주세요.
 *
 * 여기서 지급하게 되는 포인트는 DB에 저장된 픽포미 체험단 이벤트 멤버쉽 상품의 포인트 값입니다.
 * 만약 해당 상품이 없으면 에러가 발생합니다.
 *
 * 멤버쉽 처리 후 스프레드시트의 해당 row의 멤버쉽 처리 여부 컬럼을 'o'로 업데이트합니다.
 *
 */

// 구글 API 인증 설정 (읽기/쓰기 권한 필요)
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.EVENTS_PICKFORME_TEST_CREDENTIALS,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

interface FormResponse {
  timestamp: string;
  name: string;
  phoneNumber: string;
  email: string;
  membershipProcessed: string;
  rowIndex: number; // 스프레드시트에서의 실제 row 인덱스 (헤더 제외)
  activityStarted: string; // L컬럼: 활동시작여부 ('o'인 경우만 선택 처리 가능)
}

const processedUsers: Array<{
  name: string;
  email: string;
  status: string;
  action: string;
  previousEventId?: number;
  previousMembershipAt?: Date;
  previousExpiresAt?: Date;
  newExpiresAt?: Date;
}> = [];

export const membershipChangedUsers: Array<{
  userId: string;
  email: string;
  username: string;
  action: string;
  previousEventId?: number;
  previousMembershipAt?: Date;
  previousExpiresAt?: Date;
  newExpiresAt?: Date;
}> = [];

export async function processUser(
  response: FormResponse,
  eventRewards: EventMembershipProductReward,
  sheets: any,
  spreadsheetId: string,
  dryRun: boolean
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
        MembershipExpiresAt: 1,
        point: 1,
        aiPoint: 1,
        email: 1,
        phone: 1,
        currentMembershipProductId: 1,
      }
    );

    if (!user) {
      console.log(
        `유저 ${response.name}을 찾을 수 없습니다. phone: ${normalizedPhoneNumber} or email: ${response.email}`
      );
      return;
    }

    if (response.membershipProcessed === 'o' || user.event === EVENT_IDS.PICKFORME_TEST) {
      console.log(`유저 ${response.name} 이미 처리되었습니다.`);
      return;
    }

    const testGroupExpirationDate = new Date();
    testGroupExpirationDate.setMonth(testGroupExpirationDate.getMonth() + 3);

    let shouldApply = false;
    let action = '';
    let previousEventId = await user.getCurrentEventId();
    let previousMembershipAt = user.MembershipAt;
    let previousExpiresAt = user.MembershipExpiresAt;
    let newExpiresAt: Date | undefined;

    // 1. 멤버십이 아예 없는 경우 -> 바로 적용
    if (!user.MembershipAt || !user.MembershipExpiresAt) {
      shouldApply = true;
      action = '멤버십 없음 - 바로 적용';
      newExpiresAt = testGroupExpirationDate;
    }
    // 2. 일반 멤버십 적용 중인 경우 -> 바로 적용
    else if (!previousEventId) {
      shouldApply = true;
      action = '일반 멤버십 중 - 바로 적용';
      newExpiresAt = testGroupExpirationDate;
    }
    // 3. 이벤트 멤버십 적용 중인 경우 -> MembershipExpiresAt과 비교해서 더 긴 쪽 적용
    else if (previousEventId) {
      const currentExpiresAt = new Date(user.MembershipExpiresAt);

      if (testGroupExpirationDate > currentExpiresAt) {
        shouldApply = true;
        action = `이벤트 멤버십 중 - 기존 만료일(${currentExpiresAt.toISOString().split('T')[0]})보다 긴 기간으로 적용`;
        newExpiresAt = testGroupExpirationDate;
      } else {
        shouldApply = false;
        action = `이벤트 멤버십 중 - 기존 만료일(${currentExpiresAt.toISOString().split('T')[0]})이 더 김. 적용하지 않음`;
      }
    }

    if (shouldApply) {
      console.log(`유저 ${response.name}: ${response.email} - ${action}`);

      if (dryRun) {
        console.log('[DRY RUN] 이벤트 멤버십 적용 생략');
      } else {
        await user.applyEventMembershipRewards(eventRewards);
        // 만료일을 더 긴 쪽으로 설정
        if (newExpiresAt && user.MembershipExpiresAt && newExpiresAt > user.MembershipExpiresAt) {
          user.MembershipExpiresAt = newExpiresAt;
          await user.save();
        }
      }

      processedUsers.push({
        name: response.name,
        email: response.email,
        status: '적용됨',
        action,
        previousEventId: previousEventId || undefined,
        previousMembershipAt: previousMembershipAt || undefined,
        previousExpiresAt: previousExpiresAt || undefined,
        newExpiresAt,
      });

      // 멤버십이 변경된 유저들을 별도로 추적 (기존 멤버십이 있던 경우만)
      if (previousMembershipAt && previousExpiresAt) {
        membershipChangedUsers.push({
          userId: user._id.toString(),
          email: response.email,
          username: response.name,
          action,
          previousEventId: previousEventId || undefined,
          previousMembershipAt: previousMembershipAt || undefined,
          previousExpiresAt: previousExpiresAt || undefined,
          newExpiresAt,
        });
      }
    } else {
      console.log(`유저 ${response.name}: ${response.email} - ${action}`);

      processedUsers.push({
        name: response.name,
        email: response.email,
        status: '적용 안됨',
        action,
        previousEventId: previousEventId || undefined,
        previousMembershipAt: previousMembershipAt || undefined,
        previousExpiresAt: previousExpiresAt || undefined,
      });
    }

    // 스프레드시트의 해당 row의 멤버쉽 처리 여부 컬럼을 'o'로 업데이트 (적용된 경우에만)
    if (shouldApply) {
      const updateRange = `설문지 응답 시트1!K${response.rowIndex + 2}`;

      if (dryRun) {
        console.log(`[DRY RUN] Sheets 업데이트 생략 → range=${updateRange}, value='o'`);
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: updateRange,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['o']],
          },
        });
      }

      console.log(
        `유저 ${response.name} userId ${user._id} 처리 완료 및 스프레드시트 업데이트 완료`
      );
    } else {
      console.log(`유저 ${response.name} userId ${user._id} 처리 완료 (적용 안됨)`);
    }
  } catch (error) {
    console.error(`유저 ${response.email} 처리 중 오류 발생:`, error);
    throw error;
  }
}

async function main() {
  try {
    // 실행 옵션: 활동시작여부가 'o'인 대상만 처리
    const withSelected =
      process.env.WITH_SELECTED === 'true' || process.argv.includes('--withSelected');

    // 실행 옵션: DRY RUN 모드 (실제 변경 없이 로그만)
    const dryRun = process.env.DRY_RUN === 'true' || process.argv.includes('--dryRun');
    if (dryRun) {
      console.log('[DRY RUN] 실제 DB/시트 변경 없이 시뮬레이션만 진행합니다.');
    }

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
    const formResponses = rows.slice(1).map((row: string[], index: number) => ({
      timestamp: row[0],
      name: row[2], // 이름은 C컬럼 (인덱스 2)
      email: row[4], // 이메일은 E컬럼 (인덱스 4)
      phoneNumber: row[3], // 전화번호는 D컬럼 (인덱스 3)
      membershipProcessed: row[10], // 멤버쉽 지급여부는 K컬럼 (인덱스 10)
      rowIndex: index, // 0-based index (헤더 제외)
      activityStarted: row[11], // 활동시작여부는 L컬럼 (인덱스 11)
    }));

    const filteredResponses = withSelected
      ? formResponses.filter((r) => r.activityStarted === 'o')
      : formResponses;

    console.log(
      `총 응답: ${formResponses.length}, 처리 대상(withSelected=${withSelected}): ${filteredResponses.length}`
    );

    const eventProducts = await db.Product.findOne({
      eventId: EVENT_IDS.PICKFORME_TEST,
    });

    if (!eventProducts) {
      console.log('No event products found');
      return;
    }

    const eventRewards = eventProducts.getEventRewards();

    // 각 응답 처리
    for (const response of filteredResponses) {
      await processUser(response, eventRewards, sheets, spreadsheetId, dryRun);
      console.log('===============================================');
    }

    // 처리 결과 요약 출력
    console.log('\n=== 처리 결과 요약 ===');
    console.log(`총 처리된 유저: ${processedUsers.length}`);

    const appliedUsers = processedUsers.filter((u) => u.status === '적용됨');
    const notAppliedUsers = processedUsers.filter((u) => u.status === '적용 안됨');

    console.log(`이벤트 적용됨: ${appliedUsers.length}명`);
    console.log(`이벤트 적용 안됨: ${notAppliedUsers.length}명`);
    console.log(`멤버십 변경됨: ${membershipChangedUsers.length}명`);

    console.log('\n=== 적용된 유저 목록 ===');
    appliedUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  액션: ${user.action}`);
      if (user.previousEventId) {
        console.log(`  이전 이벤트: ${user.previousEventId}`);
      }
      if (user.previousExpiresAt) {
        console.log(`  이전 만료일: ${user.previousExpiresAt.toISOString().split('T')[0]}`);
      }
      if (user.newExpiresAt) {
        console.log(`  새로운 만료일: ${user.newExpiresAt.toISOString().split('T')[0]}`);
      }
      console.log('');
    });

    console.log('\n=== 적용 안된 유저 목록 ===');
    notAppliedUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  사유: ${user.action}`);
      if (user.previousEventId) {
        console.log(`  이전 이벤트: ${user.previousEventId}`);
      }
      if (user.previousExpiresAt) {
        console.log(`  현재 만료일: ${user.previousExpiresAt.toISOString().split('T')[0]}`);
      }
      console.log('');
    });

    console.log('\n=== 멤버십 변경된 유저 목록 ===');
    membershipChangedUsers.forEach((user) => {
      console.log(`- ${user.username} (${user.email}) - ID: ${user.userId}`);
      console.log(`  액션: ${user.action}`);
      if (user.previousEventId) {
        console.log(`  이전 이벤트: ${user.previousEventId}`);
      }
      if (user.previousExpiresAt) {
        console.log(`  이전 만료일: ${user.previousExpiresAt.toISOString().split('T')[0]}`);
      }
      if (user.newExpiresAt) {
        console.log(`  새로운 만료일: ${user.newExpiresAt.toISOString().split('T')[0]}`);
      }
      console.log('');
    });

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
