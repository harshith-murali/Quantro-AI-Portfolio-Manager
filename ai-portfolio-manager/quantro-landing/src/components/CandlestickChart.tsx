import React, { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi } from "lightweight-charts";

interface OHLCVDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // pre-computed indicators (optional — we'll compute if missing)
  sma?: number;
  bbUpper?: number;
  bbLower?: number;
}

interface IndicatorVisibility {
  sma: boolean;
  bollingerBands: boolean;
  trend: boolean;
}

interface CandlestickChartProps {
  data: OHLCVDataPoint[];
  width?: number;
  height?: number;
  indicators?: IndicatorVisibility;
}

// ── Helpers: compute SMA & Bollinger Bands from raw close prices ──
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

function computeBollingerBands(data: OHLCVDataPoint[], period: number, stdDevMultiplier: number) {
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
    upper.push(smaValues[i]! + stdDevMultiplier * stdDev);
    lower.push(smaValues[i]! - stdDevMultiplier * stdDev);
  }
  return { sma: smaValues, upper, lower };
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  width = 600,
  height = 400,
  indicators = { sma: true, bollingerBands: true, trend: true },
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // 1. Create Chart — price scale on LEFT
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.6)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255,255,255,0.4)", labelBackgroundColor: "#1a1a1a" },
        horzLine: { color: "rgba(255,255,255,0.4)", labelBackgroundColor: "#1a1a1a" },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        // ★ Prevent scrolling right of the last bar into empty future space
        fixRightEdge: true,
        // Small right padding so the last candle is not jammed at the edge
        rightOffset: 5,
        // Allow free left scroll into historical data
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      // ★ LEFT price scale
      leftPriceScale: {
        visible: true,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        visible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    // 2. Candlestick Series — attach to left price scale
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#34d399",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
      priceScaleId: "left",
    });

    const candleData = data.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(candleData);

    // Compute indicators from raw data
    const bb = computeBollingerBands(data, 20, 2);

    // 3. SMA overlay
    if (indicators.sma) {
      const smaSeries = chart.addLineSeries({
        color: "#fbbf24",
        lineWidth: 2,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        priceScaleId: "left",
      });
      const smaData = data
        .map((d, i) => ({ time: d.time, value: d.sma ?? bb.sma[i] }))
        .filter((d) => d.value !== null) as { time: string; value: number }[];
      smaSeries.setData(smaData);
    }

    // 4. Bollinger Bands
    if (indicators.bollingerBands) {
      const upperBB = chart.addLineSeries({
        color: "rgba(56, 189, 248, 0.5)",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        priceScaleId: "left",
      });
      const lowerBB = chart.addLineSeries({
        color: "rgba(56, 189, 248, 0.5)",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        priceScaleId: "left",
      });
      const upperData = data
        .map((d, i) => ({ time: d.time, value: d.bbUpper ?? bb.upper[i] }))
        .filter((d) => d.value !== null) as { time: string; value: number }[];
      const lowerData = data
        .map((d, i) => ({ time: d.time, value: d.bbLower ?? bb.lower[i] }))
        .filter((d) => d.value !== null) as { time: string; value: number }[];
      upperBB.setData(upperData);
      lowerBB.setData(lowerData);
    }

    // 5. Trend Line
    if (indicators.trend && data.length >= 2) {
      const trendLine = chart.addLineSeries({
        color: "#a78bfa",
        lineWidth: 2,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        priceScaleId: "left",
      });
      trendLine.setData([
        { time: data[0].time, value: data[0].low * 0.95 },
        { time: data[data.length - 1].time, value: data[data.length - 1].low * 1.05 },
      ]);
    }

    // 6. Volume pane (bottom overlay — separate scale)
    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(52, 211, 153, 0.2)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    chart.priceScale("").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close > d.open ? "rgba(52, 211, 153, 0.3)" : "rgba(248, 113, 113, 0.3)",
      }))
    );

    // ★ Show ALL loaded candles on first render, then snap right edge to latest bar.
    //   fitContent() zooms out so every bar in the dataset is visible;
    //   scrollToRealTime() then anchors the view to the rightmost (latest) candle.
    //   Users can freely zoom out and scroll left to explore full history.
    chart.timeScale().fitContent();
    chart.timeScale().scrollToRealTime();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, height, indicators.sma, indicators.bollingerBands, indicators.trend]);

  return (
    <div className="relative w-full h-full">
      <div ref={chartContainerRef} className="w-full" style={{ height }} />
    </div>
  );
};
