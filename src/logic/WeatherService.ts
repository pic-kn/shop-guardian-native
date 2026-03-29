import * as Location from 'expo-location';

export interface WeatherType {
  id: string;
  label: string;
  icon: string;
  factor: number;
  wmoCodes: number[];
}

// Weather factors tuned to convenience-store foot traffic patterns.
// Sunny days boost impulse buying (+12%); heavy rain/storms sharply cut visits.
export const WEATHER_TYPES: WeatherType[] = [
  { id: "sunny", label: "晴れ", icon: "Sun", factor: 1.12, wmoCodes: [0, 1] },
  { id: "cloudy", label: "曇り", icon: "Cloud", factor: 1.00, wmoCodes: [2, 3] },
  { id: "rainy", label: "小雨", icon: "CloudRain", factor: 0.85, wmoCodes: [51, 53, 55, 61, 63, 80, 81] },
  { id: "heavy", label: "大雨", icon: "CloudRain", factor: 0.70, wmoCodes: [65, 82] },
  { id: "snow", label: "雪", icon: "CloudSnow", factor: 0.73, wmoCodes: [71, 73, 75, 77, 85, 86] },
  { id: "storm", label: "嵐", icon: "CloudLightning", factor: 0.58, wmoCodes: [95, 96, 99] },
  { id: "fog", label: "霧", icon: "Cloud", factor: 0.80, wmoCodes: [45, 48] },
];

// Day-of-week factors: office-area stores see Friday peaks; Sunday dips.
export const DAY_TYPES = [
  { id: "sun", label: "日", factor: 0.85 },
  { id: "mon", label: "月", factor: 0.95 },
  { id: "tue", label: "火", factor: 0.97 },
  { id: "wed", label: "水", factor: 1.00 },
  { id: "thu", label: "木", factor: 1.02 },
  { id: "fri", label: "金", factor: 1.18 },
  { id: "sat", label: "土", factor: 0.92 },
  { id: "hol", label: "祝", factor: 1.20 },
];

export const DOW_TO_ID = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const wmoToWeatherType = (code: number): WeatherType => {
  return WEATHER_TYPES.find(w => w.wmoCodes.includes(code)) || WEATHER_TYPES[1];
};

export const fetchWeather = async (lat: number, lon: number) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true&timezone=Asia/Tokyo`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo API Error: ${res.status}`);
  const data = await res.json();
  const wmo = data.current_weather?.weathercode;
  if (wmo === undefined) throw new Error("Weather code not found");

  return {
    weatherType: wmoToWeatherType(wmo),
    wmoCode: wmo,
    temperature: data.current_weather?.temperature,
    windspeed: data.current_weather?.windspeed,
    fetchedAt: new Date().toLocaleTimeString("ja-JP"),
    lat,
    lon,
  };
};

export const getCurrentLocationWeather = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const location = await Location.getCurrentPositionAsync({});
  return await fetchWeather(location.coords.latitude, location.coords.longitude);
};
