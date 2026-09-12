import axios from 'axios';

export interface CurrentPlaceWeatherResult {
  lat: number;
  lng: number;
  locationName: string;
  condition: 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';
  conditionName: string;
  temp: number;
  windspeed: number;
  isDay: boolean;
  rainfallMm: number;
  icon: string;
}

export const parseWMOCodeToCondition = (code: number, isDay: boolean = true, rainfall: number = 0): {
  condition: 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';
  conditionName: string;
  icon: string;
} => {
  // Severe thunderstorm / cloudburst
  if ((code >= 95 && code <= 99) || rainfall >= 35) {
    return { condition: 'storm', conditionName: 'Severe Thunderstorm', icon: '⛈️' };
  }
  // Rain / showers / drizzle
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || rainfall >= 2) {
    return { condition: 'rain', conditionName: 'Monsoon Rain', icon: '🌧️' };
  }
  // Fog / mist
  if (code >= 45 && code <= 48) {
    return { condition: 'fog', conditionName: 'Mountain Fog & Mist', icon: '🌫️' };
  }
  // Overcast / heavy clouds
  if (code === 3 || code === 2) {
    return { condition: 'cloudy', conditionName: 'Overcast & Cloudy', icon: '☁️' };
  }
  // Clear or partly clear
  if (!isDay) {
    return { condition: 'night', conditionName: 'Clear Stargaze Night', icon: '🌙' };
  }
  return { condition: 'clear', conditionName: 'Sunny Clear Skies', icon: '☀️' };
};

/**
 * Automatically detects the user's current physical place coordinates & fetches live Open-Meteo weather
 */
export async function detectCurrentPlaceWeather(): Promise<CurrentPlaceWeatherResult> {
  let lat = 28.6139; // Default fallback: Delhi / Northern India
  let lng = 77.2090;
  let locationName = 'Local Region';

  // 1. Try Browser Geolocation first
  const getGeoPosition = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        return reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
          });
        },
        err => reject(err),
        { timeout: 5000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    });
  };

  try {
    const coords = await getGeoPosition();
    lat = coords.lat;
    lng = coords.lng;
    locationName = `Current Device Location (${lat}°N, ${lng}°E)`;
  } catch {
    // 2. Graceful fallback: IP-based geolocation
    try {
      const ipRes = await axios.get('https://ipwho.is/', { timeout: 3500 });
      if (ipRes.data && ipRes.data.success !== false && ipRes.data.latitude) {
        lat = Number(Number(ipRes.data.latitude).toFixed(4));
        lng = Number(Number(ipRes.data.longitude).toFixed(4));
        const city = ipRes.data.city || ipRes.data.region || 'Current Place';
        locationName = `${city} (${lat}°N, ${lng}°E)`;
      }
    } catch {
      // Keep regional fallback
      locationName = `Current Regional Area (${lat}°N, ${lng}°E)`;
    }
  }

  // 3. Fetch live real-time Open-Meteo meteorological feed for exact place
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation&daily=weathercode,temperature_2m_max,precipitation_sum&timezone=auto`;
    const res = await axios.get(weatherUrl, { timeout: 6000 });
    const cw = res.data.current_weather;
    const daily = res.data.daily;

    const weatherCode = cw ? cw.weathercode : (daily?.weathercode?.[0] ?? 0);
    const isDay = cw ? cw.is_day === 1 : (new Date().getHours() >= 6 && new Date().getHours() < 19);
    const temp = cw ? Math.round(cw.temperature) : Math.round(daily?.temperature_2m_max?.[0] || 25);
    const wind = cw ? Math.round(cw.windspeed) : 12;
    const rainfall = daily?.precipitation_sum?.[0] || 0;

    const parsed = parseWMOCodeToCondition(weatherCode, isDay, rainfall);

    return {
      lat,
      lng,
      locationName,
      condition: parsed.condition,
      conditionName: parsed.conditionName,
      temp,
      windspeed: wind,
      isDay,
      rainfallMm: rainfall,
      icon: parsed.icon,
    };
  } catch {
    // Return time-based fallback if offline
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 19;
    return {
      lat,
      lng,
      locationName,
      condition: isDay ? 'clear' : 'night',
      conditionName: isDay ? 'Clear Skies' : 'Starry Night',
      temp: 24,
      windspeed: 10,
      isDay,
      rainfallMm: 0,
      icon: isDay ? '☀️' : '🌙',
    };
  }
}
