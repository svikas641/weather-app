import React from 'react';

export default function WeatherCard({ data }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>
            {data.city}
            {data.country ? `, ${data.country}` : ''}
          </h2>
          <div className="coords">
            {data.coords?.lat != null && data.coords?.lon != null
              ? `(${data.coords.lat.toFixed(2)}, ${data.coords.lon.toFixed(2)})`
              : ''}
          </div>
        </div>
        {data.icon_url && (
          <img
            src={data.icon_url}
            alt={data.weather_desc || data.weather_main || 'icon'}
            width="80"
            height="80"
          />
        )}
      </div>

      <div className="card-body">
        <div className="temp">{Math.round(data.temp_c)}°C</div>
        <div className="desc">{data.weather_desc || data.weather_main}</div>
        <div className="meta">
          <span>Feels like: {Math.round(data.feels_like)}°C</span>
          <span>Humidity: {data.humidity}%</span>
          <span>Wind: {data.wind_speed} m/s</span>
        </div>
        <div className="timestamp">
          Updated: {new Date(data.fetched_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}


