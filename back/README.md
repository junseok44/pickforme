## Backend

### Installation

```bash
cd back
npm install
```

### Run server

- Dev

```bash
npm run dev
```

- Prod

```bash
npm start
```

- PM2

```bash
npm run pm2
or
pm2 run pm2.json
```

### 한시련 멤버십 스크립트 실행

한시련 이벤트 신청자 멤버십 처리를 위한 스크립트 실행 방법:

1. 준비사항

   - `back/credentials` 폴더에 `hansiryun_service_key.json` 파일 추가
     (노션 픽포미 개발문서 > .env 파일 참고)
   - `.env` 파일이 루트 디렉토리에 있는지 확인.
     (노션 픽포미 개발문서 > .env의 production env)
   - mongodb atlas -> security -> network access에 본인의 ip주소가 추가되어 있는지 확인.

2. 스크립트 실행

```bash
npm run process-hansiryun
```

이후 출력된 로그를 확인하면서 잘 처리되었는지 확인.

⚠️ 주의 및 참고사항:

1. 한시련 이벤트 번호(1번)나 지급 포인트(30, 9999)가 변경될 경우,
   DB에 저장된 products 모델에서 productId가 pickforme_hansiryun_event_membership 인 상품의
   eventId나 point, aiPoint를 수정해주면 됩니다.
