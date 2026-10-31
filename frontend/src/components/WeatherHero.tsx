"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  CloudSun,
  Droplets,
  CloudRain,
  Wind,
  Radio,
  Layers,
  RefreshCw,
} from "lucide-react";
import { getT } from "@/lib/translations";
import { api, WeatherData } from "@/lib/api";

interface WeatherHeroProps {
  location?: string;
  temp?: number;
  condition?: string;
  dateTime?: string;
  humidity?: number;
  precipitation?: number;
  windSpeed?: number;
  currentLanguage?: string;
  lat?: number;
  lon?: number;
  onOpenLocationModal?: () => void;
}

export function WeatherHero({
  location = "Kanpur, Uttar Pradesh",
  temp: initialTemp = 24,
  condition: initialCondition = "Clear Sky",
  dateTime = "October 30, 2026",
  humidity: initialHumidity = 65,
  precipitation: initialPrecip = 0,
  windSpeed: initialWind = 12,
  currentLanguage = "hi",
  lat = 26.4499,
  lon = 80.3319,
  onOpenLocationModal,
}: WeatherHeroProps) {
  const t = getT(currentLanguage);
  const [loading, setLoading] = useState(false);

  const [weather, setWeather] = useState<WeatherData>({
    status: "available",
    temperature: initialTemp,
    humidity: initialHumidity,
    precipitation_mm: initialPrecip,
    wind_speed_kmh: initialWind,
    condition: initialCondition,
    provider: "Open-Meteo High-Resolution Agro Weather",
  });

  const fetchWeather = (latitude: number, longitude: number) => {
    setLoading(true);
    api
      .getWeather(latitude, longitude)
      .then((data) => {
        if (data) {
          setWeather(data);
        }
      })
      .catch((err) => {
        console.warn("Weather fetch failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (lat !== undefined && lon !== undefined) {
      fetchWeather(lat, lon);
    }
  }, [lat, lon]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#132b1e] p-5 sm:p-6 text-white shadow-xl border border-white/10">
      {/* Ambient background glow */}
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#58a447]/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[#6ecb5a]/10 blur-2xl pointer-events-none" />

      {/* Top Header: Location & Status */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpenLocationModal}
          title="Click to change or auto-detect your location"
          className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs text-white/90 backdrop-blur-md border border-white/15 transition-all cursor-pointer group"
        >
          <MapPin className="w-3.5 h-3.5 text-[#6ecb5a] group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide truncate max-w-[200px] sm:max-w-[260px]">
            {location}
          </span>
          <span className="text-[10px] text-[#6ecb5a] underline ml-1 font-bold">
            Change
          </span>
        </button>

        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
            <CloudSun className="w-4 h-4 text-[#6ecb5a]" />
            <span>{weather.condition}</span>
          </div>
          <span className="text-[10px] text-white/50 mt-0.5">{dateTime}</span>
        </div>
      </div>

      {/* Large Temperature Display */}
      <div className="relative z-10 my-4 sm:my-5 flex items-baseline justify-between">
        <div className="flex items-baseline">
          <span className="text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
            {Math.round(weather.temperature)}°
          </span>
          <span className="text-2xl sm:text-3xl font-light text-white/70 ml-1">
            C
          </span>
        </div>

        {/* Live Satellite / Agro badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchWeather(lat, lon)}
            disabled={loading}
            title="Refresh Live Weather Telemetry"
            className="flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#6ecb5a]" : ""}`} />
          </button>
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-[10px] text-[#6ecb5a] border border-[#6ecb5a]/30">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Live Telemetry</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Agro Telemetry Grid Bottom */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-4">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-white/60">
            <Droplets className="w-3 h-3 text-[#3d9be5]" />
            <span>{t.weatherHumidity || "Humidity"}</span>
          </div>
          <p className="mt-1 text-sm sm:text-base font-semibold text-white">
            {weather.humidity}%
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[11px] text-white/60">
            <Layers className="w-3 h-3 text-[#6ecb5a]" />
            <span>Soil Moisture (27-81cm)</span>
          </div>
          <p className="mt-1 text-sm sm:text-base font-semibold text-white">
            {weather.soil_moisture !== undefined ? `${weather.soil_moisture} m³/m³` : "0.32 m³/m³"}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[11px] text-white/60">
            <CloudSun className="w-3 h-3 text-[#facc15]" />
            <span>Cloud Cover</span>
          </div>
          <p className="mt-1 text-sm sm:text-base font-semibold text-white">
            {weather.cloud_cover !== undefined ? `${weather.cloud_cover}%` : "Clean"}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[11px] text-white/60">
            <Wind className="w-3 h-3 text-[#6ecb5a]" />
            <span>{t.weatherWind || "Wind Speed"}</span>
          </div>
          <p className="mt-1 text-sm sm:text-base font-semibold text-white">
            {weather.wind_speed_kmh || 13} km/h
          </p>
        </div>
      </div>
    </div>
  );
}
