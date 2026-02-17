import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'Weather API key not configured' }, { status: 500 });
    }

    // Lake Buena Vista, Florida coordinates
    const lat = 28.3772;
    const lon = -81.5707;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API error:', response.status, errorText);
      return Response.json({ error: 'Failed to fetch weather data', details: errorText }, { status: response.status });
    }

    const data = await response.json();

    return Response.json({
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      icon: data.weather[0].icon
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});