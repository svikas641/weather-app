import React, { useState } from 'react';

export default function CitySelect({ cities, value, onChange, onSearch }) {
  const [customCity, setCustomCity] = useState('');

  const handleSelect = (e) => {
    onChange(e.target.value);
  };

  const handleCustom = () => {
    const c = customCity.trim();
    if (c) {
      onChange(c);
      onSearch && onSearch();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustom();
    }
  };

  return (
    <div className="city-select">
      <label htmlFor="city">Choose a city: </label>
      <select id="city" value={value} onChange={handleSelect}>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="custom">
        <input
          type="text"
          placeholder="Or type a city..."
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button onClick={handleCustom}>Search</button>
      </div>
    </div>
  );
}


