import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[PARK STATUS] Starting park status check');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get all parks
    const parks = await base44.asServiceRole.entities.Park.list();
    console.log(`[PARK STATUS] Checking ${parks.length} parks`);

    let parksUpdated = 0;
    let ridesUpdated = 0;

    for (const park of parks) {
      // Check if park has hours for today
      const todayHours = await base44.asServiceRole.entities.ParkHours.filter({
        park_id: park.id,
        date: todayStr
      });

      // If no hours found OR park is closed, mark all rides as closed with 0 wait
      const shouldClosePark = todayHours.length === 0 || todayHours[0]?.is_closed === true;
      
      if (shouldClosePark) {
        console.log(`[PARK STATUS] ${park.name} is closed today, marking all rides as closed`);
        const rides = await base44.asServiceRole.entities.Ride.filter({ park_id: park.id });
        
        for (const ride of rides) {
          if (ride.is_open !== false || ride.current_wait_minutes !== 0) {
            await base44.asServiceRole.entities.Ride.update(ride.id, {
              is_open: false,
              current_wait_minutes: 0
            });
            ridesUpdated++;
          }
        }
        
        console.log(`[PARK STATUS] Marked ${rides.length} rides as closed for ${park.name}`);
        parksUpdated++;
        continue;
      }

      // Park has hours and is not explicitly closed, so it's open
      console.log(`[PARK STATUS] ${park.name}: OPEN`);
      parksUpdated++;
    }

    console.log(`[PARK STATUS] Updated ${parksUpdated} parks, ${ridesUpdated} rides`);

    return Response.json({
      success: true,
      parks_checked: parks.length,
      parks_updated: parksUpdated,
      rides_updated: ridesUpdated
    });

  } catch (error) {
    console.error('[PARK STATUS] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});