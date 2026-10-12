'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ViewAnalytics from '@/components/ViewAnalytics';
import ViewCopilot from '@/components/ViewCopilot';
import { Loader2, AlertCircle, Utensils, Sparkles } from 'lucide-react';
import { normalizeCustomerRow } from '@/lib/dataParser';

export default function Home() {
  const [rawDataset, setRawDataset] = useState<any[]>([]);
  const [defaultRawDataset, setDefaultRawDataset] = useState<any[]>([]);
  const [dropMissingRows, setDropMissingRows] = useState<boolean>(false);
  const [activeDatasetName, setActiveDatasetName] = useState<string>('Demo Dataset (1,500 records)');
  const [isCustomData, setIsCustomData] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showCuisine, setShowCuisine] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Active displayed data: if dropMissingRows is enabled, excludes any row with missing/blank cells
  const data = useMemo(() => {
    if (dropMissingRows) {
      return rawDataset.filter((r) => !r._hasMissing);
    }
    return rawDataset;
  }, [rawDataset, dropMissingRows]);

  // Filter states lifted to page level so Header (sticky) and ViewAnalytics stay synchronized
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [diningOccasion, setDiningOccasion] = useState<string>('ALL');
  const [mealType, setMealType] = useState<string>('ALL');
  const [satisfactionStatus, setSatisfactionStatus] = useState<string>('ALL');
  const [loyaltyFilter, setLoyaltyFilter] = useState<string>('ALL');
  const [maxWaitTime, setMaxWaitTime] = useState<number>(60);

  const resetFilters = () => {
    setSelectedCuisines([]);
    setDiningOccasion('ALL');
    setMealType('ALL');
    setSatisfactionStatus('ALL');
    setLoyaltyFilter('ALL');
    setMaxWaitTime(60);
  };

  const handleUploadNewData = (newData: any[], filename: string) => {
    setRawDataset(newData);
    setIsCustomData(true);
    setActiveDatasetName(`${filename} (${newData.length.toLocaleString()} records)`);
    resetFilters();
    setSelectedCustomer(null);
  };

  const handleResetToDemoData = () => {
    if (defaultRawDataset.length > 0) {
      setRawDataset(defaultRawDataset);
    }
    setIsCustomData(false);
    setActiveDatasetName(`Demo Dataset (${(defaultRawDataset.length || 1500).toLocaleString()} records)`);
    resetFilters();
    setSelectedCustomer(null);
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  // Lifted chat messages state so history persists across opening/closing
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    {
      role: 'model',
      content: 'Hello General Manager. I am your DineIntellect AI Copilot. Ask me operational questions, analyze dissatisfaction drivers, or test our dining metrics.',
    },
  ]);

  // Freely Resizable AI Copilot Window States
  const [copilotWidth, setCopilotWidth] = useState<number>(480);
  const [copilotHeight, setCopilotHeight] = useState<number>(680);
  const [isCopilotMaximized, setIsCopilotMaximized] = useState<boolean>(false);
  const [isDraggingSize, setIsDraggingSize] = useState<boolean>(false);

  const handleStartResize = (direction: 'left' | 'top' | 'corner') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCopilotMaximized(false);
    setIsDraggingSize(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = copilotWidth;
    const startH = copilotHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (direction === 'left' || direction === 'corner') {
        const deltaX = startX - moveEvent.clientX; // dragging left expands width
        const maxW = Math.min(1200, window.innerWidth - 32);
        const newW = Math.max(380, Math.min(maxW, startW + deltaX));
        setCopilotWidth(newW);
      }
      if (direction === 'top' || direction === 'corner') {
        const deltaY = startY - moveEvent.clientY; // dragging up expands height
        const maxH = Math.min(950, window.innerHeight - 80);
        const newH = Math.max(420, Math.min(maxH, startH + deltaY));
        setCopilotHeight(newH);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingSize(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/data');
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to load dataset');
        }
        // Normalize rows to guarantee missing value tags and properties are set
        const normalized = (json.data as any[]).map((row, idx) => normalizeCustomerRow(row, idx));
        setRawDataset(normalized);
        setDefaultRawDataset(normalized);
        setActiveDatasetName(`Demo Dataset (${(normalized.length || 1500).toLocaleString()} records)`);
      } catch (err: any) {
        setError(err.message || 'Error loading dataset');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectForCopilot = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleBatchAnalyze = async (selectedCustomers: any[], customerNotes: Record<string, string>) => {
    if (!selectedCustomers || selectedCustomers.length === 0) return;

    // 1. Immediately open the Copilot panel (Figure 4)
    setIsCopilotOpen(true);

    const idsList = selectedCustomers.map((c) => `#${c.CustomerID}`).join(', ');
    const notesSummary = selectedCustomers
      .filter((c) => customerNotes[String(c.CustomerID)])
      .map((c) => `Customer #${c.CustomerID} note: "${customerNotes[String(c.CustomerID)]}"`)
      .join('; ');

    const userPrompt = `Please run a comparative AI analysis on ${selectedCustomers.length} selected customers (${idsList}).${
      notesSummary ? ` Supervisor notes: ${notesSummary}.` : ''
    } Compare their wait times, spending, and service ratings, diagnose friction points, and provide floor recommendations.`;

    const nextUserMsg = { role: 'user' as const, content: userPrompt };
    const loadingMsg = {
      role: 'model' as const,
      content: `Synthesizing operational metrics and analyzing records for ${selectedCustomers.length} selected customers (${idsList})...`,
    };

    setMessages((prev) => [...prev, nextUserMsg, loadingMsg]);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, nextUserMsg],
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to complete analysis');

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'model', content: json.reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'model', content: `AI Analysis Notice: ${err.message || 'Unable to retrieve insights'}` },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex flex-col items-center justify-center text-slate-900 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#e05a33] to-[#d64520] rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#e05a33]" />
          Loading DineIntellect Enterprise Analytics &amp; Dataset...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center p-4">
        <div className="bg-white border border-[#f0eae1] rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Failed to Initialize Dataset</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-slate-900 flex flex-col font-sans selection:bg-[#e05a33] selection:text-white relative">
      
      {/* Top Header */}
      <Header
        showCuisine={showCuisine}
        setShowCuisine={setShowCuisine}
        selectedCuisines={selectedCuisines}
        toggleCuisine={toggleCuisine}
        diningOccasion={diningOccasion}
        setDiningOccasion={setDiningOccasion}
        mealType={mealType}
        setMealType={setMealType}
        satisfactionStatus={satisfactionStatus}
        setSatisfactionStatus={setSatisfactionStatus}
        loyaltyFilter={loyaltyFilter}
        setLoyaltyFilter={setLoyaltyFilter}
        maxWaitTime={maxWaitTime}
        setMaxWaitTime={setMaxWaitTime}
        resetFilters={resetFilters}
        onUploadNewData={handleUploadNewData}
        onResetToDemoData={handleResetToDemoData}
        isCustomData={isCustomData}
        activeDatasetName={activeDatasetName}
        recordCount={data.length}
        rawData={rawDataset}
        dropMissingRows={dropMissingRows}
        onToggleDropMissingRows={setDropMissingRows}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        <ViewAnalytics
          data={data}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          onSelectForCopilot={handleSelectForCopilot}
          showCuisine={showCuisine}
          setShowCuisine={setShowCuisine}
          onBatchAnalyze={handleBatchAnalyze}
          selectedCuisines={selectedCuisines}
          diningOccasion={diningOccasion}
          mealType={mealType}
          satisfactionStatus={satisfactionStatus}
          loyaltyFilter={loyaltyFilter}
          maxWaitTime={maxWaitTime}
        />
      </main>

      {/* Floating Bottom-Right AI Copilot Button (Image 2 & 3 Style) */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-tr from-[#e05a33] to-[#d64520] hover:from-[#cf4e28] hover:to-[#be3e1a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer group"
          title="Open AI Copilot Chat"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#e05a33] rounded-full text-[10px] font-bold flex items-center justify-center shadow-md border border-[#f0eae1]">
            AI
          </span>
        </button>
      )}

      {/* Freely Resizable Floating AI Copilot Window */}
      {isCopilotOpen && (
        <div
          style={{
            width: isCopilotMaximized ? 'calc(100vw - 32px)' : `${copilotWidth}px`,
            maxWidth: isCopilotMaximized ? '1140px' : 'calc(100vw - 32px)',
            height: isCopilotMaximized ? 'calc(100vh - 90px)' : `${copilotHeight}px`,
            maxHeight: 'calc(100vh - 90px)',
          }}
          className={`fixed right-4 bottom-4 z-50 flex flex-col shadow-2xl rounded-2xl md:rounded-3xl border border-[#f0eae1] bg-white animate-in slide-in-from-right duration-200 ${
            isDraggingSize ? 'select-none transition-none' : 'transition-[width,height] duration-150'
          }`}
        >
          {/* Left Edge Drag Handle (Resize Width) */}
          <div
            onPointerDown={handleStartResize('left')}
            className="absolute -left-2 top-0 bottom-0 w-4 hover:w-5 hover:bg-[#e05a33]/15 cursor-ew-resize transition-all z-30 group flex items-center justify-center"
            title="Drag left/right to resize width"
          >
            <div className="w-1 h-12 bg-slate-300 group-hover:bg-[#e05a33] rounded-full transition-colors opacity-60 group-hover:opacity-100" />
          </div>

          {/* Top Edge Drag Handle (Resize Height) */}
          <div
            onPointerDown={handleStartResize('top')}
            className="absolute -top-2 left-0 right-0 h-4 hover:h-5 hover:bg-[#e05a33]/15 cursor-ns-resize transition-all z-30 group flex items-center justify-center"
            title="Drag up/down to resize height"
          >
            <div className="h-1 w-12 bg-slate-300 group-hover:bg-[#e05a33] rounded-full transition-colors opacity-60 group-hover:opacity-100" />
          </div>

          {/* Top-Left Corner Drag Handle (Resize Width & Height) */}
          <div
            onPointerDown={handleStartResize('corner')}
            className="absolute -top-2.5 -left-2.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize hover:bg-[#e05a33]/20 rounded-tl-2xl z-40 group shadow-2xs"
            title="Drag corner to freely resize both width and height"
          >
            <div className="w-3.5 h-3.5 border-t-2 border-l-2 border-slate-400 group-hover:border-[#e05a33] transition-colors rounded-tl" />
          </div>

          <ViewCopilot
            data={data}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            mode="copilot"
            messages={messages}
            setMessages={setMessages}
            onClose={() => setIsCopilotOpen(false)}
            isMaximized={isCopilotMaximized}
            onToggleMaximize={() => setIsCopilotMaximized((prev) => !prev)}
            currentWidth={copilotWidth}
            onSetWidthPreset={(w: number) => {
              setIsCopilotMaximized(false);
              setCopilotWidth(w);
            }}
          />
        </div>
      )}

    </div>
  );
}
