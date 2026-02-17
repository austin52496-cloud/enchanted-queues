import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (!['user', 'admin'].includes(role)) {
      return Response.json({ error: 'Invalid role. Must be "user" or "admin"' }, { status: 400 });
    }

    // Update user role
    await base44.asServiceRole.entities.User.update(userId, { role });

    console.log(`[ADMIN] Updated user ${userId} role to ${role}`);

    return Response.json({ success: true });

  } catch (error) {
    console.error('[ADMIN] Error updating user role:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});