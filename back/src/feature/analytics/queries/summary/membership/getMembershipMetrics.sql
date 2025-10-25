-- @target_date를 기준으로 멤버십 관련 모든 지표를 계산합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  WITH membership_users AS (
    SELECT DISTINCT userId
    FROM {{- FOUNDATION_DATASET -}}.purchases
    WHERE type = 1  -- SUBSCRIPTION 타입
      AND isExpired = false
  ),
  membership_repeat_users AS (
    SELECT userId, COUNT(*) as purchase_count
    FROM {{- FOUNDATION_DATASET -}}.purchases
    WHERE type = 1  -- SUBSCRIPTION 타입
    GROUP BY userId
    HAVING purchase_count >= 2
  ),
  total_users AS (
    SELECT COUNT(*) as total_count
    FROM {{- FOUNDATION_DATASET -}}.users
  ),
  -- 오늘부터 한달전까지의 구매기록 (재결제 판단 대상)
  current_month_purchases AS (
    SELECT 
      userId,
      createdAt,
      -- 각 구매에 대해 이전 30일 내에 재결제가 있었는지 확인
      LAG(createdAt) OVER (PARTITION BY userId ORDER BY createdAt) as prev_purchase_date
    FROM {{- FOUNDATION_DATASET -}}.purchases
    WHERE type = 1  -- SUBSCRIPTION 타입
      AND DATE(createdAt) >= DATE_SUB(DATE(@target_date), INTERVAL 30 DAY)
      AND DATE(createdAt) < DATE(@target_date)
  ),
  -- 재결제가 있었던 유저들 (이전 구매로부터 30일 이내에 재결제)
  users_with_renewal AS (
    SELECT DISTINCT userId
    FROM current_month_purchases
    WHERE prev_purchase_date IS NOT NULL
      AND DATE_DIFF(DATE(createdAt), DATE(prev_purchase_date), DAY) <= 30
  ),
  -- 이전 달 구매 유저들 (비교 기준)
  previous_month_purchases AS (
    SELECT DISTINCT userId
    FROM {{- FOUNDATION_DATASET -}}.purchases
    WHERE type = 1  -- SUBSCRIPTION 타입
      AND DATE(createdAt) >= DATE_SUB(DATE(@target_date), INTERVAL 60 DAY)
      AND DATE(createdAt) < DATE_SUB(DATE(@target_date), INTERVAL 30 DAY)
  ),
  monthly_membership_purchases AS (
    SELECT COUNT(*) as monthly_count
    FROM {{- FOUNDATION_DATASET -}}.purchases
    WHERE type = 1  -- SUBSCRIPTION 타입
      AND DATE(createdAt) >= DATE_SUB(DATE(@target_date), INTERVAL 30 DAY)
      AND DATE(createdAt) < DATE(@target_date)
  ),
  previous_monthly_membership_purchases AS (
    SELECT COUNT(*) as previous_monthly_count
    FROM {{- FOUNDATION_DATASET -}}.purchases
    WHERE type = 1  -- SUBSCRIPTION 타입
      AND DATE(createdAt) >= DATE_SUB(DATE(@target_date), INTERVAL 60 DAY)
      AND DATE(createdAt) < DATE_SUB(DATE(@target_date), INTERVAL 30 DAY)
  )

  SELECT
    DATE(@target_date) AS date,
    
    -- 멤버십 유저 비율
    SAFE_DIVIDE((SELECT COUNT(*) FROM membership_users), (SELECT total_count FROM total_users)) AS membershipUserRatio,
    
    -- 멤버십 재결제 유저 비율
    SAFE_DIVIDE((SELECT COUNT(*) FROM membership_repeat_users), (SELECT total_count FROM total_users)) AS repeatMembershipUserRatio,

    -- 멤버십 유지율 (재결제 유저 비율)
    SAFE_DIVIDE(
      (SELECT COUNT(*) FROM users_with_renewal),
      (SELECT COUNT(*) FROM previous_month_purchases)
    ) AS membershipRetentionRate,
    
    -- 전체 유저 수
    (SELECT total_count FROM total_users) AS totalUsers,
    
    -- 멤버십 유저 수
    (SELECT COUNT(*) FROM membership_users) AS membershipUsers,
    
    -- 재결제 멤버십 유저 수
    (SELECT COUNT(*) FROM membership_repeat_users) AS repeatMembershipUsers,
    
    -- 이번 달 재결제 유저 수 (30일 이내 재결제)
    (SELECT COUNT(*) FROM users_with_renewal) AS currentMonthRenewalUsers,
    
    -- 이번 달 멤버십 구매 수
    (SELECT monthly_count FROM monthly_membership_purchases) AS monthlyMembershipPurchases,
    
    -- 지난 달 멤버십 구매 수
    (SELECT previous_monthly_count FROM previous_monthly_membership_purchases) AS previousMonthMembershipPurchases,
    
    -- 생성 시간
    CURRENT_TIMESTAMP() AS createdAt
) AS source
ON target.date = source.date
WHEN MATCHED THEN
  UPDATE SET
    membershipUserRatio = source.membershipUserRatio,
    repeatMembershipUserRatio = source.repeatMembershipUserRatio,
    membershipRetentionRate = source.membershipRetentionRate,
    totalUsers = source.totalUsers,
    membershipUsers = source.membershipUsers,
    repeatMembershipUsers = source.repeatMembershipUsers,
    currentMonthRenewalUsers = source.currentMonthRenewalUsers,
    monthlyMembershipPurchases = source.monthlyMembershipPurchases,
    previousMonthMembershipPurchases = source.previousMonthMembershipPurchases,
    createdAt = source.createdAt
WHEN NOT MATCHED THEN
  INSERT (date, membershipUserRatio, repeatMembershipUserRatio, membershipRetentionRate, totalUsers, membershipUsers, repeatMembershipUsers, currentMonthRenewalUsers, monthlyMembershipPurchases, previousMonthMembershipPurchases, createdAt)
  VALUES (source.date, source.membershipUserRatio, source.repeatMembershipUserRatio, source.membershipRetentionRate, source.totalUsers, source.membershipUsers, source.repeatMembershipUsers, source.currentMonthRenewalUsers, source.monthlyMembershipPurchases, source.previousMonthMembershipPurchases, source.createdAt);
