// ---------- Settings ----------
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Short helper to find elements by id
const $ = id => document.getElementById(id);

// Turns the weather code from the API into readable text
const CODES = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail"
};

// ---------- Fetching data ----------
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status}).`);
  return res.json();
}

async function fetchWeather(city) {
  // Step 1: city name -> latitude and longitude
  const geo = await getJSON(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
  if (!geo.results || geo.results.length === 0) {
    throw new Error(`No city found for "${city}". Check the spelling and try again.`);
  }
  const { latitude, longitude, name, country } = geo.results[0];

  // Step 2: coordinates -> current weather
  const data = await getJSON(
    `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
  );

  return { name, country, current: data.current, units: data.current_units };
}

// ---------- Showing data on the page ----------
function render({ name, country, current, units }) {
  $("place").textContent = `${name}, ${country}`;
  $("temp").textContent = `${Math.round(current.temperature_2m)}${units.temperature_2m}`;
  $("cond").textContent = CODES[current.weather_code] || "Unknown conditions";
  $("hum").textContent = `${current.relative_humidity_2m}${units.relative_humidity_2m}`;
  $("wind").textContent = `${current.wind_speed_10m} ${units.wind_speed_10m}`;
  $("card").classList.remove("hidden");
}

// ---------- Search form ----------
$("form").addEventListener("submit", async e => {
  e.preventDefault(); // stop the page from reloading

  const city = $("city").value.trim();
  if (!city) return;

  $("status").className = "";
  $("status").textContent = "Loading…";
  $("card").classList.add("hidden");

  try {
    const weather = await fetchWeather(city);
    render(weather);
    $("status").textContent = "Updated " + new Date().toLocaleTimeString();
  } catch (err) {
    $("status").className = "error";
    // fetch throws a TypeError when there's no internet
    $("status").textContent =
      err instanceof TypeError
        ? "Network error. Check your connection and try again."
        : err.message;
  }
});