import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch (error) {
      user = null;
    }
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription to find Stripe customer ID
    const subscriptions = await base44.entities.Subscription.filter({
      user_email: user.email,
      plan: "premium"
    });

    if (!subscriptions.length || !subscriptions[0].stripe_customer_id) {
      return Response.json({ invoices: [] });
    }

    const stripe_customer_id = subscriptions[0].stripe_customer_id;

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: stripe_customer_id,
      limit: 50
    });

    // Format invoice data
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      date: new Date(invoice.created * 1000).toLocaleDateString(),
      amount: (invoice.amount_paid / 100).toFixed(2),
      status: invoice.status,
      paid: invoice.paid,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url
    }));

    return Response.json({ invoices: formattedInvoices });

  } catch (error) {
    console.error("Error fetching invoices:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});