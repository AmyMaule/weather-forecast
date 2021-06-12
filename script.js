const currentConditionsDiv = document.querySelector(".current-conditions");
const tableSection = document.querySelector(".table-section");
const popularLocations = document.querySelector(".interesting-locations");
let mainLocation = document.querySelector(".location");
let mainWeatherIcon = document.querySelector(".weather-icon");
const temperatureIcon = document.querySelector(".temp-icon");
const isRainingIcon = document.querySelector(".is-raining-icon");
let isRainingMm = document.querySelector(".is-raining-mm");
const isWindyIcon = document.querySelector(".is-windy-icon");
let mainwindDirection = document.querySelector(".wind-direction");
const searchBar = document.querySelector(".search");
const searchButton = document.querySelector(".enter");
let mainCurrentTemp = document.querySelector(".current-temp");
let mainFeelsLike = document.querySelector(".feels-like");
let mainIsRaining = document.querySelector(".is-raining");
let mainWindSpeed = document.querySelector(".wind-speed");
let currentTempData,
    feelsLikeData,
    windDirectionDegreesData,
    windSpeedData,
    rainData;
let dateToday = document.querySelector(".date-today");
let dateTomorrow = document.querySelector(".date-tomorrow");

temperatureIcon.innerHTML = `<img src="./images/temp-icon.png" width="15px" height="30px"></img>`;
isRainingIcon.innerHTML = `<img src="./images/rain-icon.png" width="30px" height="30px"></img>`;
isWindyIcon.innerHTML = `<img src="./images/wind-icon.png" width="30px" height="30px"></img>`;

// weatherAPI uses the open weather map one call API
const weatherAPI = {
    // the api call is: https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude={part}&units=metric&appid={API_key}
    key: "c73ff1dedf4b4bfc101b045bb7809c2e",
    baseURL: "https://api.openweathermap.org/data/2.5/onecall",
};

searchBar.addEventListener("keypress", runQuery);
searchButton.addEventListener("click", runQuery);

function runQuery(e) {
    if (e.target.classList.contains("enter") || e.keyCode == 13) {
        geoCode(searchBar.value);
    }
}

// may need to come back later to edit the state and country code parts of the geocodingAPI object (commented inside)
// geocodingAPI uses the city name passed into the search bar and converts it to latitude and longitude coordinates, as these are required by the weatherAPI
const geocodingAPI = {
    // the api call is: https://api.openweathermap.org/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid={API key}
    key: "c73ff1dedf4b4bfc101b045bb7809c2e",
    baseURL: "https://api.openweathermap.org/geo/1.0/direct",
};

function geoCode(city) {
    fetch(`${geocodingAPI.baseURL}?q=${city}&limit=1&appid=${geocodingAPI.key}`)
        .then((currentCity) => {
            return currentCity.json();
        })
        .then(findLatLon);
}

function findLatLon(city) {
    mainLocation.innerHTML = `${city[0].name}, ${city[0].country}`;
    let lat = city[0].lat;
    let lon = city[0].lon;
    getCurrentWeather(lat, lon);
}

// Units can be changed here to imperial if needed
function getCurrentWeather(lat, lon) {
    fetch(
        `${weatherAPI.baseURL}?lat=${lat}&lon=${lon}&units=metric&appid=${weatherAPI.key}`
    )
        .then((currentWeather) => {
            return currentWeather.json();
        })
        .then(displayMainResults)
        .then(display48HourIcons)
        .then(display48HourData)
        .then(display7DayData);
}

function displayMainResults(data) {
    searchBar.value = "";
    // removing classes so that the previous search doesn't affect the current search
    isRainingMm.classList.remove("double-digit");
    isRainingMm.classList.remove("triple-digit");
    mainCurrentTemp.classList.remove("below-zero");
    mainCurrentTemp.classList.remove("above-zero");

    // Main forecast is .main and .description is a more detailed forecast (eg. main: clouds, description: broken clouds)
    let mainWeather = data.current.weather[0].main;
    let detailedWeather = data.current.weather[0].description;
    let mainIcon = getWeatherIcon(mainWeather, detailedWeather);
    mainWeatherIcon.innerHTML = `<img src="./weather-icons/${mainIcon}.png" width="100px" height="100px"></img>`;

    currentTempData = Math.round(data.current.temp);
    mainCurrentTemp.innerHTML = `${currentTempData}\xB0`;
    if (currentTempData <= 0) {
        mainCurrentTemp.classList.add("below-zero");
    } else {
        mainCurrentTemp.classList.add("above-zero");
    }

    feelsLikeData = Math.round(data.current.feels_like);
    mainFeelsLike.innerHTML = `Feels like: ${feelsLikeData}\xB0`;

    if (data.current.rain || data.current.snow) {
        if (data.current.rain) {
            rainData = data.current.rain["1h"];
        } else {
            rainData = data.current.snow["1h"];
        }
        mainIsRaining.innerHTML = rainData.toFixed(1);
        // these classes just keep the styling of the mm in roughly the right place
        if (rainData < -10 || rainData > 10) {
            isRainingMm.classList.add("triple-digit");
        } else {
            isRainingMm.classList.add("double-digit");
        }
    } else {
        rainData = 0;
        mainIsRaining.innerHTML = 0;
    }

    windDirectionDegreesData = getWindDirection(data.current.wind_deg);
    mainwindDirection.innerHTML = windDirectionDegreesData;

    windSpeedData = data.current.wind_speed;
    mainWindSpeed.innerHTML = `${Math.round(windSpeedData)} m/s`;

    // the main conditions div is set to be hidden by default so it doesn't show empty data slots
    currentConditionsDiv.classList.remove("hide");
    tableSection.classList.remove("hide");
    popularLocations.classList.add("hide");
    return data;
}

// the sole purpose of this function is to return the name of the weather icon that will be passed back to displayResults
function getWeatherIcon(mainWeather, detailedWeather) {
    // For Clear, Drizzle and Thunderstorm, the description is irrelevant because the icon will be the same regardless, whereas with the rest of the weather, the description will determine which icon is used (eg. light rain vs heavy rain)
    if (
        mainWeather == "Clear" ||
        mainWeather == "Drizzle" ||
        mainWeather == "Thunderstorm"
    ) {
        return mainWeather.toLowerCase();
    } else if (mainWeather == "Clouds") {
        if (detailedWeather == "few clouds") {
            return "few-clouds";
        } else return "cloud";
    } else if (mainWeather == "Snow") {
        if (detailedWeather == "heavy snow") {
            return "lots-of-snow";
        } else if (
            detailedWeather == "shower snow" ||
            detailedWeather == "heavy shower snow"
        ) {
            return "cloud-snow";
        } else return "snow";
    } else if (mainWeather == "Rain") {
        if (
            detailedWeather == "light rain" ||
            detailedWeather == "light intensity shower rain"
        ) {
            return "drizzle";
        } else if (detailedWeather == "freezing rain") {
            return "snow";
        } else return "lots-of-rain";
    } else return "cloud";
}

// getWindDirection takes in the wind direction in degrees and outputs a hex code of an arrow pointing in that direction
function getWindDirection(windDirection) {
    if (windDirection > 337.5 || windDirection <= 22.5) {
        return "&#x2191;";
    } else if (windDirection > 22.5 && windDirection <= 67.5) {
        return "&#x2197;";
    } else if (windDirection > 22.5 && windDirection <= 67.5) {
        return "&#x2197;";
    } else if (windDirection > 67.5 && windDirection <= 112.5) {
        return "&#x2192;";
    } else if (windDirection > 112.5 && windDirection <= 157.5) {
        return "&#x2198;";
    } else if (windDirection > 157.5 && windDirection <= 202.5) {
        return "&#x2193;";
    } else if (windDirection > 202.5 && windDirection <= 247.5) {
        return "&#x2199;";
    } else if (windDirection > 247.5 && windDirection <= 292.5) {
        return "&#x2190;";
    } else if (windDirection > 292.5 && windDirection <= 337.5) {
        return "&#x2196;";
    } else return "";
}

// This function displays the weather icons underneath Night - Evening in the 48 hour section
function display48HourIcons(data) {
    let tdNightTop = document.querySelector(".td-night-top");
    let tdMorningTop = document.querySelector(".td-morning-top");
    let tdAfternoonTop = document.querySelector(".td-afternoon-top");
    let tdEveningTop = document.querySelector(".td-evening-top");
    let tdNightBottom = document.querySelector(".td-night-bottom");
    let tdMorningBottom = document.querySelector(".td-morning-bottom");
    let tdAfternoonBottom = document.querySelector(".td-afternoon-bottom");
    let tdEveningBottom = document.querySelector(".td-evening-bottom");

    // this gets the current time for the person who is searching (unrelated to the location searched for)
    let currentTimeInLocation = new Date(data.current.dt * 1000);
    let currentTimeInHoursUTC = new Date(currentTimeInLocation).getUTCHours();

    // hoursInLocation gives the time in hours (eg. 17:34 is 17) in the location that is being searched for - I divided by 3600 as the data.timezone_offset is in seconds, and currentTimeinHoursUTC is in hours - Math.round is to take care of the half hour time zones that exist in some places so it doesn't end up as a decimal
    let hoursInLocation = Math.round(
        currentTimeInHoursUTC + data.timezone_offset / 3600
    );

    let hours;
    let tdTop = [tdNightTop, tdMorningTop, tdAfternoonTop, tdEveningTop];
    let tdBottom = [
        tdNightBottom,
        tdMorningBottom,
        tdAfternoonBottom,
        tdEveningBottom,
    ];

    // if/else block chooses which times to display on the 48hr table based on current time
    if (hoursInLocation >= 21) {
        // if it is currently after 9pm, get tomorrow's weather instead - set hoursInLocation to 21 so that I don't have to write multiple extra statements for if it is 22 or 23.
        hoursInLocation = 21;
        // here the hours starts at 27 as it is 24 hours + 3am, i.e., tomorrow at 3am
        hours = 27;
    } else {
        // the hours starts at 3 for 3am
        hours = 3;
    }

    for (let i = 0; i < tdTop.length; i++) {
        if (hours - hoursInLocation >= 0) {
            tdTop[i].innerHTML = `<img src="./weather-icons/${getWeatherIcon(
                data.hourly[hours - hoursInLocation].weather[0].main,
                data.hourly[hours - hoursInLocation].weather[0].description
            )}.png" width="50px" height="50px"></img>`;
        }
        hours += 6;
    }

    // for tomorrow, no matter the current time, display 3am 9am 3pm 9pm
    for (let i = 0; i < tdBottom.length; i++) {
        hours = 27;
        tdBottom[i].innerHTML = `<img src="./weather-icons/${getWeatherIcon(
            data.hourly[hours - hoursInLocation].weather[0].main,
            data.hourly[hours - hoursInLocation].weather[0].description
        )}.png" width="50px" height="50px"></img>`;
        hours += 6;
    }

    // return as an array in order to have access to both of these variables
    return [data, hoursInLocation];
}

// This function displays the data underneath Max/min, Precip., and Wind for the 48 hour section
function display48HourData(dataArray) {
    let data = dataArray[0];
    let hoursInLocation = dataArray[1];

    let maxMinTop = document.querySelector(".max-min-top");
    let tdRainTop = document.querySelector(".td-rain-top");
    let tdWindTop = document.querySelector(".td-wind-top");
    let maxMinBottom = document.querySelector(".max-min-bottom");
    let tdRainBottom = document.querySelector(".td-rain-bottom");
    let tdWindBottom = document.querySelector(".td-wind-bottom");

    // The 48h section will show the rest of today as long as it is before 9pm, so if the time is after 9pm, set today to be tomorrow, and tomorrow to be the next day
    let today = 0;
    let tomorrow = 1;
    if (hoursInLocation < 21) {
        // Check the width of the screen, if it is <=580px, the date string "Sat 12 Jun 2021" becomes "12 Jun", otherwise it can stay as it is
        if (window.innerWidth <= 580) {
            dateToday.innerHTML = new Date().toDateString().slice(4, 10);
            dateTomorrow.innerHTML = new Date(new Date().getTime() + 86400000).toDateString().slice(4,10);
        } else {
            dateToday.innerHTML = new Date().toDateString();
            dateTomorrow.innerHTML = new Date(new Date().getTime() + 86400000).toDateString();
        }
    } else {
        today = 1;
        tomorrow = 2;
        dateToday.innerHTML = new Date(new Date().getTime() + 86400000).toDateString();
        dateTomorrow.innerHTML = new Date(new Date().getTime() + 2 * 86400000).toDateString();
    }

    maxMinTop.innerHTML = `${Math.round(
        data.daily[today].temp.max
    )}\xB0/${Math.round(data.daily[today].temp.min)}\xB0`;
    maxMinBottom.innerHTML = `${Math.round(
        data.daily[tomorrow].temp.max
    )}\xB0/${Math.round(data.daily[tomorrow].temp.min)}\xB0`;

    if (data.daily[today].rain || data.daily[today].snow) {
        if (data.daily[today].rain) {
            tdRainTop.innerHTML = `${data.daily[today].rain.toFixed(1)}mm`;
        } else {
            tdRainTop.innerHTML = `${data.daily[today].snow.toFixed(1)}mm`;
        }
    }

    if (data.daily[tomorrow].rain || data.daily[tomorrow].snow) {
        if (data.daily[tomorrow].rain) {
            tdRainBottom.innerHTML = `${data.daily[tomorrow].rain.toFixed(1)}mm`;
        } else {
            tdRainBottom.innerHTML = `${data.daily[tomorrow].snow.toFixed(1)}mm`;
        }
    }
    tdWindTop.innerHTML = `${Math.round(data.daily[today].wind_speed)}m/s`;
    tdWindBottom.innerHTML = `${Math.round(data.daily[tomorrow].wind_speed)}m/s`;
    return data;
}

function display7DayData(data) {
    const days = Array.from(document.querySelectorAll(".upcoming-days"));
    const dates = Array.from(document.querySelectorAll(".upcoming-day-date"));

    for (let i = 0; i < days.length; i++) {
        // data.daily[0] gives today's weather, data.daily[1] gives tomorrow's, etc
        days[i].innerHTML = `<img src="./weather-icons/${getWeatherIcon(
            data.daily[i + 1].weather[0].main,
            data.daily[i + 1].weather[0].description
        )}.png" width="50px" height="50px"></img>`;
        let singleDate = new Date(data.daily[i].dt * 1000);
        let singleDateString;
        // If the window is less than about 800px wide, having the full date (eg. Sat Jun 12) makes the table too squashed, so using .slice(4, 10) gives the string "Jun 12" instead of the else statement, where .slice(0, 10) gives "Sat Jun 12"
        if (window.innerWidth <= 1080) {
            if (window.innerWidth <= 450) {
                singleDateString = new Date(singleDate).toString().slice(0, 3);
            } else {
            // the slice gets rid of all the rest of the date, only keeping characters 4 to 10
            singleDateString = new Date(singleDate).toString().slice(4, 10);
            // The left table header for the 7 day overview at the bottom says "Weather overview" when the screen is larger, and just "Overview" when it is smaller, to make more space for padding around the weather icons
            document.querySelector(".seven-day-overview").innerHTML = "Overview";
            }
        } else {
            // the slice gets rid of all the rest of the date, only keeping characters 0 to 10
            singleDateString = new Date(singleDate).toString().slice(0, 10);
        }
        dates[i].innerHTML = singleDateString;
    }
    return data;
}

// This will take the "popular cities" below, and use their latitude and longitude to fetch the weather data for each city
function fetchPopularData(cities) {
    cities.forEach((city) => {
        fetch(
            `${weatherAPI.baseURL}?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${weatherAPI.key}`
        )
            .then((currentCity) => {
                return currentCity.json();
            })
            .then(displayPopularData);
    });
}

let popularCities = [
    {
        city: "London, United Kingdom",
        timezone: "Europe/London",
        lat: 51.5085,
        lon: -0.1257,
    },
    {
        city: "Paris, France",
        timezone: "Europe/Paris",
        lat: 48.8534,
        lon: 2.3488,
    },
    {
        city: "Tokyo, Japan",
        timezone: "Asia/Tokyo",
        lat: 35.6895,
        lon: 139.6917,
    },
];

fetchPopularData(popularCities);

function displayPopularData(data) {
    const cityIcons = Array.from(document.querySelectorAll(".popular-icon"));
    const cityNames = Array.from(document.querySelectorAll(".popular-city"));
    const popMaxMin = Array.from(document.querySelectorAll(".popular-max-min"));
    const popularRain = Array.from(document.querySelectorAll(".popular-rain"));

    for (let i = 0; i < popularCities.length; i++) {
        if (popularCities[i].timezone == data.timezone) {
            cityIcons[
                i
            ].innerHTML = `<img src="./weather-icons/${getWeatherIcon(
                data.current.weather[0].main,
                data.current.weather[0].main
            )}.png" width="60px" height="60px"></img>`;
            cityNames[i].innerHTML = popularCities[i].city;
            popMaxMin[i].innerHTML = `${Math.round(
                data.daily[0].temp.max
            )}\xB0/${Math.round(data.daily[0].temp.min)}\xB0`;
            if (data.daily[0].rain) {
                popularRain[i].innerHTML = `${data.daily[0].rain.toFixed(1)}mm`;
            } else {
                popularRain[i].innerHTML = "0mm";
            }
        }
    }
}
