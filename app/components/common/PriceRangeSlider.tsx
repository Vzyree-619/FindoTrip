import { useState, useEffect, useCallback } from "react";

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

  useEffect(() => {
    setMinValue(currentMin);
    setMaxValue(currentMax);
  }, [currentMin, currentMax]);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const newMin = Math.min(value, maxValue - step);
    setMinValue(newMin);
    onRangeChange(newMin, maxValue);
  }, [maxValue, step, onRangeChange]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const newMax = Math.max(value, minValue + step);
    setMaxValue(newMax);
    onRangeChange(minValue, newMax);
  }, [minValue, step, onRangeChange]);

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

  const minPercentage = ((minValue - minPrice) / (maxPrice - minPrice)) * 100;
  const maxPercentage = ((maxValue - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Price Range</h3>
        <p className="text-sm text-gray-600">Select your budget range</p>
      </div>

      {/* Price Display Cards */}
      <div className="flex justify-between items-center mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 min-w-[120px] text-center">
          <div className="text-xs text-gray-500 mb-1">Min Price</div>
          <div className="text-lg font-bold text-[#01502E]">
            {formatPrice(minValue)}
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gradient-to-r from-[#01502E] to-[#22c55e]"></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 min-w-[120px] text-center">
          <div className="text-xs text-gray-500 mb-1">Max Price</div>
          <div className="text-lg font-bold text-[#01502E]">
            {formatPrice(maxValue)}
          </div>
        </div>
      </div>

      {/* Enhanced Slider Container */}
      <div className="relative mb-6">
        {/* Background Track with Gradient */}
        <div className="w-full h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full shadow-inner">
          {/* Active Range with Gradient */}
          <div
            className="absolute h-3 bg-gradient-to-r from-[#01502E] via-[#22c55e] to-[#01502E] rounded-full shadow-lg"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />
        </div>

        {/* Min Slider */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer slider-thumb-min"
          style={{
            background: 'transparent',
            zIndex: 3,
          }}
        />

        {/* Max Slider */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer slider-thumb-max"
          style={{
            background: 'transparent',
            zIndex: 4,
          }}
        />
      </div>

      {/* Price Range Labels */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
          {formatPrice(minPrice)}
        </div>
        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
          {formatPrice(maxPrice)}
        </div>
      </div>

      {/* Quick Price Buttons */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <button
          onClick={() => handleSliderChange(minPrice, Math.floor(maxPrice * 0.3))}
          className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Budget
        </button>
        <button
          onClick={() => handleSliderChange(Math.floor(maxPrice * 0.3), Math.floor(maxPrice * 0.6))}
          className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Mid-range
        </button>
        <button
          onClick={() => handleSliderChange(Math.floor(maxPrice * 0.6), Math.floor(maxPrice * 0.8))}
          className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
        >
          Premium
        </button>
        <button
          onClick={() => handleSliderChange(Math.floor(maxPrice * 0.8), maxPrice)}
          className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-[#01502E] hover:text-white transition-all duration-200 text-center"
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
