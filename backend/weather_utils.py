import requests


API_KEY = "a38051c3be34e0b8d5743abd6eeaf335"


def get_weather_data(city):
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    weather_info = {
        "city": data["name"],
        "country": data["sys"]["country"],
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "pressure": data["main"]["pressure"],
        "weather_main": data["weather"][0]["main"],
        "weather_description": data["weather"][0]["description"],
        "wind_speed": data["wind"]["speed"]
    }

    return weather_info


def get_irrigation_advice(temperature, humidity, weather_main):
    weather_main = weather_main.lower()

    if "rain" in weather_main or "drizzle" in weather_main or "thunderstorm" in weather_main:
        return "Postpone irrigation. Rainfall or storm conditions are present."

    if temperature > 32 and humidity < 50:
        return "High irrigation need. Temperature is high and humidity is low."

    if 25 <= temperature <= 32 and 50 <= humidity <= 70:
        return "Moderate irrigation recommended. Conditions are fairly warm and balanced."

    if temperature < 25 and humidity > 70:
        return "Low irrigation need. Cool and humid conditions reduce water requirement."

    return "Check field moisture before irrigating. Conditions are moderate."


def get_weather_advice(temperature, humidity, weather_main, weather_description):
    weather_main = weather_main.lower()
    weather_description = weather_description.lower()

    if "thunderstorm" in weather_main:
        return "Thunderstorm alert. Avoid field operations and protect sensitive crops."

    if "rain" in weather_main:
        return "Rainfall expected or occurring. Delay irrigation and monitor drainage."

    if temperature > 35:
        return "Heat stress warning. Crops may need protection and careful water planning."

    if humidity > 85:
        return "High humidity alert. Moist conditions may increase fungal risk."

    if "clear" in weather_description and 20 <= temperature <= 30:
        return "Weather is currently favorable for normal field activity."

    return "Weather is stable. Continue regular monitoring of crop and soil conditions."


def generate_weather_advisory(city):
    weather = get_weather_data(city)

    irrigation_advice = get_irrigation_advice(
        weather["temperature"],
        weather["humidity"],
        weather["weather_main"]
    )

    weather_advice = get_weather_advice(
        weather["temperature"],
        weather["humidity"],
        weather["weather_main"],
        weather["weather_description"]
    )

    result = {
        "city": weather["city"],
        "country": weather["country"],
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "pressure": weather["pressure"],
        "weather_main": weather["weather_main"],
        "weather_description": weather["weather_description"],
        "wind_speed": weather["wind_speed"],
        "irrigation_advice": irrigation_advice,
        "weather_advice": weather_advice
    }

    return result