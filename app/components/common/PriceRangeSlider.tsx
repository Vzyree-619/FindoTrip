import { useState, useEffect, useCallback, useRef } from "react";

interface PriceRangeSliderProps {
  minPrice: number;
  maxPrice: number;
  currentMin: number;
  currentMax: number;
  onRangeChange: (min: number, max: number) => void;
  currency?: string;
  step?: number;
}

export default function PriceRangeSlider({
  minPrice,
  maxPrice,
  currentMin,
  currentMax,
  onRangeChange,
  currency = "PKR",
  step = 100
}: PriceRangeSliderProps) {
  const [minValue, setMinValue] = useState(currentMin);
  const [maxValue, setMaxValue] = useState(currentMax);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<null | 'min' | 'max'>(null);

  useEffect(() => {
    setMinValue(currentMin);
    setMaxValue(currentMax);
  }, [currentMin, currentMax]);

  const clamp = (v: number) => Math.max(minPrice, Math.min(v, maxPrice));
  const quantize = (v: number) => {
    const s = Math.max(1, step);
    return Math.round((v - minPrice) / s) * s + minPrice;
  };

  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return minPrice;
    const rect = el.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    const raw = minPrice + pct * (maxPrice - minPrice);
    return clamp(quantize(raw));
  };

  const startDrag = (which: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    draggingRef.current = which;
    (document as any).addEventListener('mousemove', onDrag as any);
    (document as any).addEventListener('touchmove', onDrag as any, { passive: false });
    (document as any).addEventListener('mouseup', endDrag as any);
    (document as any).addEventListener('touchend', endDrag as any);
    e.preventDefault();
  };

  const onDrag = (e: MouseEvent | TouchEvent) => {
    const point = (e as TouchEvent).touches?.[0] || (e as MouseEvent);
    if (!point) return;
    const val = valueFromClientX((point as any).clientX);
    if (draggingRef.current === 'min') {
      const newMin = Math.min(val, maxValue - Math.max(1, step));
      setMinValue(newMin);
      onRangeChange(newMin, maxValue);
    } else if (draggingRef.current === 'max') {
      const newMax = Math.max(val, minValue + Math.max(1, step));
      setMaxValue(newMax);
      onRangeChange(minValue, newMax);
    }
    e.preventDefault?.();
  };

  const endDrag = () => {
    draggingRef.current = null;
    (document as any).removeEventListener('mousemove', onDrag as any);
    (document as any).removeEventListener('touchmove', onDrag as any);
    (document as any).removeEventListener('mouseup', endDrag as any);
    (document as any).removeEventListener('touchend', endDrag as any);
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const clickVal = valueFromClientX(e.clientX);
    // Move nearest handle
    const distToMin = Math.abs(clickVal - minValue);
    const distToMax = Math.abs(clickVal - maxValue);
    if (distToMin <= distToMax) {
      const newMin = Math.min(clickVal, maxValue - Math.max(1, step));
      setMinValue(newMin);
      onRangeChange(newMin, maxValue);
    } else {
      const newMax = Math.max(clickVal, minValue + Math.max(1, step));
      setMaxValue(newMax);
      onRangeChange(minValue, newMax);
    }
  };

  const handleSliderChange = useCallback((newMin: number, newMax: number) => {
    setMinValue(newMin);
    setMaxValue(newMax);
    onRangeChange(newMin, newMax);
  }, [onRangeChange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('PKR', currency);
  };

  const rangeSpan = Math.max(1, (maxPrice - minPrice));
  const rawMinPct = ((minValue - minPrice) / rangeSpan) * 100;
  const rawMaxPct = ((maxValue - minPrice) / rangeSpan) * 100;
  const minPercentage = Math.max(0, Math.min(100, rawMinPct));
  const maxPercentage = Math.max(0, Math.min(100, rawMaxPct));

  return (
    <div className="w-full max-w-full md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-hidden box-border">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Price Range</h3>
        <p className="text-sm text-gray-600">Select your budget range</p>
      </div>

      {/* Price Display: row on mobile, column on desktop */}
      <div className="mb-6 flex flex-row md:flex-col items-stretch md:items-center gap-3">
        {/* Min Card */}
        <div className="flex-1 md:w-[300px] min-w-0">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center w-full">
            <div className="text-xs text-gray-500 mb-1">Min Price</div>
            <div className="font-bold text-[#01502E] text-base md:text-lg whitespace-normal md:whitespace-nowrap">
              {formatPrice(minValue)}
            </div>
          </div>
        </div>
        {/* Separator: vertical on mobile, horizontal on desktop */}
        <div className="flex items-center justify-center">
          {/* Vertical line (mobile) */}
          <div className="h-10 w-px bg-gradient-to-b from-[#01502E] to-[#22c55e] md:hidden" />
          {/* Horizontal line (desktop) */}
          <div className="hidden md:block h-px w-24 bg-gradient-to-r from-[#01502E] to-[#22c55e]" />
        </div>
        {/* Max Card */}
        <div className="flex-1 md:w-[300px] min-w-0">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center w-full">
            <div className="text-xs text-gray-500 mb-1">Max Price</div>
            <div className="font-bold text-[#01502E] text-base md:text-lg whitespace-normal md:whitespace-nowrap">
              {formatPrice(maxValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Slider Container (custom dual-thumb slider) */}
      <div className="relative mb-6 select-none" ref={trackRef} onClick={onTrackClick}>
        {/* Track */}
        <div className="w-full h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full shadow-inner" />
        {/* Active range */}
        <div
          className="absolute top-0 h-3 bg-gradient-to-r from-[#01502E] via-[#22c55e] to-[#01502E] rounded-full shadow-lg"
          style={{
            left: `${Math.min(minPercentage, maxPercentage)}%`,
            width: `${Math.max(0, maxPercentage - minPercentage)}%`,
          }}
        />
        {/* Min handle */}
        <button
          type="button"
          className="absolute -top-1 w-5 h-5 rounded-full border-4 border-white shadow ring-2 ring-[#01502E] bg-[#22c55e] cursor-pointer"
          style={{ left: `calc(${minPercentage}% - 10px)` }}
          onMouseDown={startDrag('min')}
          onTouchStart={startDrag('min')}
          aria-label="Minimum price"
        />
        {/* Max handle */}
        <button
          type="button"
          className="absolute -top-1 w-5 h-5 rounded-full border-4 border-white shadow ring-2 ring-[#01502E] bg-[#22c55e] cursor-pointer"
          style={{ left: `calc(${maxPercentage}% - 10px)` }}
          onMouseDown={startDrag('max')}
          onTouchStart={startDrag('max')}
          aria-label="Maximum price"
        />
      </div>

      {/* Price Range Labels */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
          {formatPrice(minPrice)}
        </div>
        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
          {formatPrice(maxPrice)}
        </div>
      </div>

      {/* Quick Price Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => handleSliderChange(minPrice, Math.floor(maxPrice * 0.3))}
          className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Budget
        </button>
        <button
          onClick={() => handleSliderChange(Math.floor(maxPrice * 0.3), Math.floor(maxPrice * 0.6))}
          className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Mid-range
        </button>
        <button
          onClick={() => handleSliderChange(Math.floor(maxPrice * 0.6), Math.floor(maxPrice * 0.8))}
          className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Premium
        </button>
        <button
          onClick={() => handleSliderChange(Math.floor(maxPrice * 0.8), maxPrice)}
          className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Luxury
        </button>
      </div>

      <style jsx>{`
        .slider-thumb-min::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #01502E, #22c55e);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(1, 80, 46, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .slider-thumb-min::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(1, 80, 46, 0.4), 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .slider-thumb-max::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #01502E);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(1, 80, 46, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .slider-thumb-max::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(1, 80, 46, 0.4), 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .slider-thumb-min::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #01502E, #22c55e);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(1, 80, 46, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .slider-thumb-max::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #01502E);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(1, 80, 46, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .slider-thumb-min::-webkit-slider-track {
          background: transparent;
        }

        .slider-thumb-max::-webkit-slider-track {
          background: transparent;
        }

        .slider-thumb-min::-moz-range-track {
          background: transparent;
        }

        .slider-thumb-max::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
