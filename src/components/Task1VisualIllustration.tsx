'use client';

import React, { useState } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  BarChart3, 
  LineChart, 
  PieChart as PieChartIcon, 
  GitCommit, 
  Map, 
  Table as TableIcon,
  Info
} from 'lucide-react';
import { IllustrationType } from '@/types/ielts';

interface Task1VisualIllustrationProps {
  promptId: string;
  illustrationType?: IllustrationType;
  title?: string;
  compact?: boolean;
}

export const Task1VisualIllustration: React.FC<Task1VisualIllustrationProps> = ({
  promptId,
  illustrationType,
  title,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Render the appropriate diagram based on promptId or illustrationType
  const renderDiagram = () => {
    switch (promptId) {
      case 'task1-acad-water-consumption':
        return <LineGraphWaterUsage />;
      case 'task1-acad-electricity-production':
        return <BarChartElectricity />;
      case 'task1-acad-household-expenditure':
        return <PieChartsExpenditure />;
      case 'task1-acad-brick-manufacturing':
        return <ProcessDiagramBricks />;
      case 'task1-acad-hydroelectric-dam':
        return <ProcessDiagramHydroelectric />;
      case 'task1-acad-norbiton-town-map':
        return <MapComparisonNorbiton />;
      case 'task1-acad-felixstone-coastal-resort':
        return <MapComparisonFelixstone />;
      case 'task1-acad-tourist-destinations-table':
        return <TableTouristData />;
      default:
        if (illustrationType === 'BAR_CHART') return <BarChartElectricity />;
        if (illustrationType === 'PIE_CHARTS') return <PieChartsExpenditure />;
        if (illustrationType === 'PROCESS_DIAGRAM') return <ProcessDiagramBricks />;
        if (illustrationType === 'MAP_COMPARISON') return <MapComparisonNorbiton />;
        if (illustrationType === 'TABLE') return <TableTouristData />;
        return <LineGraphWaterUsage />;
    }
  };

  const getIcon = () => {
    switch (illustrationType) {
      case 'BAR_CHART': return <BarChart3 className="h-4 w-4" />;
      case 'PIE_CHARTS': return <PieChartIcon className="h-4 w-4" />;
      case 'PROCESS_DIAGRAM': return <GitCommit className="h-4 w-4" />;
      case 'MAP_COMPARISON': return <Map className="h-4 w-4" />;
      case 'TABLE': return <TableIcon className="h-4 w-4" />;
      default: return <LineChart className="h-4 w-4" />;
    }
  };

  return (
    <>
      {/* Standard / Inline Card View */}
      <div className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 shadow-md ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}>
        <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-100 dark:border-gray-800/80 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {getIcon()}
            </span>
            <span className="tracking-wide uppercase text-[11px] text-blue-900 dark:text-blue-300">
              Official Task 1 Visual Diagram
            </span>
            {title && <span className="text-slate-400 dark:text-gray-500 hidden sm:inline">• {title}</span>}
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 transition-colors"
            title="Expand diagram for detailed examination"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Enlarge View</span>
          </button>
        </div>

        {/* Diagram Container */}
        <div className="w-full flex justify-center items-center overflow-x-auto py-1">
          <div className="w-full max-w-3xl min-w-[320px]">
            {renderDiagram()}
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Select key trends, compare significant features, and support with data.</span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-gray-300">IELTS Academic Task 1</span>
        </div>
      </div>

      {/* Expanded Modal View for High-Res Examination */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950/50">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {getIcon()}
                </span>
                <span>{title || 'Official Task 1 Visual Illustration'}</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex justify-center items-center bg-slate-50/50 dark:bg-gray-950/20">
              <div className="w-full max-w-3xl">
                {renderDiagram()}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-gray-800 text-right bg-slate-50 dark:bg-gray-950/50">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white dark:bg-gray-200 dark:text-gray-950 font-bold text-xs"
              >
                Close Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --------------------------------------------------------------------------------
// 1. LINE GRAPH: Global Water Usage (1900–2000)
// --------------------------------------------------------------------------------
const LineGraphWaterUsage: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-2">
        Global Water Consumption by Sector (1900–2000) [km³ per year]
      </div>

      <svg viewBox="0 0 520 280" className="w-full h-auto text-xs">
        {/* Y Axis Grid lines & labels */}
        <g className="text-slate-400 dark:text-gray-500 font-mono text-[10px]">
          <line x1="60" y1="20" x2="480" y2="20" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="50" y="24" textAnchor="end" fill="currentColor">4000</text>

          <line x1="60" y1="70" x2="480" y2="70" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="50" y="74" textAnchor="end" fill="currentColor">3000</text>

          <line x1="60" y1="120" x2="480" y2="120" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="50" y="124" textAnchor="end" fill="currentColor">2000</text>

          <line x1="60" y1="170" x2="480" y2="170" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="50" y="174" textAnchor="end" fill="currentColor">1000</text>

          <line x1="60" y1="220" x2="480" y2="220" stroke="currentColor" strokeWidth="1.5" />
          <text x="50" y="224" textAnchor="end" fill="currentColor">0</text>
        </g>

        {/* X Axis line & labels */}
        <line x1="60" y1="20" x2="60" y2="220" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-gray-500" />

        <g className="text-slate-500 dark:text-gray-400 font-sans text-[10px]" textAnchor="middle">
          <text x="60" y="238">1900</text>
          <text x="144" y="238">1920</text>
          <text x="228" y="238">1940</text>
          <text x="312" y="238">1960</text>
          <text x="396" y="238">1980</text>
          <text x="480" y="238">2000</text>
        </g>

        {/* Line 1: Agriculture (Blue) - starts 500, ends 3000 */}
        <path
          d="M 60 195 Q 144 190 228 180 T 312 145 T 396 100 T 480 70"
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
        />
        {/* Points for Agriculture */}
        <circle cx="60" cy="195" r="4" fill="#2563eb" />
        <circle cx="144" cy="190" r="4" fill="#2563eb" />
        <circle cx="228" cy="180" r="4" fill="#2563eb" />
        <circle cx="312" cy="145" r="4" fill="#2563eb" />
        <circle cx="396" cy="100" r="4" fill="#2563eb" />
        <circle cx="480" cy="70" r="4.5" fill="#2563eb" />

        {/* Line 2: Industrial (Amber/Orange) - starts 100, ends 1000 */}
        <path
          d="M 60 215 Q 144 214 228 210 T 312 195 T 396 180 T 480 170"
          fill="none"
          stroke="#d97706"
          strokeWidth="3"
        />
        {/* Points for Industrial */}
        <circle cx="60" cy="215" r="4" fill="#d97706" />
        <circle cx="144" cy="214" r="4" fill="#d97706" />
        <circle cx="228" cy="210" r="4" fill="#d97706" />
        <circle cx="312" cy="195" r="4" fill="#d97706" />
        <circle cx="396" cy="180" r="4" fill="#d97706" />
        <circle cx="480" cy="170" r="4.5" fill="#d97706" />

        {/* Line 3: Domestic (Emerald Green) - starts 50, ends 400 */}
        <path
          d="M 60 218 Q 144 217 228 216 T 312 212 T 396 205 T 480 200"
          fill="none"
          stroke="#059669"
          strokeWidth="3"
        />
        {/* Points for Domestic */}
        <circle cx="60" cy="218" r="4" fill="#059669" />
        <circle cx="144" cy="217" r="4" fill="#059669" />
        <circle cx="228" cy="216" r="4" fill="#059669" />
        <circle cx="312" cy="212" r="4" fill="#059669" />
        <circle cx="396" cy="205" r="4" fill="#059669" />
        <circle cx="480" cy="200" r="4.5" fill="#059669" />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block" />
          <span className="font-semibold text-slate-800 dark:text-gray-200">Agriculture (3000 km³)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-600 inline-block" />
          <span className="font-semibold text-slate-800 dark:text-gray-200">Industrial (1000 km³)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
          <span className="font-semibold text-slate-800 dark:text-gray-200">Domestic (400 km³)</span>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 2. BAR CHART: Electricity Production by Source in 2020 (%)
// --------------------------------------------------------------------------------
const BarChartElectricity: React.FC = () => {
  const data = [
    { country: 'Germany', fossil: 44, nuclear: 12, renewable: 44 },
    { country: 'France', fossil: 9, nuclear: 67, renewable: 24 },
    { country: 'United Kingdom', fossil: 38, nuclear: 16, renewable: 46 },
    { country: 'Sweden', fossil: 2, nuclear: 30, renewable: 68 },
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-2">
        Electricity Generation by Source in 2020 (% of National Total)
      </div>

      <svg viewBox="0 0 520 260" className="w-full h-auto text-xs">
        {/* Y Axis Grid lines & labels */}
        <g className="text-slate-400 dark:text-gray-500 font-mono text-[10px]">
          <line x1="50" y1="20" x2="490" y2="20" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="42" y="24" textAnchor="end" fill="currentColor">80%</text>

          <line x1="50" y1="65" x2="490" y2="65" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="42" y="69" textAnchor="end" fill="currentColor">60%</text>

          <line x1="50" y1="110" x2="490" y2="110" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="42" y="114" textAnchor="end" fill="currentColor">40%</text>

          <line x1="50" y1="155" x2="490" y2="155" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
          <text x="42" y="159" textAnchor="end" fill="currentColor">20%</text>

          <line x1="50" y1="200" x2="490" y2="200" stroke="currentColor" strokeWidth="1.5" />
          <text x="42" y="204" textAnchor="end" fill="currentColor">0%</text>
        </g>

        {/* X Axis line */}
        <line x1="50" y1="20" x2="50" y2="200" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-gray-500" />

        {/* Bars for 4 countries */}
        {data.map((d, i) => {
          const groupX = 85 + i * 105;
          const barWidth = 24;
          const scale = 2.25; // 1% = 2.25px

          const fossilH = d.fossil * scale;
          const nuclearH = d.nuclear * scale;
          const renewH = d.renewable * scale;

          return (
            <g key={d.country}>
              {/* Country Label */}
              <text x={groupX + 36} y="220" textAnchor="middle" className="text-[11px] font-bold fill-slate-700 dark:fill-gray-300">
                {d.country}
              </text>

              {/* Fossil Fuels Bar */}
              <rect
                x={groupX}
                y={200 - fossilH}
                width={barWidth}
                height={fossilH}
                fill="#475569"
                rx="2"
              />
              <text x={groupX + 12} y={195 - fossilH} textAnchor="middle" className="text-[9px] font-bold fill-slate-600 dark:fill-gray-400">
                {d.fossil}%
              </text>

              {/* Nuclear Power Bar */}
              <rect
                x={groupX + 26}
                y={200 - nuclearH}
                width={barWidth}
                height={nuclearH}
                fill="#6366f1"
                rx="2"
              />
              <text x={groupX + 38} y={195 - nuclearH} textAnchor="middle" className="text-[9px] font-bold fill-indigo-600 dark:fill-indigo-300">
                {d.nuclear}%
              </text>

              {/* Renewable Energy Bar */}
              <rect
                x={groupX + 52}
                y={200 - renewH}
                width={barWidth}
                height={renewH}
                fill="#10b981"
                rx="2"
              />
              <text x={groupX + 64} y={195 - renewH} textAnchor="middle" className="text-[9px] font-bold fill-emerald-600 dark:fill-emerald-300">
                {d.renewable}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-1 pt-2 border-t border-slate-100 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-slate-600 inline-block" />
          <span className="font-semibold text-slate-800 dark:text-gray-200">Fossil Fuels</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-indigo-500 inline-block" />
          <span className="font-semibold text-slate-800 dark:text-gray-200">Nuclear Power</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
          <span className="font-semibold text-slate-800 dark:text-gray-200">Renewable Energy</span>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 3. PIE CHARTS: Household Spending Patterns (1980 vs 2020)
// --------------------------------------------------------------------------------
const PieChartsExpenditure: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-2">
        Household Budget Allocation by Category (1980 vs 2020)
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
        {/* 1980 Donut Chart */}
        <div className="flex flex-col items-center">
          <span className="font-bold text-xs text-slate-700 dark:text-gray-300 mb-1">Year 1980</span>
          <svg viewBox="0 0 160 160" className="w-36 h-36">
            {/* Slices calculated for 1980: Food 32%, Housing 22%, Transport 16%, Energy 18%, Recreation 12% */}
            {/* SVG donut chart with strokeDasharray */}
            <circle cx="80" cy="80" r="50" fill="none" stroke="#ef4444" strokeWidth="24" strokeDasharray="100.5 314" strokeDashoffset="0" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#3b82f6" strokeWidth="24" strokeDasharray="69 314" strokeDashoffset="-100.5" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#f59e0b" strokeWidth="24" strokeDasharray="50.2 314" strokeDashoffset="-169.5" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#8b5cf6" strokeWidth="24" strokeDasharray="56.5 314" strokeDashoffset="-219.7" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#10b981" strokeWidth="24" strokeDasharray="37.8 314" strokeDashoffset="-276.2" />
            <text x="80" y="84" textAnchor="middle" className="text-xs font-black fill-slate-900 dark:fill-white">1980</text>
          </svg>
          <div className="text-[11px] text-slate-600 dark:text-gray-400 mt-1">
            Food (32%) • Housing (22%)
          </div>
        </div>

        {/* 2020 Donut Chart */}
        <div className="flex flex-col items-center">
          <span className="font-bold text-xs text-slate-700 dark:text-gray-300 mb-1">Year 2020</span>
          <svg viewBox="0 0 160 160" className="w-36 h-36">
            {/* Slices for 2020: Housing 34%, Transport 21%, Recreation 19%, Food 17%, Energy 9% */}
            <circle cx="80" cy="80" r="50" fill="none" stroke="#3b82f6" strokeWidth="24" strokeDasharray="106.8 314" strokeDashoffset="0" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#f59e0b" strokeWidth="24" strokeDasharray="66 314" strokeDashoffset="-106.8" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#10b981" strokeWidth="24" strokeDasharray="59.7 314" strokeDashoffset="-172.8" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#ef4444" strokeWidth="24" strokeDasharray="53.4 314" strokeDashoffset="-232.5" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#8b5cf6" strokeWidth="24" strokeDasharray="28.1 314" strokeDashoffset="-285.9" />
            <text x="80" y="84" textAnchor="middle" className="text-xs font-black fill-slate-900 dark:fill-white">2020</text>
          </svg>
          <div className="text-[11px] text-slate-600 dark:text-gray-400 mt-1">
            Housing (34%) • Transport (21%)
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap mt-2 pt-2 border-t border-slate-100 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span className="font-medium text-slate-700 dark:text-gray-300">Housing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="font-medium text-slate-700 dark:text-gray-300">Food</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="font-medium text-slate-700 dark:text-gray-300">Transport</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
          <span className="font-medium text-slate-700 dark:text-gray-300">Energy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span className="font-medium text-slate-700 dark:text-gray-300">Recreation</span>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 4. PROCESS DIAGRAM: Brick Manufacturing Flowchart
// --------------------------------------------------------------------------------
const ProcessDiagramBricks: React.FC = () => {
  const steps = [
    { num: '1', title: 'Clay Extraction', desc: 'Digger excavates raw clay from quarry.' },
    { num: '2', title: 'Metal Grid & Roller', desc: 'Clay crushed into fine, uniform powder.' },
    { num: '3', title: 'Sand & Water Mix', desc: 'Added to create moist malleable mixture.' },
    { num: '4', title: 'Shaping Options', desc: 'Wire cutter slicing OR hydraulic mould.' },
    { num: '5', title: 'Drying Kiln', desc: 'Drying oven for 24–48 hours.' },
    { num: '6', title: 'Kiln Firing', desc: 'Moderate (200-980°C) then High (up to 1300°C).' },
    { num: '7', title: 'Cooling Chamber', desc: 'Cooled gradually for 48–72 hours.' },
    { num: '8', title: 'Packaging & Delivery', desc: 'Loaded into trucks for construction delivery.' }
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-3">
        Sequential Stages in Industrial Brick Manufacturing
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {steps.map((s, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700/60 relative flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="h-5 w-5 rounded-full bg-amber-500 text-gray-950 font-black text-[10px] flex items-center justify-center">
                {s.num}
              </span>
              {idx < steps.length - 1 && (
                <span className="text-slate-400 dark:text-gray-500 text-xs font-bold">➔</span>
              )}
            </div>
            <div>
              <div className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight mb-1">
                {s.title}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 leading-snug">
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
        <span>🔄 <strong>Process Type:</strong> Linear industrial manufacturing process with two distinct thermal phases.</span>
        <span className="font-semibold text-xs">8 Core Steps</span>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 5. MAP COMPARISON: Town of Norbiton Redevelopment (Before vs Proposed)
// --------------------------------------------------------------------------------
const MapComparisonNorbiton: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-3">
        Town of Norbiton: Existing Layout vs Proposed Municipal Redevelopment Plan
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Map 1: Current / Existing */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">Existing Industrial Site</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-gray-700 text-[10px] font-bold text-slate-700 dark:text-gray-300">PRESENT</span>
          </div>

          <svg viewBox="0 0 240 160" className="w-full h-auto bg-slate-100 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
            {/* River at top */}
            <path d="M 0 20 Q 80 15 140 25 T 240 20" stroke="#0284c7" strokeWidth="12" fill="none" />
            <text x="200" y="32" className="text-[8px] fill-sky-800 dark:fill-sky-300 font-bold">River</text>

            {/* Farmland north-east */}
            <rect x="150" y="30" width="80" height="25" fill="#86efac" fillOpacity="0.4" stroke="#22c55e" strokeDasharray="2 2" />
            <text x="190" y="45" textAnchor="middle" className="text-[8px] fill-emerald-800 dark:fill-emerald-300 font-semibold">Farmland</text>

            {/* Central Roundabout & Main Road */}
            <circle cx="90" cy="80" r="14" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
            <line x1="90" y1="94" x2="90" y2="160" stroke="#94a3b8" strokeWidth="6" />
            <text x="96" y="140" className="text-[7px] fill-slate-600 dark:fill-gray-400 font-bold">To Town Center</text>

            {/* Factories (Existing) */}
            <rect x="130" y="70" width="40" height="30" fill="#94a3b8" stroke="#475569" />
            <text x="150" y="87" textAnchor="middle" className="text-[7.5px] fill-white font-bold">Factory 1</text>

            <rect x="135" y="110" width="45" height="28" fill="#94a3b8" stroke="#475569" />
            <text x="157" y="127" textAnchor="middle" className="text-[7.5px] fill-white font-bold">Factory 2</text>

            {/* Residential Area West */}
            <rect x="15" y="65" width="45" height="35" fill="#fed7aa" stroke="#f97316" />
            <text x="37" y="85" textAnchor="middle" className="text-[7.5px] fill-amber-900 font-bold">Housing</text>
          </svg>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1.5">
            Heavy concentration of manufacturing factories south and east of the roundabout.
          </p>
        </div>

        {/* Map 2: Proposed Future */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300">Proposed Redevelopment</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-[10px] font-bold text-blue-800 dark:text-blue-300">FUTURE</span>
          </div>

          <svg viewBox="0 0 240 160" className="w-full h-auto bg-slate-100 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
            {/* River at top with Bridge */}
            <path d="M 0 20 Q 80 15 140 25 T 240 20" stroke="#0284c7" strokeWidth="12" fill="none" />
            {/* Bridge */}
            <rect x="84" y="12" width="12" height="18" fill="#475569" stroke="#334155" />
            <text x="90" y="9" textAnchor="middle" className="text-[7px] fill-slate-700 dark:fill-gray-300 font-bold">Bridge</text>

            {/* New Housing north of river */}
            <rect x="110" y="4" width="40" height="15" fill="#fbcfe8" stroke="#db2777" />
            <text x="130" y="14" textAnchor="middle" className="text-[6.5px] fill-pink-900 font-bold">New Housing</text>

            {/* Farmland preserved */}
            <rect x="160" y="30" width="70" height="22" fill="#86efac" fillOpacity="0.4" stroke="#22c55e" strokeDasharray="2 2" />
            <text x="195" y="43" textAnchor="middle" className="text-[7.5px] fill-emerald-800 dark:fill-emerald-300 font-semibold">Farmland</text>

            {/* Main Roundabout + Secondary Roundabout */}
            <circle cx="90" cy="80" r="14" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
            <circle cx="155" cy="80" r="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
            <line x1="104" y1="80" x2="145" y2="80" stroke="#94a3b8" strokeWidth="4" />
            <line x1="90" y1="26" x2="90" y2="66" stroke="#94a3b8" strokeWidth="4" />
            <line x1="90" y1="94" x2="90" y2="160" stroke="#94a3b8" strokeWidth="6" />

            {/* Replaced Factories: Medical Center & Shops */}
            <rect x="130" y="105" width="30" height="20" fill="#bae6fd" stroke="#0284c7" />
            <text x="145" y="118" textAnchor="middle" className="text-[6.5px] fill-sky-900 font-bold">Medical</text>

            <rect x="165" y="105" width="28" height="20" fill="#fef08a" stroke="#ca8a04" />
            <text x="179" y="118" textAnchor="middle" className="text-[6.5px] fill-yellow-900 font-bold">Shops</text>

            {/* School & Community Area */}
            <rect x="175" y="70" width="35" height="25" fill="#ddd6fe" stroke="#7c3aed" />
            <text x="192" y="85" textAnchor="middle" className="text-[7px] fill-purple-900 font-bold">School</text>

            {/* Expanded Residential Housing */}
            <rect x="15" y="65" width="45" height="35" fill="#fed7aa" stroke="#f97316" />
            <text x="37" y="85" textAnchor="middle" className="text-[7.5px] fill-amber-900 font-bold">Housing</text>
          </svg>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1.5">
            Factories demolished; replaced by school, shops, medical center, river bridge, and housing.
          </p>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 6. STATISTICAL TABLE: International Tourist Arrivals & Revenue
// --------------------------------------------------------------------------------
const TableTouristData: React.FC = () => {
  const tableRows = [
    { country: 'France', arr2015: '84.5M', arr2023: '100.0M', change: '+18.3%', rev2015: '$45.9B', rev2023: '$68.6B' },
    { country: 'Spain', arr2015: '68.2M', arr2023: '85.1M', change: '+24.8%', rev2015: '$56.5B', rev2023: '$92.0B' },
    { country: 'United States', arr2015: '77.5M', arr2023: '66.5M', change: '-14.2%', rev2015: '$205.4B', rev2023: '$175.9B' },
    { country: 'Italy', arr2015: '50.7M', arr2023: '57.2M', change: '+12.8%', rev2015: '$39.4B', rev2023: '$51.8B' },
    { country: 'Turkey', arr2015: '39.5M', arr2023: '55.2M', change: '+39.7%', rev2015: '$31.5B', rev2023: '$54.3B' },
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none overflow-x-auto">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-2.5">
        International Tourist Arrivals (Millions) and Tourism Receipts ($ Billion USD)
      </div>

      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/80 text-slate-800 dark:text-gray-200">
            <th className="p-2 font-bold">Country</th>
            <th className="p-2 font-bold text-right">2015 Arrivals</th>
            <th className="p-2 font-bold text-right">2023 Arrivals</th>
            <th className="p-2 font-bold text-right">Arrivals Δ</th>
            <th className="p-2 font-bold text-right">2015 Revenue</th>
            <th className="p-2 font-bold text-right">2023 Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-slate-700 dark:text-gray-300 text-[11px]">
          {tableRows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-gray-800/40">
              <td className="p-2 font-semibold text-slate-900 dark:text-white">{r.country}</td>
              <td className="p-2 text-right font-mono">{r.arr2015}</td>
              <td className="p-2 text-right font-mono font-bold">{r.arr2023}</td>
              <td className={`p-2 text-right font-bold ${r.change.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {r.change}
              </td>
              <td className="p-2 text-right font-mono">{r.rev2015}</td>
              <td className="p-2 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.rev2023}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 7. PROCESS DIAGRAM: Hydroelectric Power Station Generation Cycle
// --------------------------------------------------------------------------------
const ProcessDiagramHydroelectric: React.FC = () => {
  const hydroSteps = [
    { num: '1', title: 'High Reservoir', desc: 'Rainwater and melted snow collected in elevated mountain reservoir behind concrete dam.' },
    { num: '2', title: 'Intake Control Gate', desc: 'Sluice gate opens during peak electricity demand to release pressurized water.' },
    { num: '3', title: 'Steep Penstock', desc: 'Water rushes down high-angle conduit, converting potential energy to kinetic speed.' },
    { num: '4', title: 'Hydraulic Turbine', desc: 'High-pressure water jets rotate curved turbine runner blades at high speed.' },
    { num: '5', title: 'Electric Generator', desc: 'Rotating drive shaft spins electromagnetic rotor inside stator coils.' },
    { num: '6', title: 'Step-Up Transformer', desc: 'Elevates generated voltage up to 400kV for efficient national transmission.' },
    { num: '7', title: 'Transmission Grid', desc: 'Overhead high-voltage pylon cables distribute power to cities and industries.' },
    { num: '8', title: 'Tailrace Channel', desc: 'Discharged water exits turbine cleanly into lower river channel with zero pollution.' }
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-2.5">
        Hydroelectric Power Station: Gravitational Water-to-Electricity Generation Cycle
      </div>

      {/* SVG Engineering Flow Schematic */}
      <div className="mb-3 p-2 rounded-xl bg-slate-50 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800">
        <svg viewBox="0 0 520 180" className="w-full h-auto text-[10px]">
          {/* Reservoir (Left Top) */}
          <path d="M 10 40 L 130 40 L 130 110 L 10 110 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#0284c7" strokeWidth="1.5" />
          <text x="65" y="70" textAnchor="middle" className="font-bold fill-sky-900 dark:fill-sky-200">High Reservoir</text>
          <text x="65" y="85" textAnchor="middle" className="text-[8px] fill-sky-800 dark:fill-sky-300">(Potential Energy)</text>

          {/* Dam Wall */}
          <polygon points="130,20 160,20 175,140 130,140" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <text x="148" y="85" textAnchor="middle" transform="rotate(-90 148,85)" className="font-black text-[9px] fill-white">CONCRETE DAM</text>

          {/* Intake Gate */}
          <rect x="145" y="95" width="8" height="18" fill="#f59e0b" stroke="#b45309" />
          <text x="149" y="90" textAnchor="middle" className="text-[7.5px] fill-amber-700 dark:fill-amber-300 font-bold">Gate</text>

          {/* Penstock Sloped Tube */}
          <path d="M 153 105 L 260 140 L 260 152 L 153 117 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
          <text x="205" y="120" textAnchor="middle" transform="rotate(18 205,120)" className="text-[8px] font-bold fill-slate-800 dark:fill-gray-200">Penstock Tube</text>

          {/* Flow Arrows inside Penstock */}
          <path d="M 170 113 L 245 137" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4 2" />

          {/* Powerhouse Building */}
          <rect x="260" y="90" width="110" height="70" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <text x="315" y="106" textAnchor="middle" className="font-bold text-[8.5px] fill-slate-900">Powerhouse</text>

          {/* Turbine (circle with blades) */}
          <circle cx="285" cy="138" r="14" fill="#3b82f6" fillOpacity="0.2" stroke="#1d4ed8" strokeWidth="1.5" />
          <line x1="275" y1="138" x2="295" y2="138" stroke="#1d4ed8" strokeWidth="2" />
          <line x1="285" y1="128" x2="285" y2="148" stroke="#1d4ed8" strokeWidth="2" />
          <text x="285" y="158" textAnchor="middle" className="text-[7px] font-bold fill-blue-900 dark:fill-blue-200">Turbine</text>

          {/* Drive Shaft */}
          <line x1="315" y1="120" x2="315" y2="138" stroke="#0f172a" strokeWidth="3" />

          {/* Generator */}
          <rect x="300" y="112" width="30" height="18" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          <text x="315" y="124" textAnchor="middle" className="text-[7px] font-black fill-gray-950">GEN</text>

          {/* Step-Up Transformer */}
          <rect x="340" y="122" width="22" height="22" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1.5" />
          <text x="351" y="135" textAnchor="middle" className="text-[6.5px] font-bold fill-white">XFMR</text>

          {/* Transmission Pylon */}
          <path d="M 430 40 L 415 150 M 430 40 L 445 150 M 405 70 L 455 70 M 410 100 L 450 100" stroke="#334155" strokeWidth="1.5" />
          <text x="430" y="32" textAnchor="middle" className="text-[7.5px] font-bold fill-slate-700 dark:fill-gray-300">Pylons (Grid)</text>

          {/* Power Cable from Transformer to Pylon */}
          <path d="M 362 125 Q 390 100 420 70" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="390" y="85" className="text-[7px] fill-rose-600 dark:fill-rose-400 font-bold">400 kV</text>

          {/* Tailrace Discharged Water */}
          <path d="M 285 152 Q 350 165 510 165 L 510 175 L 285 175 Z" fill="#0284c7" fillOpacity="0.5" />
          <text x="430" y="172" textAnchor="middle" className="text-[7.5px] font-semibold fill-sky-950 dark:fill-sky-100">Tailrace Outlet (To River)</text>
        </svg>
      </div>

      {/* 8 Process Step Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {hydroSteps.map((s, idx) => (
          <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                {s.num}
              </span>
              {idx < hydroSteps.length - 1 && (
                <span className="text-slate-400 dark:text-gray-500 text-[10px] font-bold">➔</span>
              )}
            </div>
            <div>
              <div className="font-bold text-[10px] text-slate-900 dark:text-white leading-tight mb-0.5">
                {s.title}
              </div>
              <div className="text-[9.5px] text-slate-500 dark:text-gray-400 leading-snug">
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-950 dark:text-blue-300 flex items-center justify-between">
        <span>⚡ <strong>Energy Conversion:</strong> Gravitational potential energy ➔ mechanical kinetic ➔ electromagnetic current.</span>
        <span className="font-bold text-xs">Zero Fuel Consumed</span>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// 8. MAP COMPARISON: Coastal Village of Felixstone (1995 vs 2025)
// --------------------------------------------------------------------------------
const MapComparisonFelixstone: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-900/90 p-4 rounded-xl border border-slate-200 dark:border-gray-800 select-none">
      <div className="text-center font-bold text-xs text-slate-800 dark:text-gray-200 mb-3">
        Coastal Village of Felixstone: 1995 Historical Settlement vs 2025 Tourist Resort
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Map 1: 1995 Quiet Fishing Settlement */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">Felixstone in 1995</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-gray-700 text-[10px] font-bold text-slate-700 dark:text-gray-300">TRADITIONAL VILLAGE</span>
          </div>

          <svg viewBox="0 0 240 160" className="w-full h-auto bg-amber-50/50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
            {/* Sea (South) */}
            <path d="M 0 110 Q 120 100 240 115 L 240 160 L 0 160 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#0284c7" />
            <text x="120" y="145" textAnchor="middle" className="text-[8px] fill-sky-800 dark:fill-sky-300 font-bold">SEA / BAY</text>

            {/* Natural Pebble Beach */}
            <path d="M 0 95 Q 120 85 240 100 L 240 115 Q 120 100 0 110 Z" fill="#fef08a" stroke="#ca8a04" />
            <text x="60" y="104" className="text-[6.5px] fill-yellow-900 font-semibold">Pebble Beach</text>

            {/* Fishing Docks / Harbour (West) */}
            <rect x="10" y="70" width="35" height="25" fill="#94a3b8" stroke="#475569" />
            <text x="27" y="84" textAnchor="middle" className="text-[6px] fill-white font-bold">Fishing Port</text>
            <text x="27" y="91" textAnchor="middle" className="text-[5.5px] fill-slate-200">& Docks</text>

            {/* Wooden Pier */}
            <rect x="20" y="95" width="8" height="35" fill="#78350f" stroke="#451a03" />
            <text x="24" y="120" textAnchor="middle" transform="rotate(-90 24,120)" className="text-[5.5px] fill-white font-semibold">Wooden Pier</text>

            {/* Sand Dunes & Pine Trees (East) */}
            <rect x="155" y="20" width="75" height="55" fill="#fed7aa" stroke="#f97316" strokeDasharray="2 2" />
            <text x="192" y="45" textAnchor="middle" className="text-[7px] fill-amber-900 font-bold">Sand Dunes</text>
            <text x="192" y="55" textAnchor="middle" className="text-[6px] fill-amber-800">& Wild Pine Woods</text>

            {/* Main Village Road */}
            <path d="M 10 50 Q 80 50 140 45" stroke="#94a3b8" strokeWidth="4" fill="none" />
            <path d="M 80 50 L 80 90" stroke="#94a3b8" strokeWidth="3" fill="none" />

            {/* Small Family Guest House */}
            <rect x="70" y="20" width="30" height="20" fill="#fbcfe8" stroke="#db2777" />
            <text x="85" y="32" textAnchor="middle" className="text-[6px] fill-pink-900 font-bold">Guest House</text>
            <text x="85" y="38" textAnchor="middle" className="text-[5px] fill-pink-800">(15 Rooms)</text>

            {/* Fishermen's Cottages */}
            <rect x="35" y="25" width="22" height="18" fill="#cbd5e1" stroke="#64748b" />
            <text x="46" y="36" textAnchor="middle" className="text-[5.5px] fill-slate-800 font-bold">Cottages</text>
          </svg>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1.5">
            A small fishing harbor with natural sand dunes, traditional cottages, and modest guest house.
          </p>
        </div>

        {/* Map 2: 2025 Modern Luxury Tourist Resort */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300">Felixstone in 2025</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-[10px] font-bold text-blue-800 dark:text-blue-300">MODERN RESORT</span>
          </div>

          <svg viewBox="0 0 240 160" className="w-full h-auto bg-amber-50/50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
            {/* Sea (South) */}
            <path d="M 0 110 Q 120 100 240 115 L 240 160 L 0 160 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#0284c7" />
            <text x="120" y="145" textAnchor="middle" className="text-[8px] fill-sky-800 dark:fill-sky-300 font-bold">SEA / BAY</text>

            {/* Paved Pedestrian Promenade & Sandy Beach */}
            <path d="M 0 95 Q 120 85 240 100 L 240 115 Q 120 100 0 110 Z" fill="#fde047" stroke="#eab308" />
            <line x1="0" y1="95" x2="240" y2="100" stroke="#71717a" strokeWidth="2.5" />
            <text x="150" y="93" className="text-[6px] fill-slate-800 font-bold">Pedestrian Promenade</text>

            {/* Luxury Yacht Marina (replacing fishing docks) */}
            <rect x="5" y="70" width="40" height="25" fill="#0284c7" stroke="#0369a1" />
            <text x="25" y="82" textAnchor="middle" className="text-[6px] fill-white font-black">Yacht Marina</text>
            <text x="25" y="89" textAnchor="middle" className="text-[5px] fill-sky-100">(200 Berths)</text>

            {/* Modern Leisure Pier */}
            <rect x="20" y="95" width="10" height="42" fill="#3b82f6" stroke="#1d4ed8" />
            <text x="25" y="122" textAnchor="middle" transform="rotate(-90 25,122)" className="text-[5.5px] fill-white font-bold">Leisure Pier</text>

            {/* 18-Hole Championship Golf Course (replacing sand dunes) */}
            <rect x="150" y="15" width="85" height="65" fill="#86efac" stroke="#16a34a" />
            <circle cx="190" cy="40" r="10" fill="#22c55e" fillOpacity="0.4" />
            <text x="192" y="38" textAnchor="middle" className="text-[6.5px] fill-emerald-950 font-black">18-Hole Golf</text>
            <text x="192" y="46" textAnchor="middle" className="text-[5.5px] fill-emerald-900">Resort & Club</text>

            {/* Multi-lane Dual Carriageway */}
            <path d="M 5 50 Q 80 50 145 45" stroke="#475569" strokeWidth="5" fill="none" />
            <line x1="80" y1="50" x2="80" y2="92" stroke="#475569" strokeWidth="4" />

            {/* 5-Star Hotel Resort & Spa with Pools */}
            <rect x="65" y="15" width="40" height="28" fill="#ec4899" stroke="#be185d" />
            <text x="85" y="27" textAnchor="middle" className="text-[6px] fill-white font-black">5★ Grand Hotel</text>
            {/* Swimming Pools */}
            <rect x="70" y="33" width="12" height="7" rx="2" fill="#38bdf8" />
            <rect x="88" y="33" width="12" height="7" rx="2" fill="#38bdf8" />

            {/* Holiday Apartments (replacing cottages) */}
            <rect x="25" y="18" width="28" height="25" fill="#a855f7" stroke="#7e22ce" />
            <text x="39" y="30" textAnchor="middle" className="text-[5.5px] fill-white font-bold">Holiday</text>
            <text x="39" y="37" textAnchor="middle" className="text-[5px] fill-purple-100">Apartments</text>

            {/* Car Park */}
            <rect x="110" y="20" width="25" height="20" fill="#cbd5e1" stroke="#64748b" />
            <text x="122" y="32" textAnchor="middle" className="text-[6px] fill-slate-900 font-bold">Car Park</text>
          </svg>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1.5">
            Dunes cleared for golf course, fishing port replaced by marina, cottages rebuilt as apartments.
          </p>
        </div>
      </div>
    </div>
  );
};

