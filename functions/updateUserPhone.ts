import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number } = await req.json();

    // Validate phone format if provided
    if (phone_number && !/^\+[1-9]\d{1,14}$/.test(phone_number)) {
      return Response.json({ error: 'Invalid phone format. Use E.164 format (e.g., +12025551234)' }, { status: 400 });
    }

    // Update user's phone number
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, { phone_number: phone_number || null });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating phone:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});