import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false }, { status: 401 });
    }

    // Update user's last_login timestamp
    await base44.auth.updateMe({
      last_login: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Track login error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});