import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    // Import rides from Queue-Times API
    const base44 = createClientFromRequest(req);
    const sdk = base44.asServiceRole;
    
    // Fetch parks data from Queue-Times API
    const response = await fetch("https://queue-times.com/parks.json");
    const allParks = await response.json();
    
    // Find Disney parks
    const disneyCompany = allParks.find((company) => 
      company.name?.toLowerCase().includes("disney")
    );
    
    if (!disneyCompany) {
      return Response.json({ 
        error: "Disney parks not found in Queue-Times API"
      });
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Filter to only Disney World parks (Florida)
    const worldParks = (disneyCompany.parks || []).filter(p => {
      const name = p.name.toLowerCase();
      return (name.includes("magic kingdom") || name.includes("epcot") || 
              name.includes("hollywood studios") || name.includes("animal kingdom")) &&
             !name.includes("paris") && !name.includes("tokyo") && !name.includes("hong kong") && 
             !name.includes("shanghai");
    });
    
    console.log(`📋 Processing ${worldParks.length} Disney World parks:`, worldParks.map(p => `${p.name} (ID: ${p.id})`));
    
    // Process each Disney park
    for (const park of worldParks) {
      try {
        // Fetch detailed park data with rides
        const parkResponse = await fetch(`https://queue-times.com/parks/${park.id}/queue_times.json`);
        const parkData = await parkResponse.json();
        
        // Find matching park in our database by name (fuzzy matching)
        const allParks = await sdk.entities.Park.list();
        
        console.log(`🔍 Looking for park: ${park.name} (ID: ${park.id})`);
        
        const ourPark = allParks.find(p => {
          const pName = p.name.toLowerCase().replace(/\s+/g, '').replace(/['-]/g, '');
          const apiName = park.name.toLowerCase().replace(/\s+/g, '').replace(/['-]/g, '');
          const slug = p.slug ? p.slug.toLowerCase() : '';
          
          console.log(`  Comparing API: "${apiName}" (${park.name}) with DB: "${pName}" (${p.name}) slug: "${slug}"`);
          
          // Specific park mappings - check both slug and name
          if ((apiName === 'disneymagickingdom' || apiName === 'magickingdom') && 
              (pName === 'magickingdom' || slug === 'magic-kingdom')) {
            return true;
          }
          if ((apiName === 'disneyhollywoodstudios' || apiName === 'hollywoodstudios') && 
              (pName === 'hollywoodstudios' || slug === 'hollywood-studios')) {
            return true;
          }
          if ((apiName === 'epcot' || apiName === 'disneyepcot') && 
              (pName === 'epcot' || slug === 'epcot')) {
            return true;
          }
          if ((apiName === 'animalkingdom' || apiName === 'disneyanimalkingdom') && 
              (pName === 'animalkingdom' || slug === 'animal-kingdom')) {
            return true;
          }
          if ((apiName === 'disneycaliforniaadventure' || apiName === 'californiaadventure') && 
              (pName === 'disneycaliforniaadventure' || slug === 'california-adventure')) {
            return true;
          }
          if ((apiName === 'disneyland' || apiName === 'disneylandpark') && 
              (pName === 'disneylandpark' || slug === 'disneyland')) {
            return true;
          }
              
          return false;
        });
        
        if (!ourPark) {
          console.log(`❌ Park not found in database: ${park.name}`);
          continue;
        }
        
        console.log(`✅ Processing park: ${ourPark.name} (matched to API: ${park.name})`);
        
        // Process rides from each land
        if (parkData.lands && Array.isArray(parkData.lands)) {
          for (const land of parkData.lands) {
            if (!land.rides || !Array.isArray(land.rides)) continue;
            
            for (const ride of land.rides) {
              // Skip attractions without posted wait times (walk-throughs, viewing experiences, galleries, meet & greets)
              const rideName = ride.name.toLowerCase();
              const isWalkThrough = rideName.includes("treehouse") || 
                                   rideName.includes("castle") || 
                                   rideName.includes("tiki room") ||
                                   rideName.includes("enchanted tiki") ||
                                   rideName.includes("swiss family") ||
                                   rideName.includes("walt disney") && rideName.includes("presents") ||
                                   rideName.includes("tom sawyer island") ||
                                   rideName.includes("gallery") ||
                                   rideName.includes("exhibit") ||
                                   rideName.includes("meet ") ||
                                   rideName.includes("greet") ||
                                   rideName.includes("single rider");
              
              if (isWalkThrough) {
                skippedCount++;
                continue;
              }
              
              // Check if ride already exists - if so, update it instead of skipping
              const existingRides = await sdk.entities.Ride.filter({
                park_id: ourPark.id,
                name: ride.name
              });
              
              if (existingRides.length > 0) {
                // Update existing ride with fresh data from API
                const currentWait = ride.wait_time || existingRides[0].current_wait_minutes || 0;
                await sdk.entities.Ride.update(existingRides[0].id, {
                  height_requirement: ride.meta?.min_height_cm ? `${ride.meta.min_height_cm} cm` : null,
                  is_open: ride.is_open !== false,
                  has_lightning_lane: ride.is_lightning_lane || false,
                  land: land.name || existingRides[0].land,
                  current_wait_minutes: currentWait,
                  avg_wait_minutes: existingRides[0].avg_wait_minutes || currentWait || 30,
                  peak_wait_minutes: existingRides[0].peak_wait_minutes || (currentWait * 2) || 60,
                  last_updated: new Date().toISOString()
                });
                skippedCount++;
                continue;
              }
              
              // Determine ride type based on name/category
              let rideType = "family";
              if (rideName.includes("mountain") || rideName.includes("coaster") || 
                  rideName.includes("tower") || rideName.includes("rocket") ||
                  rideName.includes("tron") || rideName.includes("guardians") ||
                  rideName.includes("runaway railway")) {
                rideType = "thrill";
              } else if (rideName.includes("water") || rideName.includes("splash") || rideName.includes("kali")) {
                rideType = "water";
              } else if (rideName.includes("show") || rideName.includes("theater")) {
                rideType = "show";
              } else if (rideName.includes("spinner") || rideName.includes("teacup") || rideName.includes("dumbo")) {
                rideType = "spinner";
              } else if (rideName.includes("haunted") || rideName.includes("pirates") || 
                         rideName.includes("small world") || rideName.includes("buzz")) {
                rideType = "dark_ride";
              }
              
              // Create new ride
              await sdk.entities.Ride.create({
                name: ride.name,
                park_id: ourPark.id,
                park_name: ourPark.name,
                land: land.name || "Unknown",
                type: rideType,
                is_open: ride.is_open !== false,
                current_wait_minutes: ride.wait_time || 0,
                avg_wait_minutes: ride.wait_time || 30,
                peak_wait_minutes: (ride.wait_time || 30) * 2,
                has_lightning_lane: ride.is_lightning_lane || false,
                height_requirement: ride.meta?.min_height_cm ? `${ride.meta.min_height_cm} cm` : null,
                last_updated: new Date().toISOString()
              });
              
              createdCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing park ${park.name}:`, error);
      }
    }
    
    return Response.json({
      success: true,
      message: `Created ${createdCount} new rides, skipped ${skippedCount} existing rides`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error importing rides:", error);
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});