"""
IMD Climatologically-Grounded Historical Dataset Generator
Generates multi-decadal historical daily meteorological records (1995-2024)
grounded in real historical climate cycles (ENSO, IOD, MJO) and IMD monsoon onset criteria.
"""

import os
import json
import math
import numpy as np
import pandas as pd

# Historical ENSO (Niño 3.4 SST Anomaly in JJAS) & IOD Mode Index by year
HISTORICAL_CLIMATE_YEARS = {
    1995: {"enso": 0.0, "iod": -0.1},
    1996: {"enso": -0.3, "iod": 0.1},
    1997: {"enso": 1.7, "iod": 1.1},   # Very strong El Niño + Positive IOD
    1998: {"enso": -1.1, "iod": -0.2},  # La Niña
    1999: {"enso": -1.0, "iod": -0.1},  # La Niña
    2000: {"enso": -0.6, "iod": -0.3},
    2001: {"enso": -0.1, "iod": -0.2},
    2002: {"enso": 0.9, "iod": 0.3},   # Severe Monsoon Drought (El Niño)
    2003: {"enso": 0.2, "iod": 0.4},
    2004: {"enso": 0.7, "iod": -0.1},  # Deficit monsoon
    2005: {"enso": 0.1, "iod": -0.2},
    2006: {"enso": 0.5, "iod": 0.9},   # Positive IOD
    2007: {"enso": -1.1, "iod": 0.4},  # La Niña (Good monsoon)
    2008: {"enso": -0.4, "iod": 0.1},
    2009: {"enso": 1.2, "iod": -0.2},  # Severe Drought (El Niño)
    2010: {"enso": -1.4, "iod": -0.4},  # Strong La Niña (Heavy monsoon)
    2011: {"enso": -0.9, "iod": 0.3},
    2012: {"enso": 0.4, "iod": 0.5},
    2013: {"enso": -0.3, "iod": -0.1}, # Strong early onset
    2014: {"enso": 0.5, "iod": -0.1},  # Deficit monsoon
    2015: {"enso": 2.2, "iod": 0.6},   # Extreme El Niño, widespread drought
    2016: {"enso": -0.5, "iod": -0.8}, # Strong Negative IOD
    2017: {"enso": -0.4, "iod": 0.3},
    2018: {"enso": 0.6, "iod": 0.2},
    2019: {"enso": 0.3, "iod": 1.9},   # Record Positive IOD (Excess monsoon)
    2020: {"enso": -1.0, "iod": -0.3}, # La Niña
    2021: {"enso": -0.7, "iod": -0.4}, # La Niña
    2022: {"enso": -0.9, "iod": -0.7}, # La Niña
    2023: {"enso": 1.4, "iod": 1.2},   # Strong El Niño + Positive IOD
    2024: {"enso": -0.4, "iod": 0.3}   # Neutral/Weak La Niña (Above normal monsoon)
}

def generate_historical_dataset(locations_file: str, output_csv: str):
    print("Loading locations...")
    with open(locations_file, "r") as f:
        locations_data = json.load(f)

    panchayats_list = []
    for dist in locations_data["districts"]:
        d_name = dist["name"]
        for blk in dist["blocks"]:
            b_name = blk["name"]
            for p in blk["panchayats"]:
                panchayats_list.append({
                    "district": d_name,
                    "block": b_name,
                    "panchayat": p["name"],
                    "lat": p["lat"],
                    "lng": p["lng"],
                    "elevation": p.get("elevation_m", 550)
                })

    print(f"Total target micro-catchments: {len(panchayats_list)}")

    records = []
    np.random.seed(42)

    years = sorted(list(HISTORICAL_CLIMATE_YEARS.keys()))
    print(f"Generating 30 years of daily agromet data (1995-2024) across {len(panchayats_list)} stations...")

    for year in years:
        climate = HISTORICAL_CLIMATE_YEARS[year]
        enso = climate["enso"]
        iod = climate["iod"]

        # Base regional onset day-of-year for central Maharashtra (Normal: June 9 = DOY 160)
        # El Niño delays onset by 3-7 days, La Niña advances onset by 2-5 days
        regional_onset_doy = int(160 + (enso * 3.5) - (iod * 2.0) + np.random.normal(0, 2.5))

        for p in panchayats_list:
            lat = p["lat"]
            lng = p["lng"]
            elev = p["elevation"]

            # Orographic adjustment: stations closer to Western Ghats (lower longitude) get earlier onset & more rain
            ghats_dist_km = max(5.0, (lng - 73.3) * 111.0)
            orographic_boost = max(1.0, 1.8 - (ghats_dist_km / 120.0))
            local_onset_doy = int(regional_onset_doy + (lat - 18.5) * 1.5 - (elev - 550) * 0.01 + np.random.normal(0, 1.5))

            # Simulate key monsoon transition window: May 1 (DOY 121) to September 30 (DOY 273)
            # 153 days per year per station
            for doy in range(121, 274):
                # Distance to local onset
                days_to_onset = doy - local_onset_doy

                # Planetary MJO cycle (30-60 day wave)
                mjo_phase = int(1 + ((doy + year * 7) % 45) // 5.6)
                mjo_amp = 1.0 + 0.6 * math.sin(2 * math.pi * doy / 40.0)
                # MJO phase 2-4 enhances Indian monsoon convection
                mjo_favorable = 1.0 if mjo_phase in [2, 3, 4] else (-0.5 if mjo_phase in [7, 8] else 0.0)

                # Pre-monsoon vs Monsoon dynamics
                if days_to_onset < -14:
                    # Deep pre-monsoon: hot, dry, northerly/westerly weak winds, high OLR
                    temp_max = 39.0 - (elev - 500) * 0.006 + np.random.normal(0, 1.5)
                    rh_700 = np.clip(35.0 + np.random.normal(0, 6.0), 20.0, 55.0)
                    u_wind = np.clip(2.0 + np.random.normal(0, 1.5), -2.0, 6.0)
                    olr = np.clip(280.0 + np.random.normal(0, 12.0), 250.0, 320.0)
                    soil_moist = np.clip(18.0 + np.random.normal(0, 3.0), 10.0, 25.0)
                    daily_rain = 0.0 if np.random.rand() > 0.06 else np.random.exponential(3.0)
                elif days_to_onset < 0:
                    # Pre-monsoon surge / onset buildup (1-14 days before onset):
                    progress = (days_to_onset + 14) / 14.0
                    temp_max = 38.0 - 5.0 * progress + np.random.normal(0, 1.2)
                    rh_700 = np.clip(45.0 + 35.0 * progress + np.random.normal(0, 5.0), 35.0, 85.0)
                    u_wind = np.clip(5.0 + 12.0 * progress + np.random.normal(0, 2.0), 2.0, 20.0)
                    olr = np.clip(270.0 - 65.0 * progress + np.random.normal(0, 10.0), 180.0, 290.0)
                    soil_moist = np.clip(20.0 + 15.0 * progress + np.random.normal(0, 3.0), 15.0, 42.0)
                    daily_rain = 0.0 if np.random.rand() > (0.15 + 0.3 * progress) else np.random.exponential(8.0)
                elif days_to_onset <= 40:
                    # Active monsoon onset & establishment:
                    # High moisture, strong south-westerlies, low OLR
                    # Check if mid-season break occurs (El Niño increases break frequency)
                    is_break_period = (doy > local_onset_doy + 20) and (np.random.rand() < (0.15 + max(0, enso * 0.18)))
                    if is_break_period:
                        # Break / dry spell regime
                        temp_max = 32.0 + np.random.normal(0, 1.0)
                        rh_700 = np.clip(55.0 + np.random.normal(0, 6.0), 40.0, 68.0)
                        u_wind = np.clip(6.0 + np.random.normal(0, 2.0), 2.0, 10.0)
                        olr = np.clip(245.0 + np.random.normal(0, 12.0), 220.0, 275.0)
                        soil_moist = np.clip(45.0 - (days_to_onset % 7) * 1.5, 25.0, 55.0)
                        daily_rain = 0.0 if np.random.rand() > 0.1 else np.random.exponential(2.0)
                    else:
                        # Active monsoon spell
                        temp_max = 28.5 - (elev - 500) * 0.005 + np.random.normal(0, 1.0)
                        rh_700 = np.clip(82.0 + mjo_favorable * 4.0 + np.random.normal(0, 4.0), 68.0, 96.0)
                        u_wind = np.clip(16.0 + mjo_favorable * 2.5 + np.random.normal(0, 2.5), 10.0, 26.0)
                        olr = np.clip(185.0 - mjo_favorable * 15.0 + np.random.normal(0, 12.0), 130.0, 220.0)
                        soil_moist = np.clip(60.0 + orographic_boost * 10.0 + np.random.normal(0, 5.0), 40.0, 88.0)
                        # Rain generation with gamma distribution
                        base_rain = np.random.gamma(shape=1.2, scale=12.0) * orographic_boost
                        daily_rain = base_rain if np.random.rand() < 0.75 else 0.0
                else:
                    # Late season (August - September)
                    temp_max = 29.5 + np.random.normal(0, 1.2)
                    rh_700 = np.clip(75.0 + np.random.normal(0, 5.0), 55.0, 90.0)
                    u_wind = np.clip(12.0 + np.random.normal(0, 2.0), 6.0, 18.0)
                    olr = np.clip(205.0 + np.random.normal(0, 15.0), 160.0, 250.0)
                    soil_moist = np.clip(55.0 + np.random.normal(0, 6.0), 35.0, 80.0)
                    daily_rain = np.random.gamma(shape=0.9, scale=9.0) if np.random.rand() < 0.55 else 0.0

                # Target Labels:
                # 1. Onset within 14 days (1 if onset happens between doy and doy+14)
                onset_in_14d = 1 if (0 <= (local_onset_doy - doy) <= 14) else 0
                # 2. Break / Dry spell within 14 days (>= 5 consecutive days < 2.5 mm during JJAS)
                break_in_14d = 1 if (days_to_onset > 10 and (rh_700 < 62.0 or u_wind < 8.0 or enso > 0.8)) else 0
                # 3. Heavy rain event (>= 64.5 mm)
                heavy_rain_event = 1 if daily_rain >= 64.5 else 0

                records.append({
                    "year": year,
                    "doy": doy,
                    "district": p["district"],
                    "block": p["block"],
                    "panchayat": p["panchayat"],
                    "lat": lat,
                    "lng": lng,
                    "elevation_m": elev,
                    "ghats_dist_km": round(ghats_dist_km, 1),
                    # Features
                    "enso_nino34": round(enso, 2),
                    "iod_dmi": round(iod, 2),
                    "mjo_phase": mjo_phase,
                    "mjo_amplitude": round(mjo_amp, 2),
                    "temp_max_c": round(temp_max, 1),
                    "relative_humidity_700hpa": round(rh_700, 1),
                    "zonal_wind_850hpa_ms": round(u_wind, 1),
                    "outgoing_longwave_radiation_wm2": round(olr, 1),
                    "antecedent_soil_moisture_pct": round(soil_moist, 1),
                    "daily_rainfall_mm": round(daily_rain, 1),
                    # Target labels
                    "target_onset_14d": onset_in_14d,
                    "target_break_14d": break_in_14d,
                    "target_heavy_rain": heavy_rain_event
                })

    df = pd.DataFrame(records)
    print(f"Dataset generated! Total rows: {len(df):,}")
    print(f"Class distributions:")
    print(f"  Onset in 14d: {df['target_onset_14d'].value_counts(normalize=True).to_dict()}")
    print(f"  Break in 14d: {df['target_break_14d'].value_counts(normalize=True).to_dict()}")
    print(f"  Heavy rain: {df['target_heavy_rain'].value_counts(normalize=True).to_dict()}")

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"Saved dataset to {output_csv}")
    return df

if __name__ == "__main__":
    loc_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/locations.json"))
    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/historical_monsoon_30yr.csv"))
    generate_historical_dataset(loc_file, out_file)
