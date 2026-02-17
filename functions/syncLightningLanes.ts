import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch parks data from Queue-Times API
    const response = await fetch("https://queue-times.com/parks.json");
    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch Queue-Times data' }, { status: response.status });
    }
    
    const queueTimesData = await response.json();
    const disneyCompany = queueTimesData.find((company) => 
      company.name?.toLowerCase().includes("disney")
    );
    
    if (!disneyCompany || !disneyCompany.parks) {
      return Response.json({ error: "Disney parks not found" }, { status: 404 });
    }

    const allDbParks = await base44.asServiceRole.entities.Park.list();
    const updates = [];

    // Process each Disney park
    for (const apiPark of disneyCompany.parks) {
      const parkResponse = await fetch(`https://queue-times.com/parks/${apiPark.id}/queue_times.json`);
      if (!parkResponse.ok) continue;
      
      const parkData = await parkResponse.json();
      
      // Find matching park in our database
      let ourPark = allDbParks.find(p => {
        const pName = p.name.toLowerCase().replace(/\s+/g, '');
        const apiName = apiPark.name.toLowerCase().replace(/\s+/g, '');
        if (pName === apiName) return true;
        if (pName.includes('magickingdom') && apiName.includes('magic')) return true;
        if (pName.includes('hollywood') && apiName.includes('hollywood')) return true;
        if (pName.includes('epcot') && apiName.includes('epcot')) return true;
        if (pName.includes('animalkingdom') && apiName.includes('animal')) return true;
        return false;
      });
      
      if (!ourPark || !parkData.lands) continue;

      // Process rides from this park
      for (const land of parkData.lands) {
        if (!land.rides || !Array.isArray(land.rides)) continue;
        
        for (const apiRide of land.rides) {
          // Check if this ride has return times (Lightning Lane)
          if (!apiRide.return_start || !apiRide.return_end) continue;
          
          // Find matching ride in our database
          const ourRides = await base44.asServiceRole.entities.Ride.filter({
            park_id: ourPark.id,
            name: apiRide.name,
            has_lightning_lane: true
          });
          
          if (ourRides.length === 0) continue;
          const ourRide = ourRides[0];
          
          // Use actual Lightning Lane return time from API
          const returnStart = apiRide.return_start;
          const returnEnd = apiRide.return_end;
          const windows = [];
          
          if (!returnStart) continue;
          
          // Add the actual return window from the API
          windows.push({
            time: `${returnStart} - ${returnEnd}`,
            available: true
          });
          
          // Only update if we have windows
          if (windows.length > 0) {
            await base44.asServiceRole.entities.Ride.update(ourRide.id, {
              lightning_lane_times: windows
            });
            
            updates.push({ ride: ourRide.name, windows: windows.length });
          }
        }
      }
    }

    return Response.json({
      success: true,
      updated: updates.length,
      rides: updates
    });
  } catch (error) {
    console.error('Lightning Lane sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});