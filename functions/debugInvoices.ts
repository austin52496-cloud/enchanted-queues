import Stripe from 'npm:stripe@16.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const invoices = await stripe.invoices.list({
      customer: "cus_TvxvxgsfmTMXAf",
      limit: 50
    });

    console.log("Found invoices:", invoices.data.length);
    invoices.data.forEach(inv => {
      console.log(`Invoice ${inv.number}: ${inv.amount_paid / 100} ${inv.currency.toUpperCase()}, status: ${inv.status}`);
    });

    return Response.json({ invoices: invoices.data });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});