import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Rect, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

interface OHLCVDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma?: number;
  bbUpper?: number;
  bbLower?: number;
}

interface CandlestickChartProps {
  data: OHLCVDataPoint[];
  height?: number;
  indicators?: {
    sma: boolean;
    bollingerBands: boolean;
    trend: boolean;
  };
}

// Helpers
function computeSMA(data: OHLCVDataPoint[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    result.push(sum / period);
  }
  return result;
}

function computeBollingerBands(data: OHLCVDataPoint[], period: number, stdDevMult: number) {
  const smaValues = computeSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (smaValues[i] === null) { upper.push(null); lower.push(null); continue; }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += Math.pow(data[j].close - smaValues[i]!, 2);
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper.push(smaValues[i]! + stdDevMult * stdDev);
    lower.push(smaValues[i]! - stdDevMult * stdDev);
  }
  return { sma: smaValues, upper, lower };
}

export function CandlestickChart({
  data,
  height = 300,
  indicators = { sma: true, bollingerBands: true, trend: true }
}: CandlestickChartProps) {
  const [width, setWidth] = React.useState(0);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noData}>No chart data available</Text>
      </View>
    );
  }

  // Pre-calculate indicators
  const bb = computeBollingerBands(data, 20, 2);

  // Define drawing area
  // Left axis needs some padding, say 40px
  const yAxisWidth = 45;
  const paddingLeft = yAxisWidth + 5;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 20;
  const chartWidth = Math.max(1, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(1, height - paddingTop - paddingBottom);

  // Min and Max for Y axis
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  data.forEach(d => {
    if (d.low < minPrice) minPrice = d.low;
    if (d.high > maxPrice) maxPrice = d.high;
  });

  // Include indicator bounds
  if (indicators.bollingerBands) {
    bb.upper.forEach(v => { if (v !== null && v > maxPrice) maxPrice = v; });
    bb.lower.forEach(v => { if (v !== null && v < minPrice) minPrice = v; });
  }

  const priceRange = maxPrice - minPrice || 1; // avoid division by zero

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = chartWidth / data.length;
  const candleBodyWidth = Math.max(1, candleWidth * 0.6);

  // Generate paths for lines
  const generateLinePath = (values: (number | null)[]) => {
    return values.map((val, i) => {
      if (val === null) return '';
      const x = paddingLeft + i * candleWidth + candleWidth / 2;
      const y = getY(val);
      return `${i === 0 || values[i - 1] === null ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Axis marks (left side)
  const ticks = [minPrice, minPrice + priceRange * 0.25, minPrice + priceRange * 0.5, minPrice + priceRange * 0.75, maxPrice];

  return (
    <View style={[styles.container, { height }]} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* Y Axis Grid & Labels */}
          {ticks.map((t, i) => {
            const y = getY(t);
            return (
              <G key={`tick-${i}`}>
                <Line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                <SvgText x={paddingLeft - 5} y={y + 4} fill="rgba(255,255,255,0.4)" fontSize={10} textAnchor="end">
                  {t.toFixed(2)}
                </SvgText>
              </G>
            );
          })}

          {/* Candlesticks */}
          {data.map((d, i) => {
            const xCenter = paddingLeft + i * candleWidth + candleWidth / 2;
            const xBody = xCenter - candleBodyWidth / 2;
            const yHigh = getY(d.high);
            const yLow = getY(d.low);
            const yOpen = getY(d.open);
            const yClose = getY(d.close);
            const color = d.close >= d.open ? colors.emerald : colors.red;
            
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));

            return (
              <G key={`candle-${i}`}>
                <Line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth={1} />
                <Rect x={xBody} y={bodyTop} width={candleBodyWidth} height={bodyHeight} fill={color} />
              </G>
            );
          })}

          {/* Indicators */}
          {indicators.sma && (
            <Svg>
              <path d={generateLinePath(bb.sma)} stroke="#fbbf24" strokeWidth={2} fill="none" />
            </Svg>
          )}

          {indicators.bollingerBands && (
            <G>
              <Svg><path d={generateLinePath(bb.upper)} stroke="rgba(56, 189, 248, 0.5)" strokeWidth={1} fill="none" /></Svg>
              <Svg><path d={generateLinePath(bb.lower)} stroke="rgba(56, 189, 248, 0.5)" strokeWidth={1} fill="none" /></Svg>
            </G>
          )}

          {indicators.trend && data.length >= 2 && (
            <Line 
              x1={paddingLeft + candleWidth / 2} 
              y1={getY(data[0].low * 0.95)} 
              x2={paddingLeft + (data.length - 1) * candleWidth + candleWidth / 2} 
              y2={getY(data[data.length - 1].low * 1.05)} 
              stroke="#a78bfa" 
              strokeWidth={2} 
              strokeDasharray="4 4" 
            />
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  noData: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 100,
  }
});
