import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verify admin access
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userEmail, plan, status, hasBilling, expiresAt } = await req.json();

    if (!userEmail || !plan || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch existing subscriptions using service role
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });

    const subscriptionData = {
      plan,
      status,
      billing_cycle: plan === 'premium' ? (hasBilling ? 'annual' : null) : null,
      auto_renew: hasBilling ? true : false,
      expires_at: expiresAt || (plan === 'premium' && !expiresAt ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null)
    };

    let subscription;
    if (existingSubs.length > 0) {
      // Update existing subscription
      subscription = await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
    } else {
      // Create new subscription
      subscription = await base44.asServiceRole.entities.Subscription.create({
        user_email: userEmail,
        ...subscriptionData
      });
    }

    return Response.json({ success: true, subscription });
  } catch (error) {
    console.error('Admin subscription error:', error);
    return Response.json({ error: error.message || 'Failed to update subscription' }, { status: 500 });
  }
});