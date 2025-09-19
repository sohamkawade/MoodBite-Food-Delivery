import React, { useEffect, useState } from "react";
import { 
  MdAnalytics,
  MdFileDownload,

} from "react-icons/md";
import { analyticsAPI } from "../../services/api";

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsAPI.summary();
        if (res.success) setSummary(res.data);
      } catch {}
    })();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Professional Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdAnalytics size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Overview</h1>
              <p className="text-gray-600 text-sm">Key insights and performance metrics</p>
            </div>
          </div>
          <button className="px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center space-x-2 text-sm">
            <MdFileDownload size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Time Period Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          {['7 Days', '1 Month', '3 Months', '6 Months', '1 Year'].map((period) => (
            <button
              key={period}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.toLowerCase().replace(' ', '')
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedPeriod(period.toLowerCase().replace(' ', ''))}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Chart with Better Design */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Revenue Analytics</h2>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-green-600">₹{(summary?.topRestaurants||[]).reduce((s,r)=>s+(r.sales||0),0)}</div>
            <div className="text-xs sm:text-sm text-gray-600">Estimated Revenue</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="h-56 sm:h-64 min-w-max mx-auto flex items-end justify-center gap-3 sm:gap-6 px-2">
            {(() => {
              if (selectedPeriod === '7days') {
                return [45, 68, 52, 78, 65, 82, 71].map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-6 sm:w-12 md:w-16 bg-orange-500 rounded-t-lg transition-all hover:bg-orange-600 hover:scale-105 hover:shadow-lg cursor-pointer border border-orange-600" 
                      style={{ height: `${height * 2}px` }}
                    ></div>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 font-medium">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                    </span>
                  </div>
                ));
              } else if (selectedPeriod === '1month') {
                return Array.from({length: 30}, (_, i) => Math.floor(Math.random() * 60) + 30).map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-2.5 sm:w-3 bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 hover:scale-105 hover:shadow-lg cursor-pointer border border-blue-600" 
                      style={{ height: `${height * 2}px` }}
                    ></div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 mt-1 sm:mt-2 font-medium">
                      {index % 5 === 0 ? index + 1 : ''}
                    </span>
                  </div>
                ));
              } else if (selectedPeriod === '3months') {
                return [65, 78, 82, 71, 89, 76, 84, 91, 88, 95, 87, 92].map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-10 sm:w-16 bg-green-500 rounded-t-lg transition-all hover:bg-green-600 hover:scale-105 hover:shadow-lg cursor-pointer border border-green-600" 
                      style={{ height: `${height * 2}px` }}
                    ></div>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 font-medium">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
                  </div>
                ));
              } else if (selectedPeriod === '6months') {
                return [72, 85, 78, 91, 88, 96].map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 sm:w-20 bg-purple-500 rounded-t-lg transition-all hover:bg-purple-600 hover:scale-105 hover:shadow-lg cursor-pointer border border-purple-600" 
                      style={{ height: `${height * 2}px` }}
                    ></div>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 font-medium">
                      {['Jan-Jun', 'Jul-Dec', 'Jan-Jun', 'Jul-Dec', 'Jan-Jun', 'Jul-Dec'][index]}
                    </span>
                  </div>
                ));
              } else if (selectedPeriod === '1year') {
                return [65, 78, 82, 71, 89, 76, 84, 91, 88, 95, 87, 92].map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-10 sm:w-16 bg-red-500 rounded-t-lg transition-all hover:bg-red-600 hover:scale-105 hover:shadow-lg cursor-pointer border border-red-600" 
                      style={{ height: `${height * 2}px` }}
                    ></div>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 font-medium">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
                  </div>
                ));
              }
            })()}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 text-center">
          <div className="inline-flex items-center space-x-3 sm:space-x-4 text-[11px] sm:text-sm text-gray-600">
            <span>Low: ₹2,100</span>
            <span>High: ₹8,900</span>
            <span>Avg: ₹5,200</span>
          </div>
        </div>
      </div>

      {/* Simple Stats Grid - Different from Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">₹156</div>
            <div className="text-sm text-gray-600">Average Order Value</div>
            <div className="text-xs text-green-600 mt-1">↑ 12% from last week</div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">4.8</div>
            <div className="text-sm text-gray-600">Customer Rating</div>
            <div className="text-xs text-blue-600 mt-1">⭐ ⭐ ⭐ ⭐ ⭐</div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">23 min</div>
            <div className="text-sm text-gray-600">Avg Delivery Time</div>
            <div className="text-xs text-green-600 mt-1">↓ 5 min faster</div>
          </div>
        </div>
      </div>

      {/* Simple Popular Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Top Selling Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1 sm:mb-2">156</div>
            <div className="text-sm text-gray-700">Margherita Pizza</div>
            <div className="text-xs text-orange-600 mt-1">Most Popular</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1 sm:mb-2">134</div>
            <div className="text-sm text-gray-700">Chicken Burger</div>
            <div className="text-xs text-green-600 mt-1">Fast Moving</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">98</div>
            <div className="text-sm text-gray-700">Pasta Carbonara</div>
            <div className="text-xs text-blue-600 mt-1">Trending</div>
          </div>
        </div>
      </div>

      {/* Bottom Margin */}
      <div className="pb-16 sm:pb-20"></div>
    </div>
  );
};

export default Analytics;
