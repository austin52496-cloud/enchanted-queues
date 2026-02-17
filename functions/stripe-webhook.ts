import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    console.log("[WEBHOOK] Received webhook request");
    console.log("[WEBHOOK] Signature present:", !!signature);
    console.log("[WEBHOOK] Webhook secret present:", !!webhookSecret);

    if (!signature || !webhookSecret) {
      console.error("[WEBHOOK] Missing signature or secret");
      return Response.json({ error: "Missing signature or webhook secret" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Verify and construct the event
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("[WEBHOOK] Event signature verified");
    } catch (err) {
      console.error("[WEBHOOK] Signature verification failed:", err.message);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[WEBHOOK] Processing event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      const userId = session.metadata?.user_id;
      const stripeCustomerId = session.customer;

      console.log("[WEBHOOK] Session metadata:", JSON.stringify(session.metadata));
      console.log("[WEBHOOK] User email:", userEmail);
      console.log("[WEBHOOK] User ID:", userId);

      if (!userEmail || !userId) {
        console.error("[WEBHOOK] Missing user info in session metadata");
        return Response.json({ error: "Missing user info" }, { status: 400 });
      }

      // Get subscription details
      console.log("[WEBHOOK] Fetching subscription for customer:", stripeCustomerId);
      const subscription = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        limit: 1
      });

      if (subscription.data.length === 0) {
        console.error("[WEBHOOK] No subscription found for customer:", stripeCustomerId);
        return Response.json({ error: "No subscription found" }, { status: 400 });
      }

      console.log("[WEBHOOK] Found subscription:", subscription.data[0].id);

      const stripeSubscription = subscription.data[0];
      const expiresAt = new Date(stripeSubscription.current_period_end * 1000).toISOString();

      // Check if subscription record exists
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
        user_email: userEmail,
        plan: "premium"
      });

      if (existingSubs.length > 0) {
        // Update existing subscription
        console.log("[WEBHOOK] Updating existing subscription for:", userEmail);
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          status: "active",
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: stripeCustomerId,
          expires_at: expiresAt
        });
        console.log("[WEBHOOK] ✓ Updated subscription for:", userEmail);
      } else {
        // Create new subscription record
        console.log("[WEBHOOK] Creating new subscription for:", userEmail);
        await base44.asServiceRole.entities.Subscription.create({
          user_email: userEmail,
          plan: "premium",
          status: "active",
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscription.id,
          expires_at: expiresAt
        });
        console.log("[WEBHOOK] ✓ Created subscription for:", userEmail);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;

      // Find and update subscription record
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const userEmail = customer.email;

      if (userEmail) {
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
          user_email: userEmail,
          plan: "premium"
        });

        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: "cancelled"
          });
          console.log("Cancelled subscription for:", userEmail);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});