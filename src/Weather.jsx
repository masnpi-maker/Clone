import { useEffect, useState } from "react";
import "./Weather.css";

const DEFAULT_LOCATION = {
  name: "Vilnius",
  country: "Lietuva",
  latitude: 54.6872,
  longitude: 25.2797,
};

const WEATHER_LABELS = {
  0: "Giedra",
  1: "Daugiausia giedra",
  2: "Mažai debesuota",
  3: "Debesuota",
  45: "Rūkas",
  48: "Šerkšno rūkas",
  51: "Silpna dulksna",
  53: "Dulksna",
  55: "Stipri dulksna",
  56: "Silpnas lijundros lietus",
  57: "Stiprus lijundros lietus",
  61: "Silpnas lietus",
  63: "Lietus",
  65: "Stiprus lietus",
  66: "Silpna lijundra",
  67: "Stipri lijundra",
  71: "Silpnas sniegas",
  73: "Sniegas",
  75: "Stiprus sniegas",
  77: "Sniego kruopos",
  80: "Silpni lietaus šuorai",
  81: "Lietaus šuorai",
  82: "Stiprūs lietaus šuorai",
  85: "Silpni sniego šuorai",
  86: "Stiprūs sniego šuorai",
  95: "Perkūnija",
  96: "Perkūnija su kruša",
  99: "Stipri perkūnija su kruša",
};

function getWeatherLabel(code) {
  return WEATHER_LABELS[code] || "Orų duomenų nėra";
}

function Weather() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [cityInput, setCityInput] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWeather(selectedLocation) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "auto",
        forecast_days: "5",
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error("Nepavyko gauti orų duomenų.");
      setWeather(await response.json());
      setLocation(selectedLocation);
    } catch (loadError) {
      setError(loadError.message || "Nepavyko prisijungti prie orų API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather(DEFAULT_LOCATION);
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    const searchTerm = cityInput.trim();
    if (!searchTerm) return;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ name: searchTerm, count: "1", language: "lt", format: "json" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      if (!response.ok) throw new Error("Nepavyko rasti miesto.");
      const data = await response.json();
      const result = data.results?.[0];
      if (!result) throw new Error("Miestas nerastas. Patikrinkite pavadinimą.");
      await loadWeather({
        name: result.name,
        country: result.country,
        latitude: result.latitude,
        longitude: result.longitude,
      });
      setCityInput("");
    } catch (searchError) {
      setError(searchError.message || "Nepavyko ieškoti miesto.");
      setLoading(false);
    }
  }

  const current = weather?.current;
  const daily = weather?.daily;

  return (
    <main className="weather-page">
      <section className="weather-card" aria-labelledby="weather-title">
        <header className="weather-header">
          <div>
            <p className="weather-eyebrow">Open-Meteo</p>
            <h1 id="weather-title">Orų prognozė</h1>
            <p className="weather-location">{location.name}, {location.country}</p>
          </div>
          <form className="weather-search" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="weather-city">Miesto pavadinimas</label>
            <input
              id="weather-city"
              type="search"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="Ieškoti miesto"
            />
            <button type="submit" disabled={loading || !cityInput.trim()}>Ieškoti</button>
          </form>
        </header>

        {error && <p className="weather-error" role="alert">{error}</p>}
        {loading && <p className="weather-state" aria-live="polite">Kraunami orų duomenys...</p>}

        {!loading && current && daily && (
          <>
            <div className="weather-current">
              <div className="weather-current__main">
                <span className="weather-current__icon" aria-hidden="true">🌤️</span>
                <div>
                  <p className="weather-condition">{getWeatherLabel(current.weather_code)}</p>
                  <p className="weather-temperature">{Math.round(current.temperature_2m)}°</p>
                </div>
              </div>
              <p className="weather-feels">Jaučiama kaip {Math.round(current.apparent_temperature)}°</p>
              <div className="weather-details">
                <p><span>Vėjas</span><strong>{Math.round(current.wind_speed_10m)} km/h</strong></p>
                <p><span>Drėgmė</span><strong>{current.relative_humidity_2m}%</strong></p>
                <p><span>Krituliai</span><strong>{current.precipitation} mm</strong></p>
              </div>
            </div>

            <section className="weather-forecast" aria-label="5 dienų prognozė">
              <h2>5 dienų prognozė</h2>
              <div className="weather-forecast__list">
                {daily.time.map((date, index) => (
                  <article className="weather-day" key={date}>
                    <p className="weather-day__name">
                      {index === 0 ? "Šiandien" : new Intl.DateTimeFormat("lt-LT", { weekday: "short" }).format(new Date(`${date}T12:00:00`))}
                    </p>
                    <span className="weather-day__icon" aria-hidden="true">🌦️</span>
                    <p className="weather-day__condition">{getWeatherLabel(daily.weather_code[index])}</p>
                    <p className="weather-day__temperature">
                      <strong>{Math.round(daily.temperature_2m_max[index])}°</strong>
                      <span>{Math.round(daily.temperature_2m_min[index])}°</span>
                    </p>
                    <p className="weather-day__rain">Krituliai {daily.precipitation_probability_max?.[index] ?? 0}%</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="weather-attribution">
          Orų duomenys: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
        </footer>
      </section>
    </main>
  );
}

export default Weather;
