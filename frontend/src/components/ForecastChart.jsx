import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-300 shadow-md p-2.5 rounded text-xs">
        <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5">{label}</p>
        {payload[0] && (
          <p className="text-agri-secondary font-medium">
            Expected Rain: <span className="font-black">{payload[0].value} mm</span>
          </p>
        )}
        {payload[1] && (
          <p className="text-agri-primary font-medium">
            Rain Probability: <span className="font-black">{payload[1].value}%</span>
          </p>
        )}
        {payload[2] && (
          <p className="text-sky-600 font-medium">
            Soil Moisture: <span className="font-black">{payload[2].value}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function ForecastChart({ dailyForecast, forecastDays, t }) {
  const data = dailyForecast || [];

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
      {/* Bulletin-style header */}
      <div className="bg-agri-secondary text-white px-4 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            DAILY RAINFALL OUTLOOK
          </span>
          <h3 className="text-sm font-extrabold">
            {forecastDays}-Day Ensemble Probability Trend & Soil Moisture Index
          </h3>
        </div>
        <div className="text-xs font-mono bg-[#081827] text-emerald-300 px-2 py-1 rounded border border-slate-700">
          NCMRWF / IMD WRF
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72 w-full px-3 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#475569' }}
              stroke="#94a3b8"
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 10, fill: '#0f2942' }}
              stroke="#0f2942"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#14532d' }}
              stroke="#14532d"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <ReferenceLine
              yAxisId="left"
              y={25}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{ value: 'Heavy rain threshold (25mm)', fill: '#dc2626', fontSize: 9, position: 'top' }}
            />
            <Bar
              yAxisId="left"
              dataKey="expected_rainfall_mm"
              name={t.chart_rain_bar}
              fill="#0f2942"
              radius={[3, 3, 0, 0]}
              barSize={forecastDays > 14 ? 10 : 18}
              opacity={0.85}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rainfall_probability"
              name={t.chart_prob_line}
              stroke="#14532d"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#14532d', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="soil_moisture_percent"
              name={t.chart_moisture}
              stroke="#0284c7"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Note */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-slate-500">
        <span>* Bars = daily forecasted rainfall (mm) | Lines = probability curves. Soil moisture &gt;45% = sowing-ready threshold.</span>
        <span className="font-mono text-slate-400 shrink-0">Model Grid: 5km × 5km</span>
      </div>
    </div>
  );
}
