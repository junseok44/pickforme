import iap, { Receipt } from 'in-app-purchase';

const isProd = process.env.NODE_ENV === 'production';

if (
  !process.env.GOOGLE_SERVICE_ACCOUNT_PAYMENT_EMAIL ||
  !process.env.GOOGLE_SERVICE_ACCOUNT_PAYMENT_PRIVATE_KEY ||
  !process.env.APPLE_APP_SHARED_SECRET
) {
  throw new Error(
    'GOOGLE_SERVICE_ACCOUNT_PAYMENT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PAYMENT_PRIVATE_KEY is not set'
  );
}

// TODO: 이 부분 secret key 환경변수로 이전 필요.
iap.config({
  /* Configurations for Apple */
  appleExcludeOldTransactions: true,
  applePassword: process.env.APPLE_APP_SHARED_SECRET,
  googleServiceAccount: {
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_PAYMENT_EMAIL ?? '',
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PAYMENT_PRIVATE_KEY ?? '',
  },

  /* Configurations for Google Play */
  /*
  googlePublicKeyPath: 'path/to/public/key/directory/', // this is the path to the directory containing iap-sanbox/iap-live files
  googlePublicKeyStrSandBox: 'publicKeySandboxString', // this is the google iap-sandbox public key string
  googlePublicKeyStrLive: 'publicKeyLiveString', // this is the google iap-live public key string
  */
  // sandbox
  test: !isProd,
  // debug
  // verbose: true,
});

class IAPValidator {
  private initialized = iap.setup();

  public async validate(receipt: Receipt, productId: string) {
    await this.initialized;
    const validationResult = await iap
      .validate(receipt)
      .then(async (validatedData: any) => {
        const all = Array.isArray(validatedData.latest_receipt_info)
          ? validatedData.latest_receipt_info
          : [];

        // 1) 같은 productId 중 "최신" 건 고르기 (expires_date_ms > purchase_date_ms 우선)
        const pickTime = (x: any) => Number(x.expires_date_ms ?? x.purchase_date_ms ?? 0);
        const candidates = all.filter((x: any) => x.product_id === productId);
        if (candidates.length === 0) return null;

        const target = candidates.sort((a: any, b: any) => pickTime(b) - pickTime(a))[0];

        // 2) 환불되었는지 확인
        const canceledMs = Number(target.cancellation_date_ms ?? 0);
        const canceledStr = target.cancellation_date;
        if (canceledMs > 0 || canceledStr) return null;

        // 3) 만료 컷 (+ 그레이스 기간 예외)
        const now = Date.now();
        const expires = Number(target.expires_date_ms ?? 0);
        const grace = Number(target.grace_period_expires_date_ms ?? 0); // 없으면 0

        const effectivelyExpired = expires !== 0 && expires < now && (grace === 0 || grace < now);
        if (effectivelyExpired) return null;

        const options = {
          ignoreCanceled: true, // Apple ONLY: purchaseData will NOT contain cancceled items
          ignoreExpired: true, // purchaseData will NOT contain exipired subscription items
        };

        const purchaseDatas = iap.getPurchaseData(validatedData, options) ?? [];

        const matched = purchaseDatas.find((p: any) => {
          const sameProduct = p.productId === productId;
          const sameTxn =
            (p.originalTransactionId &&
              p.originalTransactionId == target.original_transaction_id) ||
            (p.transactionId && p.transactionId == target.transaction_id);
          return sameProduct && sameTxn;
        });

        if (matched) return matched;

        return {
          quantity: Number(target.quantity ?? 1),
          productId: target.product_id,
          transactionId: target.transaction_id,
          originalTransactionId: target.original_transaction_id,
          purchaseDate: target.purchase_date,
          purchaseDateMs: Number(target.purchase_date_ms ?? 0),
          expirationDate: Number(target.expires_date_ms ?? 0) || 0,
          isTrial: String(target.is_trial_period ?? 'false') === 'true',
          bundleId: validatedData?.receipt?.bundle_id,
        };
      })
      .catch((err) => {
        console.log(err);
        throw new Error(err);
      });

    return validationResult;
  }
}

// {
// quantity: 1,
// productId: 'pickforme__plus',
// transactionId: '480002608038237',
// originalTransactionId: '480002608038237',
// purchaseDate: '2025-08-07 03:50:40 Etc/GMT',
// purchaseDateMs: 1754538640000,
// purchaseDatePst: '2025-08-06 20:50:40 America/Los_Angeles',
// originalPurchaseDate: '2025-08-07 03:50:40 Etc/GMT',
// originalPurchaseDateMs: 1754538640000,
// originalPurchaseDatePst: '2025-08-06 20:50:40 America/Los_Angeles',
// isTrialPeriod: 'false',
// inAppOwnershipType: 'PURCHASED',
// isTrial: false,
// bundleId: 'com.sigonggan.pickforme',
// expirationDate: 0
// }

const iapValidator = new IAPValidator();

export default iapValidator;
