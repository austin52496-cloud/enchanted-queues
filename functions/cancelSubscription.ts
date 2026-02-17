import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's subscription
    const subscriptions = await base44.entities.Subscription.filter({
      user_email: user.email,
      plan: "premium"
    });

    if (subscriptions.length === 0) {
      return Response.json({ error: "No premium subscription found" }, { status: 404 });
    }

    const subscription = subscriptions[0];

    if (subscription.status === "cancelled") {
      return Response.json({ error: "Subscription already cancelled" }, { status: 400 });
    }

    // Cancel Stripe subscription if it exists
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        console.log("Cancelled Stripe subscription:", subscription.stripe_subscription_id);
      } catch (error) {
        console.error("Error cancelling Stripe subscription:", error);
        // Continue even if Stripe cancellation fails - we'll update local record
      }
    }

    // Update local subscription record
    await base44.entities.Subscription.update(subscription.id, {
      status: "cancelled"
    });

    console.log("Cancelled subscription for:", user.email);

    return Response.json({ 
      success: true,
      message: "Premium subscription cancelled"
    });

  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});