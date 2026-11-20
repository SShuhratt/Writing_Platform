import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consumeDailyEvaluationQuota,
  createBillingOrder,
  createPromoVoucher,
  FREE_DAILY_LIMIT,
  getAdminBillingOverview,
  getP2PPaymentInfo,
  redeemPromoVoucher,
  refundOrRevokeBillingOrder,
  resolveEffectivePlan,
  reviewBillingOrder,
} from '@/lib/billing-repository';

test('Concurrent consumeDailyEvaluationQuota calls obey FREE_DAILY_LIMIT atomically', async () => {
  const userId = `concurrent-quota-user-${Date.now()}`;
  const identifier = `user:${userId}`;

  const results = await Promise.all(
    Array.from({ length: 5 }, () => consumeDailyEvaluationQuota(identifier, userId, 'user'))
  );

  const allowedCount = results.filter((r) => r.allowed).length;
  const rejectedCount = results.filter((r) => !r.allowed).length;

  assert.equal(allowedCount, FREE_DAILY_LIMIT);
  assert.equal(rejectedCount, 5 - FREE_DAILY_LIMIT);
});

test('Concurrent redeemPromoVoucher calls enforce maxUses=1 and prevent single-user double use', async () => {
  const created = await createPromoVoucher({
    planCode: 'PRO_MONTHLY',
    maxUses: 1,
    durationDays: 30,
    createdBy: 'admin-test',
  });
  assert.ok(created.code);
  const code = created.code;

  const race = await Promise.all(
    Array.from({ length: 5 }, (_, idx) =>
      redeemPromoVoucher({ code, userId: `voucher-racer-${idx}-${Date.now()}` })
    )
  );
  const winners = race.filter((r) => r.success);
  assert.equal(winners.length, 1);

  // Multi-use voucher still rejects second redemption by the same user
  const multi = await createPromoVoucher({
    planCode: 'PRO_MONTHLY',
    maxUses: 5,
    durationDays: 30,
    createdBy: 'admin-test',
  });
  assert.ok(multi.code);

  const sameUserId = `single-redeemer-${Date.now()}`;
  const firstTry = await redeemPromoVoucher({ code: multi.code, userId: sameUserId });
  const secondTry = await redeemPromoVoucher({ code: multi.code, userId: sameUserId });
  assert.equal(firstTry.success, true);
  assert.equal(secondTry.success, false);
});

test('P2P guard, duplicate pending order prevention, overlapping entitlement extension, and single-currency KPI accuracy', async () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const prevCard = mutableEnv.BILLING_P2P_CARD_NUMBER;

  try {
    // 1. P2P fails cleanly when BILLING_P2P_CARD_NUMBER is unset
    delete mutableEnv.BILLING_P2P_CARD_NUMBER;
    assert.equal(getP2PPaymentInfo().configured, false);
    const rejectedNoCard = await createBillingOrder({
      userId: 'user-no-card',
      userEmail: 'nocard@example.com',
      planCode: 'PRO_MONTHLY',
      paymentMethod: 'card_p2p',
      receiptNote: '1234',
    });
    assert.equal(rejectedNoCard.success, false);

    // 2. Enable P2P card and verify single-currency ledger & duplicate pending guard
    mutableEnv.BILLING_P2P_CARD_NUMBER = '8600123456789012';
    assert.equal(getP2PPaymentInfo().configured, true);

    const stackUserId = `stack-user-${Date.now()}`;
    const order1 = await createBillingOrder({
      userId: stackUserId,
      userEmail: 'stack@example.com',
      planCode: 'PRO_MONTHLY',
      currency: 'UZS',
      paymentMethod: 'card_p2p',
      receiptNote: 'Paid 49,000 UZS',
    });
    assert.equal(order1.success, true);
    assert.equal(order1.order!.currency, 'UZS');
    assert.equal(order1.order!.amountPaid, order1.order!.amountUzs);

    // Duplicate pending order blocked
    const dupOrder = await createBillingOrder({
      userId: stackUserId,
      userEmail: 'stack@example.com',
      planCode: 'PRO_MONTHLY',
      currency: 'UZS',
      paymentMethod: 'card_p2p',
      receiptNote: 'Duplicate tap',
    });
    assert.equal(dupOrder.success, false);

    // Approve first monthly order (+30d)
    const approved1 = await reviewBillingOrder({
      orderId: order1.order!.id,
      action: 'APPROVE',
      reviewerId: 'admin-test',
    });
    assert.equal(approved1.success, true);
    const firstExpiresAt = approved1.entitlement!.expiresAt;

    // Submit & approve quarterly USD order (+90d should stack onto remaining ~30d -> ~120d)
    const order2 = await createBillingOrder({
      userId: stackUserId,
      userEmail: 'stack@example.com',
      planCode: 'PRO_QUARTERLY',
      currency: 'USD',
      paymentMethod: 'card_p2p',
      receiptNote: 'Paid $22 USD',
    });
    assert.equal(order2.success, true);
    assert.equal(order2.order!.currency, 'USD');
    assert.equal(order2.order!.amountPaid, order2.order!.amountUsd);

    const approved2 = await reviewBillingOrder({
      orderId: order2.order!.id,
      action: 'APPROVE',
      reviewerId: 'admin-test',
    });
    assert.equal(approved2.success, true);
    const secondExpiresAt = approved2.entitlement!.expiresAt;
    assert.ok(firstExpiresAt !== null && secondExpiresAt !== null);
    const daysStacked = (secondExpiresAt - Date.now()) / (24 * 60 * 60 * 1000);
    assert.ok(secondExpiresAt > firstExpiresAt);
    assert.ok(daysStacked >= 118, `Expected stacked duration >= 118 days, got ${daysStacked}`);

    // Admin overview separates UZS vs USD revenue cleanly
    const overview = await getAdminBillingOverview({ ordersLimit: 50 });
    assert.equal(overview.totalRevenueUzs, order1.order!.amountPaid);
    assert.equal(overview.totalRevenueUsd, order2.order!.amountPaid);

    // Refund & Revoke drops entitlement & decrements paid revenue
    const refunded = await refundOrRevokeBillingOrder({
      orderId: order2.order!.id,
      action: 'REFUND',
      reviewerId: 'admin-test',
    });
    assert.equal(refunded.success, true);
    assert.equal(refunded.order!.status, 'refunded');

    const overviewAfterRefund = await getAdminBillingOverview({ ordersLimit: 50 });
    assert.equal(overviewAfterRefund.totalRevenueUsd, 0);

    // Refund the monthly order too -> user returns to FREE
    await refundOrRevokeBillingOrder({
      orderId: order1.order!.id,
      action: 'REFUND',
      reviewerId: 'admin-test',
    });
    const planAfterAllRefunds = await resolveEffectivePlan(stackUserId, 'user');
    assert.equal(planAfterAllRefunds.planCode, 'FREE');
  } finally {
    if (prevCard !== undefined) mutableEnv.BILLING_P2P_CARD_NUMBER = prevCard;
    else delete mutableEnv.BILLING_P2P_CARD_NUMBER;
  }
});
