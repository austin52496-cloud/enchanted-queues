import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name } = await req.json();

    if (!full_name || !full_name.trim()) {
      return Response.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // Update user's full name via service role with user's ID
    await base44.asServiceRole.entities.User.update(user.id, { full_name: full_name.trim() });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating name:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});