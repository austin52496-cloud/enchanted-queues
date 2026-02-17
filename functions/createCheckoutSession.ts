import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json();
    const appUrl = body.appUrl;
    const billingCycle = body.billingCycle || "monthly";

    // Get current pricing from database
    const configs = await base44.asServiceRole.entities.PricingConfig.list();
    const activeConfig = configs.find(c => c.is_active) || configs[0];
    
    const priceId = billingCycle === "monthly" 
      ? (activeConfig?.stripe_monthly_price_id || "price_1Sy1F8LR9DTsVAQsBUKVgM2o")
      : (activeConfig?.stripe_yearly_price_id || "price_1Sy1F8LR9DTsVAQsBUKVgM2o");

    if (!appUrl) {
      return Response.json({ error: "Missing appUrl" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch (error) {
      console.log("Auth error (expected for public app):", error.message);
      user = null;
    }
    
    if (!user) {
      console.log("No user - requiring login");
      return Response.json({ error: "Unauthorized", requiresLogin: true }, { status: 401 });
    }

    console.log("Creating checkout for user:", user.email);
    console.log("User object:", { email: user.email, id: user.id, role: user.role });

    // Check if user already has an active premium subscription
    const existingSubs = await base44.entities.Subscription.filter({ 
      user_email: user.email,
      plan: "premium"
    });
    
    if (existingSubs.length > 0 && existingSubs[0].status === "active") {
      console.log("User already has active premium");
      return Response.json({ 
        error: "User already has an active premium subscription" 
      }, { status: 400 });
    }

    // Create Stripe customer
    console.log("Creating Stripe customer for:", user.email);
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name || user.email,
      metadata: {
        base44_user_id: user.id
      }
    });
    const stripeCustomerId = customer.id;
    console.log("Created Stripe customer:", stripeCustomerId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/#/Success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#/Premium`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        user_id: user.id
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});