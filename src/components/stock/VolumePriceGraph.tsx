"use client";

import { useMemo, useState } from 'react';
import { Area, Bar, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RangeSelector, RangeValue } from '../terminal/RangeSelector';

interface VolumePriceGraphProps {
  symbol: string;
  data: any[];
  isLoading: boolean;
  range: RangeValue;
  onRangeChange: (r: RangeValue) => void;
}

export function VolumePriceGraph({ symbol, data, isLoading, range, onRangeChange }: VolumePriceGraphProps) {
  const chartId = useMemo(() => `vpColor-${symbol.replace(/[^a-zA-Z0-9]/g, "")}`, [symbol]);

  // Determine if the overall trend is positive or negative for color coding
  const displayChange = useMemo(() => {
    if (!data || data.length < 2) return 0;
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    return lastPrice - firstPrice;
  }, [data]);

  const isPositive = displayChange >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center border border-border rounded-xl bg-card">
        <div className="text-center">
          <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center border border-border rounded-xl bg-card">
        <div className="text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No historical data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-card border border-border w-full shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Volume & Price Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualizing trading volume distribution alongside price trends for {symbol}.
          </p>
        </div>

        <div className="bg-background/50 rounded-lg p-1 border border-border">
          <RangeSelector activeRange={range} onRangeChange={onRangeChange} />
        </div>
      </div>

      <div className="h-[400px] md:h-[500px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Grid for readability */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />

            {/* X-Axis (Time) */}
            <XAxis
              dataKey="time"
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
              minTickGap={40}
              dy={12}
            />

            {/* Y-Axis (Price) - Right Side */}
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
            />

            {/* Y-Axis (Volume) - Hidden, scaled to take up bottom ~30% */}
            <YAxis
              yAxisId="volume"
              orientation="left"
              hide={true}
              domain={[0, (dataMax: number) => dataMax * 3.5]} // Multiplier makes bars shorter
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '8px' }}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value: any, name: any) => {
                if (name === "price") return [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Price'];
                if (name === "volume") return [Number(value).toLocaleString('en-IN'), 'Volume'];
                return [value, name as string];
              }}
            />

            {/* Volume Bars (Background layer) */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="hsl(var(--primary))"
              fillOpacity={0.4}
              radius={[2, 2, 0, 0]}
              name="volume"
            />

            {/* Price Line (Foreground layer) */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${chartId})`}
              name="price"
              activeDot={{ r: 4, fill: strokeColor, stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
