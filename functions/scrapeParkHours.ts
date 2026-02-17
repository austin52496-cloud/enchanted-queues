import { createClient } from "npm:@base44/sdk@0.8.6";

const base44 = createClient();

Deno.serve(async (req) => {
  try {
    // Scrape park hours from Queue-Times API
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
    
    let updatedCount = 0;
    
    // Process each Disney park
    for (const park of disneyCompany.parks || []) {
      try {
        // Fetch calendar/schedule for this park
        const calendarResponse = await fetch(`https://queue-times.com/parks/${park.id}.json`);
        const calendarData = await calendarResponse.json();
        
        // Find matching park in our database
        const existingParks = await sdk.entities.Park.filter({ 
          name: park.name 
        });
        
        if (existingParks.length === 0) {
          console.log(`Park not found in database: ${park.name}`);
          continue;
        }
        
        const ourPark = existingParks[0];
        
        // Extract today's operating hours
        if (calendarData.schedule && Array.isArray(calendarData.schedule)) {
          const today = new Date().toISOString().split('T')[0];
          const todaySchedule = calendarData.schedule.find(day => 
            day.date === today
          );
          
          if (todaySchedule && todaySchedule.opening_time && todaySchedule.closing_time) {
            // Format times
            const opens = new Date(`${today}T${todaySchedule.opening_time}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            const closes = new Date(`${today}T${todaySchedule.closing_time}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            await sdk.entities.Park.update(ourPark.id, {
              operating_hours: `${opens} - ${closes}`
            });
            
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing park ${park.name}:`, error);
      }
    }
    
    return Response.json({
      success: true,
      message: `Updated operating hours for ${updatedCount} parks`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error scraping park hours:", error);
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});