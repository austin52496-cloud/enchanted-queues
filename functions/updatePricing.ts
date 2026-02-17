import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { monthlyPrice, yearlyPrice, productId } = await req.json();

    if (!monthlyPrice || !yearlyPrice || !productId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new Stripe price objects (Stripe prices are immutable)
    const monthlyStripePrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(monthlyPrice * 100),
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    const yearlyStripePrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(yearlyPrice * 100),
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    // Update or create pricing config
    const configs = await base44.asServiceRole.entities.PricingConfig.list();
    const activeConfig = configs.find(c => c.is_active);

    if (activeConfig) {
      await base44.asServiceRole.entities.PricingConfig.update(activeConfig.id, {
        monthly_price: monthlyPrice,
        yearly_price: yearlyPrice,
        stripe_monthly_price_id: monthlyStripePrice.id,
        stripe_yearly_price_id: yearlyStripePrice.id,
      });
    } else {
      await base44.asServiceRole.entities.PricingConfig.create({
        monthly_price: monthlyPrice,
        yearly_price: yearlyPrice,
        stripe_monthly_price_id: monthlyStripePrice.id,
        stripe_yearly_price_id: yearlyStripePrice.id,
        is_active: true,
      });
    }

    return Response.json({
      success: true,
      monthlyPriceId: monthlyStripePrice.id,
      yearlyPriceId: yearlyStripePrice.id,
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});