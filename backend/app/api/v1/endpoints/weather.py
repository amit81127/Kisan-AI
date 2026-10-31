from fastapi import APIRouter, Query
from app.adapters.weather.weather_adapter import weather_adapter

router = APIRouter()

@router.get("/weather")
async def get_weather(
    lat: float = Query(26.8467, ge=-90.0, le=90.0),
    lon: float = Query(80.9462, ge=-180.0, le=180.0)
):
    """Fetch current agro-weather and humidity facts for given coordinates"""
    wx_data = await weather_adapter.get_current_and_forecast(lat=lat, lon=lon)
    return {"success": True, "weather": wx_data}
