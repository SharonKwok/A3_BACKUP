'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  DollarSign,
  Sparkles,
  Activity,
  Award,
  X,
  ShieldAlert,
  AlertOctagon,
  Utensils,
  ChevronDown,
  ChevronUp,
  ArrowDownRight,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import CustomerTable from './CustomerTable';

interface ViewAnalyticsProps {
  data: any[];
  selectedCustomer: any | null;
  setSelectedCustomer: (customer: any | null) => void;
  onSelectForCopilot: (customer: any) => void;
  showCuisine: boolean;
  setShowCuisine: (show: boolean) => void;
  onBatchAnalyze?: (selectedCustomers: any[], customerNotes: Record<string, string>) => void;
  selectedCuisines: string[];
  diningOccasion: string;
  mealType: string;
  satisfactionStatus: string;
  loyaltyFilter: string;
  maxWaitTime: number;
}

export default function ViewAnalytics({
  data,
  selectedCustomer,
  setSelectedCustomer,
  onSelectForCopilot,
  showCuisine,
  onBatchAnalyze,
  selectedCuisines,
  diningOccasion,
  mealType,
  satisfactionStatus,
  loyaltyFilter,
  maxWaitTime,
}: ViewAnalyticsProps) {
  // Slide-over AI Diagnostic state
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Drill-down filter state for low rating (< 3.0) drill-downs
  const [drillDownFilter, setDrillDownFilter] = useState<'food' | 'service' | 'ambience' | null>(null);

  // Active view toggle dimension for Satisfaction Card (default to 'diningType')
  const [satisfactionDimension, setSatisfactionDimension] = useState<'diningType' | 'loyalty' | 'occasion'>('diningType');

  // Interactive dynamic Diagram Insights toggle states
  const [showChart1Insights, setShowChart1Insights] = useState<boolean>(false);
  const [showChart2Insights, setShowChart2Insights] = useState<boolean>(false);

  const handleDrillDown = (type: 'food' | 'service' | 'ambience') => {
    // If already active, toggle off, otherwise toggle on
    setDrillDownFilter((prev) => (prev === type ? null : type));

    // Scroll smoothly to "Customer Dining Records Explorer" table
    setTimeout(() => {
      const explorerEl = document.getElementById('customer-dining-records-explorer');
      if (explorerEl) {
        explorerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleClearDrillDown = () => {
    setDrillDownFilter(null);
  };

  const fetchDiagnostic = async (cust: any) => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: cust }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'AI diagnostic failed');
      }
      setAiResult(json.result);
    } catch (err: any) {
      setAiError(err.message || 'Failed to connect to AI Retention Copilot');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    fetchDiagnostic(customer);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomer(null);
    setAiResult(null);
    setAiError(null);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (showCuisine && selectedCuisines.length > 0 && !selectedCuisines.includes(item.PreferredCuisine)) {
        return false;
      }
      if (diningOccasion !== 'ALL' && item.DiningOccasion !== diningOccasion) {
        return false;
      }
      if (mealType !== 'ALL' && item.MealType !== mealType) {
        return false;
      }
      if (satisfactionStatus === 'SATISFIED' && item.HighSatisfaction !== 1) return false;
      if (satisfactionStatus === 'CHURN_RISK' && item.HighSatisfaction !== 0) return false;
      if (loyaltyFilter === 'MEMBERS' && item.LoyaltyProgramMember !== 1) return false;
      if (loyaltyFilter === 'NON_MEMBERS' && item.LoyaltyProgramMember !== 0) return false;
      if (item.WaitTime > maxWaitTime) return false;

      return true;
    });
  }, [data, showCuisine, selectedCuisines, diningOccasion, mealType, satisfactionStatus, loyaltyFilter, maxWaitTime]);

  // 6 Core KPI Calculations (dynamically computed from filteredData so they update when filters change)
  const totalResponses = filteredData.length;
  const highlySatisfiedCount = filteredData.filter((d) => Number(d.HighSatisfaction) === 1).length;
  const highlySatisfiedPct = totalResponses > 0 ? ((highlySatisfiedCount / totalResponses) * 100).toFixed(1) : '0.0';

  const avgWaitTime = totalResponses > 0
    ? (filteredData.reduce((acc, d) => acc + (Number(d.WaitTime) || 0), 0) / totalResponses).toFixed(1)
    : '0.0';

  const avgFoodRate = totalResponses > 0
    ? (filteredData.reduce((acc, d) => acc + (Number(d.FoodRating) || 0), 0) / totalResponses).toFixed(2)
    : '0.00';

  const avgServiceRate = totalResponses > 0
    ? (filteredData.reduce((acc, d) => acc + (Number(d.ServiceRating) || 0), 0) / totalResponses).toFixed(2)
    : '0.00';

  const avgAmbienceRate = totalResponses > 0
    ? (filteredData.reduce((acc, d) => acc + (Number(d.AmbianceRating ?? d.AmbienceRating) || 0), 0) / totalResponses).toFixed(2)
    : '0.00';

  // Count of customers with rating < 3.0 in the currently filtered dataset
  const lowFoodCount = filteredData.filter((d) => Number(d.FoodRating) < 3.0).length;
  const lowServiceCount = filteredData.filter((d) => Number(d.ServiceRating) < 3.0).length;
  const lowAmbienceCount = filteredData.filter((d) => Number(d.AmbianceRating ?? d.AmbienceRating) < 3.0).length;

  // Final data supplied to CustomerTable: filtered by drill-down when active
  const explorerTableData = useMemo(() => {
    if (!drillDownFilter) return filteredData;
    if (drillDownFilter === 'food') {
      return filteredData.filter((d) => Number(d.FoodRating) < 3.0);
    }
    if (drillDownFilter === 'service') {
      return filteredData.filter((d) => Number(d.ServiceRating) < 3.0);
    }
    if (drillDownFilter === 'ambience') {
      return filteredData.filter((d) => Number(d.AmbianceRating ?? d.AmbienceRating) < 3.0);
    }
    return filteredData;
  }, [filteredData, drillDownFilter]);

  const activeDrillDownInfo = useMemo(() => {
    if (!drillDownFilter) return null;
    if (drillDownFilter === 'food') {
      return { type: 'food' as const, label: 'Food Rating', count: lowFoodCount };
    }
    if (drillDownFilter === 'service') {
      return { type: 'service' as const, label: 'Service Rating', count: lowServiceCount };
    }
    if (drillDownFilter === 'ambience') {
      return { type: 'ambience' as const, label: 'Ambience Rating', count: lowAmbienceCount };
    }
    return null;
  }, [drillDownFilter, lowFoodCount, lowServiceCount, lowAmbienceCount]);

  // Chart 1 Data: Dual Y-Axis Wait Time Dynamics (Bucketed into 0-15m, 15-25m, 25-36m, 36m+)
  const waitTimeLineData = useMemo(() => {
    const buckets = [
      { bucket: '0-15m', min: 0, max: 15 },
      { bucket: '15-25m', min: 15, max: 25 },
      { bucket: '25-36m', min: 25, max: 36 },
      { bucket: '36m+', min: 36, max: Infinity },
    ];

    return buckets.map(({ bucket, min, max }) => {
      const bucketItems = filteredData.filter((d) => {
        const w = Number(d.WaitTime) || 0;
        return w >= min && w < max;
      });

      const count = bucketItems.length;
      if (count === 0) {
        return {
          bucket,
          serviceRating: null,
          foodRating: null,
          ambienceRating: null,
          satisfied: null,
          dissatisfied: null,
          count: 0,
        };
      }

      const serviceRating = Number(
        (bucketItems.reduce((acc, d) => acc + (Number(d.ServiceRating) || 0), 0) / count).toFixed(2)
      );
      const foodRating = Number(
        (bucketItems.reduce((acc, d) => acc + (Number(d.FoodRating) || 0), 0) / count).toFixed(2)
      );
      const ambienceRating = Number(
        (bucketItems.reduce((acc, d) => acc + (Number(d.AmbianceRating ?? d.AmbienceRating) || 0), 0) / count).toFixed(2)
      );

      const satisfiedCount = bucketItems.filter((d) => Number(d.HighSatisfaction) === 1).length;
      const dissatisfiedCount = count - satisfiedCount;

      const satisfied = Number(((satisfiedCount / count) * 100).toFixed(1));
      const dissatisfied = Number(((dissatisfiedCount / count) * 100).toFixed(1));

      return {
        bucket,
        serviceRating,
        foodRating,
        ambienceRating,
        satisfied,
        dissatisfied,
        count,
      };
    });
  }, [filteredData]);

  // Chart 2 Data: Dynamically re-rendered based on satisfactionDimension ('diningType' | 'loyalty' | 'occasion')
  const satisfactionChartData = useMemo(() => {
    if (satisfactionDimension === 'diningType') {
      const map: Record<string, { label: string; satisfied: number; churnRisk: number }> = {
        'Dine-in': { label: 'Dine-in', satisfied: 0, churnRisk: 0 },
        'Takeaway': { label: 'Takeaway', satisfied: 0, churnRisk: 0 },
      };
      filteredData.forEach((i) => {
        const raw = String(i.MealType || '').trim();
        const key = raw.toLowerCase().includes('take') ? 'Takeaway' : 'Dine-in';
        if (!map[key]) {
          map[key] = { label: key, satisfied: 0, churnRisk: 0 };
        }
        if (Number(i.HighSatisfaction) === 1) map[key].satisfied += 1;
        else map[key].churnRisk += 1;
      });
      return Object.values(map);
    }

    if (satisfactionDimension === 'loyalty') {
      const map: Record<string, { label: string; satisfied: number; churnRisk: number }> = {
        'Member': { label: 'Member', satisfied: 0, churnRisk: 0 },
        'Non-Member': { label: 'Non-Member', satisfied: 0, churnRisk: 0 },
      };
      filteredData.forEach((i) => {
        const isMember = Number(i.LoyaltyProgramMember) === 1;
        const key = isMember ? 'Member' : 'Non-Member';
        if (!map[key]) {
          map[key] = { label: key, satisfied: 0, churnRisk: 0 };
        }
        if (Number(i.HighSatisfaction) === 1) map[key].satisfied += 1;
        else map[key].churnRisk += 1;
      });
      return Object.values(map);
    }

    // Default / 'occasion': Business, Casual, Celebration breakdown
    const map: Record<string, { label: string; satisfied: number; churnRisk: number }> = {
      'Business': { label: 'Business', satisfied: 0, churnRisk: 0 },
      'Casual': { label: 'Casual', satisfied: 0, churnRisk: 0 },
      'Celebration': { label: 'Celebration', satisfied: 0, churnRisk: 0 },
    };
    filteredData.forEach((i) => {
      const occ = String(i.DiningOccasion || 'Casual').trim();
      if (!map[occ]) {
        map[occ] = { label: occ, satisfied: 0, churnRisk: 0 };
      }
      if (Number(i.HighSatisfaction) === 1) map[occ].satisfied += 1;
      else map[occ].churnRisk += 1;
    });
    return Object.values(map);
  }, [filteredData, satisfactionDimension]);

  // Chart 3 Data
  const cuisineMap: { [key: string]: { cuisine: string; totalSpend: number; count: number; churnCount: number } } = {};
  filteredData.forEach((i) => {
    const cuis = i.PreferredCuisine || 'Other';
    if (!cuisineMap[cuis]) {
      cuisineMap[cuis] = { cuisine: cuis, totalSpend: 0, count: 0, churnCount: 0 };
    }
    cuisineMap[cuis].totalSpend += i.AverageSpend || 0;
    cuisineMap[cuis].count += 1;
    if (i.HighSatisfaction === 0) cuisineMap[cuis].churnCount += 1;
  });
  const cuisineChartData = Object.values(cuisineMap).map((c) => ({
    cuisine: c.cuisine,
    avgSpend: Math.round(c.totalSpend / (c.count || 1)),
    churnRatePct: c.count > 0 ? Number(((c.churnCount / c.count) * 100).toFixed(1)) : 0,
  }));

  // Dynamic Insights calculation for Chart 1 (Wait Time vs Service Rating & Retention)
  // Fully reactive to global filters & waitTimeLineData - Pure English
  const chart1Insights = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return {
        keyNumbers: [
          { label: 'Sample Size', value: '0', sub: 'No records match filter' },
        ],
        watchOut: 'No dining records match current filter criteria. Wait time correlation cannot be evaluated.',
        recommendation: 'Broaden top filter parameters to restore data analytics calculation.',
      };
    }

    const b0 = waitTimeLineData.find((b) => b.bucket === '0-15m');
    const b1 = waitTimeLineData.find((b) => b.bucket === '15-25m');
    const b2 = waitTimeLineData.find((b) => b.bucket === '25-36m');
    const b3 = waitTimeLineData.find((b) => b.bucket === '36m+');

    const sat0 = b0?.satisfied !== null && b0?.satisfied !== undefined ? b0.satisfied : 0;
    const sat3 = b3?.satisfied !== null && b3?.satisfied !== undefined ? b3.satisfied : 0;
    const satDrop = Number((sat0 - sat3).toFixed(1));

    const srv0 = b0?.serviceRating !== null && b0?.serviceRating !== undefined ? b0.serviceRating : 0;
    const srv3 = b3?.serviceRating !== null && b3?.serviceRating !== undefined ? b3.serviceRating : 0;
    const srvDrop = Number((srv0 - srv3).toFixed(2));

    // Peak dissatisfaction bucket
    let peakBucket = b3 || waitTimeLineData[0];
    let peakDissatVal = -1;
    waitTimeLineData.forEach((b) => {
      if (b.dissatisfied !== null && b.dissatisfied !== undefined && b.dissatisfied > peakDissatVal) {
        peakDissatVal = b.dissatisfied;
        peakBucket = b;
      }
    });

    const keyNumbers = [
      {
        label: 'Short Wait (0-15m) Sat.',
        value: b0?.satisfied !== null && b0?.satisfied !== undefined ? `${b0.satisfied}%` : 'N/A',
        sub: `Service score ${b0?.serviceRating ?? 'N/A'} / 5.0`,
      },
      {
        label: 'Long Wait (36m+) Sat.',
        value: b3?.satisfied !== null && b3?.satisfied !== undefined ? `${b3.satisfied}%` : 'N/A',
        sub: `Service score ${b3?.serviceRating ?? 'N/A'} / 5.0`,
      },
      {
        label: 'Satisfaction Drop',
        value: satDrop > 0 ? `-${satDrop}%` : `${Math.abs(satDrop)}%`,
        sub: `Rating decrease Δ -${srvDrop > 0 ? srvDrop : 0}`,
      },
    ];

    const watchOut =
      satDrop >= 15
        ? `Wait times exceeding 25 minutes trigger a steep ${satDrop}% collapse in customer satisfaction (${peakBucket?.bucket || '36m+'} dissatisfaction hits ${peakDissatVal}%). Extended kitchen latency is the primary driver of patron churn.`
        : `Even modest table wait delays erode goodwill. Dissatisfaction in the ${peakBucket?.bucket || '36m+'} window has reached ${peakDissatVal > 0 ? peakDissatVal + '%' : 'an elevated threshold'}.`;

    const recommendation =
      'Enforce a strict 20-minute kitchen ticket SLA: deploy pre-ordering during queue times and offer complimentary appetizers at 25 minutes to protect guest retention.';

    return { keyNumbers, watchOut, recommendation };
  }, [filteredData, waitTimeLineData]);

  // Dynamic Insights calculation for Chart 2 (Satisfaction Breakdown across Dimensions)
  // Fully reactive to global filters & satisfactionDimension ('diningType' | 'loyalty' | 'occasion') - Pure English
  const chart2Insights = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return {
        dimensionTitle: 'Satisfaction Dimension Insights',
        keyNumbers: [
          { label: 'Sample Size', value: '0', sub: 'No records match filter' },
        ],
        watchOut: 'No records available for aggregate analysis under current filters.',
        recommendation: 'Adjust or reset top filters to view operational insights.',
      };
    }

    if (satisfactionDimension === 'diningType') {
      const dineIn = satisfactionChartData.find((d) => d.label === 'Dine-in') || { satisfied: 0, churnRisk: 0 };
      const takeaway = satisfactionChartData.find((d) => d.label === 'Takeaway') || { satisfied: 0, churnRisk: 0 };

      const dineTotal = dineIn.satisfied + dineIn.churnRisk;
      const takeTotal = takeaway.satisfied + takeaway.churnRisk;

      const dineRate = dineTotal > 0 ? Math.round((dineIn.satisfied / dineTotal) * 100) : 0;
      const takeRate = takeTotal > 0 ? Math.round((takeaway.satisfied / takeTotal) * 100) : 0;
      const spread = Math.abs(dineRate - takeRate);

      const keyNumbers = [
        {
          label: 'Dine-in Satisfaction',
          value: `${dineRate}%`,
          sub: `${dineIn.satisfied.toLocaleString()} satisfied of ${dineTotal.toLocaleString()}`,
        },
        {
          label: 'Takeaway Satisfaction',
          value: `${takeRate}%`,
          sub: `${takeaway.satisfied.toLocaleString()} satisfied of ${takeTotal.toLocaleString()}`,
        },
        {
          label: 'Channel Variance',
          value: `±${spread}%`,
          sub: dineRate >= takeRate ? 'Dine-in outperforms takeaway' : 'Takeaway outperforms dine-in',
        },
      ];

      const watchOut =
        takeRate < dineRate
          ? `Takeaway satisfaction lags dine-in by ${spread}%, leaving ${takeaway.churnRisk.toLocaleString()} takeout customers at high churn risk, primarily caused by thermal degradation and counter handoff delays.`
          : `Dine-in satisfaction lags takeaway by ${spread}%, with ${dineIn.churnRisk.toLocaleString()} in-store patrons dissatisfied due to dining room rush and slower floor service pacing.`;

      const recommendation =
        takeRate < dineRate
          ? 'Upgrade insulated packaging materials and establish a designated expedited pickup counter to preserve temperature and eliminate staging friction.'
          : 'Reallocate floor staff during peak turn times and introduce structured table check-ins to elevate dine-in guest sentiment.';

      return {
        dimensionTitle: 'Dining Type Performance Insights',
        keyNumbers,
        watchOut,
        recommendation,
      };
    }

    if (satisfactionDimension === 'loyalty') {
      const member = satisfactionChartData.find((d) => d.label === 'Member') || { satisfied: 0, churnRisk: 0 };
      const nonMember = satisfactionChartData.find((d) => d.label === 'Non-Member') || { satisfied: 0, churnRisk: 0 };

      const memTotal = member.satisfied + member.churnRisk;
      const nonTotal = nonMember.satisfied + nonMember.churnRisk;

      const memRate = memTotal > 0 ? Math.round((member.satisfied / memTotal) * 100) : 0;
      const nonRate = nonTotal > 0 ? Math.round((nonMember.satisfied / nonTotal) * 100) : 0;
      const lift = memRate - nonRate;

      const keyNumbers = [
        {
          label: 'Member Satisfaction',
          value: `${memRate}%`,
          sub: `${member.satisfied.toLocaleString()} of ${memTotal.toLocaleString()} patrons`,
        },
        {
          label: 'Non-Member Sat.',
          value: `${nonRate}%`,
          sub: `${nonMember.satisfied.toLocaleString()} of ${nonTotal.toLocaleString()} patrons`,
        },
        {
          label: 'Loyalty Lift',
          value: lift >= 0 ? `+${lift}%` : `${lift}%`,
          sub: `${nonMember.churnRisk.toLocaleString()} non-members at churn risk`,
        },
      ];

      const watchOut =
        nonRate < 55
          ? `Non-member satisfaction sits at only ${nonRate}% (${nonMember.churnRisk.toLocaleString()} dissatisfied patrons). Lacking loyalty perks, first-time and non-member diners churn rapidly when minor service hitches occur.`
          : `Loyalty members show +${Math.abs(lift)}% higher satisfaction than non-members. Non-members exhibit low tolerance for service variance, presenting an urgent conversion opportunity.`;

      const recommendation =
        'Print instant table sign-up QR codes on checks offering a "first-visit dessert or 10% credit" to immediately convert high-churn non-members into retained regulars.';

      return {
        dimensionTitle: 'Loyalty Program Performance Insights',
        keyNumbers,
        watchOut,
        recommendation,
      };
    }

    // Occasion: Business, Casual, Celebration
    const items = satisfactionChartData.map((d) => {
      const tot = d.satisfied + d.churnRisk;
      const rate = tot > 0 ? Math.round((d.satisfied / tot) * 100) : 0;
      return { ...d, total: tot, rate };
    });

    const sortedByRate = [...items].sort((a, b) => b.rate - a.rate);
    const topOccasion = sortedByRate[0] || { label: 'N/A', rate: 0 };
    const bottomOccasion = sortedByRate[sortedByRate.length - 1] || { label: 'N/A', rate: 0, churnRisk: 0 };

    const keyNumbers = items.map((i) => ({
      label: `${i.label} Sat.`,
      value: `${i.rate}%`,
      sub: `${i.satisfied.toLocaleString()} of ${i.total.toLocaleString()} patrons`,
    }));

    const watchOut = `Lowest satisfaction occasion is "${bottomOccasion.label}" at ${bottomOccasion.rate}% (${bottomOccasion.churnRisk.toLocaleString()} guests at risk of defection). High-expectation dining occasions penalize service friction severely.`;

    const recommendation =
      'Adopt occasion-specific SOPs: execute express billing and consolidated courses for Business tables; arrange complimentary celebrations and personal manager greetings for special occasions.';

    return {
      dimensionTitle: 'Dining Occasion Performance Insights',
      keyNumbers,
      watchOut,
      recommendation,
    };
  }, [filteredData, satisfactionDimension, satisfactionChartData]);

  return (
    <div className="space-y-6 pb-12 relative">
      
      {/* Top Unified Customer Satisfaction KPI Card Container - 6 KPIs */}
      <div className="bg-white border border-[#f0eae1] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Satisfaction &amp; Operations Intelligence
            </h3>
            <span className="text-[10px] font-bold text-[#e05a33] bg-[#faedd9] px-2 py-0.5 rounded-full border border-[#f4dbb8]">
              6 Core KPIs
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Dynamically updates with filter parameters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 items-stretch">
          
          {/* Row 1 - Card 1: Customer Count */}
          <div className="flex flex-col justify-between bg-[#fcfbf9] p-4 rounded-xl border border-[#f0eae1] hover:border-[#e5ded4] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-semibold truncate">Customer Count</span>
              <div className="w-8 h-8 rounded-lg bg-[#faedd9] text-[#b45309] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {totalResponses.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {totalResponses === data.length ? 'Total records' : `of ${data.length.toLocaleString()} total`}
              </p>
            </div>
          </div>

          {/* Row 1 - Card 2: Percentage Highly Satisfied */}
          <div className="flex flex-col justify-between bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/70 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-800 font-semibold truncate">% Highly Satisfied</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
                {highlySatisfiedPct}%
              </h4>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium truncate">
                {highlySatisfiedCount.toLocaleString()} patrons
              </p>
            </div>
          </div>

          {/* Row 1 - Card 3: Average Wait Time */}
          <div className="flex flex-col justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-800 font-semibold truncate">Avg Wait Time</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-amber-800 tracking-tight">
                {avgWaitTime} <span className="text-xs sm:text-sm font-semibold text-amber-700">mins</span>
              </h4>
              <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
                Table wait delay
              </p>
            </div>
          </div>

          {/* Row 2 - Card 4: Average Service Rating */}
          <div
            onClick={() => handleDrillDown('service')}
            role="button"
            tabIndex={0}
            title="Click to drill-down to customers with Service Rating < 3.0"
            className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer text-left select-none group ${
              drillDownFilter === 'service'
                ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-400 shadow-xs'
                : 'bg-blue-50/50 border-blue-200/70 hover:border-blue-400 hover:bg-blue-50 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-800 font-semibold truncate">Avg Service Rate</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-blue-800 tracking-tight flex items-baseline gap-1">
                {avgServiceRate} <span className="text-xs text-blue-600 font-semibold">/ 5.0</span>
              </h4>
              <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-blue-200/60">
                <span className="text-[11px] text-blue-700 font-semibold truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {lowServiceCount.toLocaleString()} patrons &lt; 3.0
                </span>
                <span className="text-[10px] font-bold text-blue-600 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                  Drill down <ArrowDownRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Row 2 - Card 5: Average Food Rating */}
          <div
            onClick={() => handleDrillDown('food')}
            role="button"
            tabIndex={0}
            title="Click to drill-down to customers with Food Rating < 3.0"
            className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer text-left select-none group ${
              drillDownFilter === 'food'
                ? 'bg-orange-100/70 border-orange-400 ring-2 ring-orange-400 shadow-xs'
                : 'bg-orange-50/50 border-orange-200/70 hover:border-orange-400 hover:bg-orange-50 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-orange-800 font-semibold truncate">Avg Food Rate</span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-orange-800 tracking-tight flex items-baseline gap-1">
                {avgFoodRate} <span className="text-xs text-orange-600 font-semibold">/ 5.0</span>
              </h4>
              <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-orange-200/60">
                <span className="text-[11px] text-orange-700 font-semibold truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {lowFoodCount.toLocaleString()} patrons &lt; 3.0
                </span>
                <span className="text-[10px] font-bold text-orange-600 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                  Drill down <ArrowDownRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Row 2 - Card 6: Average Ambience Rating */}
          <div
            onClick={() => handleDrillDown('ambience')}
            role="button"
            tabIndex={0}
            title="Click to drill-down to customers with Ambience Rating < 3.0"
            className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer text-left select-none group ${
              drillDownFilter === 'ambience'
                ? 'bg-purple-100/70 border-purple-400 ring-2 ring-purple-400 shadow-xs'
                : 'bg-purple-50/50 border-purple-200/70 hover:border-purple-400 hover:bg-purple-50 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-800 font-semibold truncate">Avg Ambience</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-purple-800 tracking-tight flex items-baseline gap-1">
                {avgAmbienceRate} <span className="text-xs text-purple-600 font-semibold">/ 5.0</span>
              </h4>
              <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-purple-200/60">
                <span className="text-[11px] text-purple-700 font-semibold truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {lowAmbienceCount.toLocaleString()} patrons &lt; 3.0
                </span>
                <span className="text-[10px] font-bold text-purple-600 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                  Drill down <ArrowDownRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className={`grid grid-cols-1 ${showCuisine ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        
        {/* Chart 1 */}
        <div className="bg-white border border-[#f0eae1] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#e05a33]" />
                Wait Time vs. Service Rating Correlation
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Dual Y-axis dynamics across wait time buckets
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="text-amber-700">Left: 1-5 Scale</span>
              <span>•</span>
              <span className="text-emerald-700">Right: 0-100%</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waitTimeLineData} margin={{ top: 12, right: 12, bottom: 4, left: -14 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eae1" opacity={0.8} />
                <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `${v}.0`}
                  width={28}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `${v}%`}
                  width={38}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#f0eae1',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#0f172a',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '8px 12px',
                  }}
                  formatter={(value: any, name: any) => {
                    const label = String(name || '');
                    if (value === null || value === undefined) return ['N/A', label];
                    if (label === 'Satisfied' || label === 'Dissatisfied') {
                      return [`${value}%`, label];
                    }
                    return [`${value} / 5.0`, label];
                  }}
                  labelFormatter={(label) => `Wait Time: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                {/* Left Y-Axis: 3 Average Rating lines */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="serviceRating"
                  name="Service Rating"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: '#ffffff', fill: '#f59e0b' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="foodRating"
                  name="Food Rating"
                  stroke="#9333ea"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: '#ffffff', fill: '#9333ea' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ambienceRating"
                  name="Ambience Rating"
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: '#ffffff', fill: '#64748b' }}
                  activeDot={{ r: 6 }}
                />

                {/* Right Y-Axis: 2 Customer Retention lines */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="satisfied"
                  name="Satisfied"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: '#ffffff', fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="dissatisfied"
                  name="Dissatisfied"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: '#ffffff', fill: '#ef4444' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 1 Bottom Action Row: Metadata on Left, Insights button on Right */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#f0eae1]">
            <span className="text-[11px] text-slate-400 font-medium truncate">
              Operational Latency Threshold Analysis
            </span>
            <button
              type="button"
              onClick={() => setShowChart1Insights((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs flex-shrink-0 ${
                showChart1Insights
                  ? 'bg-[#e05a33] text-white shadow-xs ring-2 ring-[#e05a33]/20'
                  : 'bg-[#faedd9] text-[#e05a33] hover:bg-[#f6dfc2] border border-[#f4dbb8]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insights</span>
              {showChart1Insights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Chart 1 Dynamic Insights Panel */}
          {showChart1Insights && (
            <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#fffdfa] to-[#faf4eb] border border-[#f5dfc0] shadow-xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#e05a33] text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none">
                      Wait Time &amp; Retention Insights
                    </h5>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Dynamically computed based on active top filters
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#e05a33] bg-[#faedd9] px-2 py-0.5 rounded-full border border-[#f4dbb8]">
                  Key Summary
                </span>
              </div>

              {/* 1. Key Metrics / Numbers */}
              <div className="grid grid-cols-3 gap-2">
                {chart1Insights.keyNumbers.map((k, idx) => (
                  <div key={idx} className="bg-white/90 p-2 sm:p-2.5 rounded-lg border border-[#f0eae1] shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 block truncate">{k.label}</span>
                    <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 tracking-tight">{k.value}</div>
                    <span className="text-[9px] text-slate-400 block truncate mt-0.5">{k.sub}</span>
                  </div>
                ))}
              </div>

              {/* 2. Key Watch-out */}
              <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                    Key Watch-out
                  </span>
                  <p className="text-xs text-amber-900/90 leading-relaxed font-normal">
                    {chart1Insights.watchOut}
                  </p>
                </div>
              </div>

              {/* 3. Manager Action */}
              <div className="flex items-start gap-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 text-xs text-emerald-950">
                <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
                    Manager Recommendation
                  </span>
                  <p className="text-xs text-emerald-950 leading-relaxed font-normal">
                    {chart1Insights.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2 */}
        <div className="bg-white border border-[#f0eae1] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Satisfaction by {
                  satisfactionDimension === 'diningType'
                    ? 'Dining Type'
                    : satisfactionDimension === 'loyalty'
                    ? 'Loyalty'
                    : 'Dining Occasion'
                }
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {satisfactionDimension === 'diningType' && 'Comparing outcomes across Dine-in vs. Takeaway'}
                {satisfactionDimension === 'loyalty' && 'Comparing outcomes across Member vs. Non-Member'}
                {satisfactionDimension === 'occasion' && 'Comparing outcomes across Business, Casual, & Celebration'}
              </p>
            </div>

            {/* Pill-shaped interactive view toggles */}
            <div className="inline-flex items-center p-0.5 bg-[#f4eee6] border border-[#e5dcce] rounded-full self-start sm:self-auto shadow-2xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setSatisfactionDimension('diningType')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  satisfactionDimension === 'diningType'
                    ? 'bg-[#e05a33] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Dining Type
              </button>
              <button
                type="button"
                onClick={() => setSatisfactionDimension('loyalty')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  satisfactionDimension === 'loyalty'
                    ? 'bg-[#e05a33] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Loyalty
              </button>
              <button
                type="button"
                onClick={() => setSatisfactionDimension('occasion')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  satisfactionDimension === 'occasion'
                    ? 'bg-[#e05a33] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Occasion
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionChartData} margin={{ top: 10, right: 10, bottom: 10, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eae1" opacity={0.8} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#f0eae1',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: any) => [`${value} patrons`, name]}
                />
                <Bar dataKey="satisfied" name="Satisfied" fill="#10b981" stackId="a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="churnRisk" name="Dissatisfied" fill="#f43f5e" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Chart 2 Bottom Action Row: Legend on Left, Insights button on Right */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#f0eae1] text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium text-xs">Satisfied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 font-medium text-xs">Dissatisfied</span>
              </div>
            </div>

            {/* Insights button in the bottom-right */}
            <button
              type="button"
              onClick={() => setShowChart2Insights((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs flex-shrink-0 ${
                showChart2Insights
                  ? 'bg-[#e05a33] text-white shadow-xs ring-2 ring-[#e05a33]/20'
                  : 'bg-[#faedd9] text-[#e05a33] hover:bg-[#f6dfc2] border border-[#f4dbb8]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insights</span>
              {showChart2Insights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Chart 2 Dynamic Insights Panel */}
          {showChart2Insights && (
            <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#fffdfa] to-[#faf4eb] border border-[#f5dfc0] shadow-xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#e05a33] text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none">
                      {chart2Insights.dimensionTitle}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Dimension &amp; active filter reactive
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#e05a33] bg-[#faedd9] px-2 py-0.5 rounded-full border border-[#f4dbb8]">
                  Dimension Breakdown
                </span>
              </div>

              {/* 1. Key Metrics / Numbers */}
              <div className="grid grid-cols-3 gap-2">
                {chart2Insights.keyNumbers.map((k, idx) => (
                  <div key={idx} className="bg-white/90 p-2 sm:p-2.5 rounded-lg border border-[#f0eae1] shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 block truncate">{k.label}</span>
                    <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 tracking-tight">{k.value}</div>
                    <span className="text-[9px] text-slate-400 block truncate mt-0.5">{k.sub}</span>
                  </div>
                ))}
              </div>

              {/* 2. Key Watch-out */}
              <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                    Key Watch-out
                  </span>
                  <p className="text-xs text-amber-900/90 leading-relaxed font-normal">
                    {chart2Insights.watchOut}
                  </p>
                </div>
              </div>

              {/* 3. Manager Action */}
              <div className="flex items-start gap-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 text-xs text-emerald-950">
                <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
                    Manager Recommendation
                  </span>
                  <p className="text-xs text-emerald-950 leading-relaxed font-normal">
                    {chart2Insights.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart 3 */}
        {showCuisine && (
          <div className="bg-white border border-[#f0eae1] rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Cuisine Economics &amp; Churn %
              </h4>
              <p className="text-xs text-slate-500">Average spend &amp; dissatisfaction rate by preferred cuisine</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cuisineChartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eae1" opacity={0.8} />
                  <XAxis dataKey="cuisine" stroke="#64748b" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f0eae1', borderRadius: '0.75rem', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar yAxisId="left" dataKey="avgSpend" name="Avg Spend ($)" fill="#e05a33" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="churnRatePct" name="Churn Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e05a33]" />
                <span className="text-slate-600 font-medium">Avg Spend ($)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 font-medium">Churn %</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Searchable Customer Table */}
      <CustomerTable
        data={explorerTableData}
        onSelectForCopilot={handleSelectCustomer}
        showCuisine={showCuisine}
        onBatchAnalyze={onBatchAnalyze}
        lowScoreFilter={activeDrillDownInfo}
        onClearLowScoreFilter={handleClearDrillDown}
      />

      {/* Slide-Over Drawer for AI Incident Diagnostics */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={handleCloseDrawer}
          />

          {/* Drawer Panel (~45% width from right) */}
          <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl border-l border-[#f0eae1] z-50 flex flex-col overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-6 bg-[#f8f5ee] border-b border-[#f0eae1] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#faedd9] text-[#e05a33] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-[#e05a33]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Customer #{selectedCustomer.CustomerID} Incident Intelligence
                  </h3>
                </div>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full bg-white border border-[#f0eae1] text-slate-600 hover:text-slate-900 hover:bg-[#f4ebe1] hover:shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">

              {/* Clean Unified Customer Summary Card */}
              <div className="bg-[#fcfbf9] border border-[#f0eae1] rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white text-slate-900 border border-[#f0eae1] font-bold">
                    Customer #{selectedCustomer.CustomerID}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedCustomer.HighSatisfaction === 1
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {selectedCustomer.HighSatisfaction === 1 ? 'Satisfied' : 'Dissatisfied'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-slate-400 block text-[10px] font-semibold">Demographics</span>
                    <span className="font-bold text-slate-800">{selectedCustomer.Age} yrs, {selectedCustomer.Gender}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-slate-400 block text-[10px] font-semibold">AvgSpend</span>
                    <span className="font-bold text-emerald-600">${selectedCustomer.AverageSpend?.toFixed(2)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-slate-400 block text-[10px] font-semibold">Wait Time</span>
                    <span className="font-bold text-amber-600">{Number(selectedCustomer.WaitTime).toFixed(2)}m</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-slate-400 block text-[10px] font-semibold">Ratings (S/F/A)</span>
                    <span className="font-mono font-bold text-slate-800">★ {selectedCustomer.ServiceRating} / {selectedCustomer.FoodRating} / {selectedCustomer.AmbianceRating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-[#f0eae1]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-slate-400 block text-[10px] font-semibold">{showCuisine ? 'Cuisine & Occasion' : 'Occasion'}</span>
                    <span className="font-bold text-slate-800">{showCuisine ? `${selectedCustomer.PreferredCuisine}, ${selectedCustomer.DiningOccasion}, ${selectedCustomer.MealType}` : `${selectedCustomer.DiningOccasion}, ${selectedCustomer.MealType}`}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-slate-400 block text-[10px] font-semibold">Frequency &amp; Time</span>
                    <span className="font-bold text-slate-800">{selectedCustomer.VisitFrequency || 'Weekly'}, {selectedCustomer.TimeOfVisit || selectedCustomer.MealType || 'Breakfast'}</span>
                  </div>
                </div>
              </div>

              {/* Loading AI State */}
              {loadingAi && (
                <div className="bg-white border border-[#f0eae1] rounded-2xl p-12 text-center space-y-3 shadow-xs">
                  <div className="w-10 h-10 bg-[#faedd9] text-[#e05a33] rounded-full flex items-center justify-center mx-auto animate-pulse border border-[#f4dbb8]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Running AI Incident Diagnostics...</h4>
                  <p className="text-xs text-slate-500">Cross-referencing true wait times and ratings against enterprise retention dataset.</p>
                </div>
              )}

              {/* AI Error State */}
              {aiError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    AI Diagnostic Error
                  </div>
                  {aiError}
                </div>
              )}

              {/* AI Result Report (Only Incident Severity & Operational Root Cause) */}
              {aiResult && !loadingAi && (
                <div className="space-y-4">
                  
                  {/* 1. Incident Severity Badge */}
                  <div className="bg-white border border-[#f0eae1] rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Incident Severity</span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-extrabold tracking-wide uppercase border inline-flex items-center gap-1.5 ${
                      aiResult.retention_risk_level === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : aiResult.retention_risk_level === 'HIGH'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {aiResult.retention_risk_level}
                    </span>
                  </div>

                  {/* 2. Operational Root Cause */}
                  <div className="bg-white border border-[#f0eae1] rounded-2xl p-4 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-amber-600" />
                      Operational Root Cause
                    </h4>
                    <div className="bg-[#fcfbf9] p-3 rounded-xl border border-[#f0eae1] space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Primary Bottleneck:</span>
                        <p className="text-rose-600 font-bold text-sm mt-0.5">
                          {aiResult.failure_point}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#f0eae1]">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Key Diagnostic Highlights:</span>
                        <ul className="space-y-1.5 text-slate-700 font-medium">
                          {Array.isArray(aiResult.metrics_analysis) ? (
                            aiResult.metrics_analysis.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-[#e05a33] font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="flex items-start gap-2">
                              <span className="text-[#e05a33] font-bold">•</span>
                              <span>{aiResult.metrics_analysis}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#f8f5ee] border-t border-[#f0eae1] text-right">
              <button
                onClick={handleCloseDrawer}
                className="px-5 py-2 bg-[#f0eae1] hover:bg-[#e4d9cc] text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
