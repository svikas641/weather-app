import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CitySelect from './components/CitySelect.jsx';
import WeatherCard from './components/WeatherCard.jsx';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const DEFAULT_CITIES = [
  'Pune',
  'Mumbai',
  'Bengaluru',
  'Delhi',
  'New York',
  'London'
];

// Simple client cache using localStorage with TTL
const LS_KEY_PREFIX = 'weather-cache:';
const LS_TTL_MS = 2 * 60 * 1000; // 2 minutes on client

function getCacheKey(city) {
  return `${LS_KEY_PREFIX}${city.toLowerCase()}`;
}

function readCache(city) {
  try {
    const raw = localStorage.getItem(getCacheKey(city));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > LS_TTL_MS) {
      localStorage.removeItem(getCacheKey(city));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(city, data) {
  try {
    localStorage.setItem(
      getCacheKey(city),
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch {
    // ignore quota errors
  }
}

export default function App() {
  const [city, setCity] = useState(DEFAULT_CITIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weather, setWeather] = useState(null);

  const canFetch = useMemo(() => !!city && city.trim().length > 0, [city]);

  const fetchWeather = useCallback(
    async (selectedCity) => {
      setError('');
      setLoading(true);
      setWeather(null);

      // Try client-side cache
      const cached = readCache(selectedCity);
      if (cached) {
        setWeather(cached);
        setLoading(false);
        return;
      }

      try {
        const url = `${API_BASE.replace(/\/$/, '')}/api/weather?city=${encodeURIComponent(
          selectedCity
        )}`;
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data?.error || 'Failed to fetch weather');
        }
        writeCache(selectedCity, data);
        setWeather(data);
      } catch (e) {
        setError(e.message || 'Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (canFetch) {
      fetchWeather(city);
    }
  }, [city, canFetch, fetchWeather]);

  return (
    <div className="container">
      <h1>Weather</h1>
      <CitySelect
        cities={DEFAULT_CITIES}
        value={city}
        onChange={setCity}
        onSearch={() => canFetch && fetchWeather(city)}
      />
      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">{error}</div>}
      {weather && <WeatherCard data={weather} />}
      <footer>
        <small>
          Backend: {API_BASE} | Data by OpenWeatherMap (via our backend)
        </small>
      </footer>
    </div>
  );
}


