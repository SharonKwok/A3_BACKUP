'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  BarChart3,
  Sparkles,
  Utensils,
  MessageSquare,
  User,
  X,
  Mail,
  Shield,
  Briefcase,
  Settings,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
  CheckCircle,
  FileSearch,
  SearchCheck,
  FilterX,
  Info
} from 'lucide-react';
import { parseUploadedFile, analyzeMissingValues, MissingValueReport } from '@/lib/dataParser';

interface HeaderProps {
  showCuisine: boolean;
  setShowCuisine: (show: boolean) => void;
  selectedCuisines: string[];
  toggleCuisine: (cuisine: string) => void;
  diningOccasion: string;
  setDiningOccasion: (val: string) => void;
  mealType: string;
  setMealType: (val: string) => void;
  satisfactionStatus: string;
  setSatisfactionStatus: (val: string) => void;
  loyaltyFilter: string;
  setLoyaltyFilter: (val: string) => void;
  maxWaitTime: number;
  setMaxWaitTime: (val: number) => void;
  resetFilters: () => void;
  onUploadNewData?: (newData: any[], filename: string) => void;
  onResetToDemoData?: () => void;
  isCustomData?: boolean;
  activeDatasetName?: string;
  recordCount?: number;
  rawData?: any[];
  dropMissingRows?: boolean;
  onToggleDropMissingRows?: (drop: boolean) => void;
}

export default function Header({
  showCuisine,
  setShowCuisine,
  selectedCuisines,
  toggleCuisine,
  diningOccasion,
  setDiningOccasion,
  mealType,
  setMealType,
  satisfactionStatus,
  setSatisfactionStatus,
  loyaltyFilter,
  setLoyaltyFilter,
  maxWaitTime,
  setMaxWaitTime,
  resetFilters,
  onUploadNewData,
  onResetToDemoData,
  isCustomData = false,
  activeDatasetName = 'Demo Dataset (1,500 records)',
  recordCount = 1500,
  rawData = [],
  dropMissingRows = false,
  onToggleDropMissingRows,
}: HeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [showMissingDetails, setShowMissingDetails] = useState(false);

  // Analyze missing values dynamically for the active dataset (demo or uploaded)
  const missingReport: MissingValueReport = useMemo(() => {
    return analyzeMissingValues(rawData);
  }, [rawData]);

  // Dataset upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const { data, filename } = await parseUploadedFile(file);
      if (onUploadNewData) {
        onUploadNewData(data, filename);
      }
      setUploadSuccess(`Successfully loaded ${data.length.toLocaleString()} records from "${filename}". Dashboard data replaced.`);
      setTimeout(() => setUploadSuccess(null), 6000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse uploaded file. Please verify CSV or XLSX structure.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetClick = () => {
    if (onResetToDemoData) {
      onResetToDemoData();
      setUploadSuccess('Reset to system demo data (1,500 records).');
      setUploadError(null);
      setTimeout(() => setUploadSuccess(null), 4000);
    }
  };

  const activeFilterCount =
    (diningOccasion !== 'ALL' ? 1 : 0) +
    (mealType !== 'ALL' ? 1 : 0) +
    (satisfactionStatus !== 'ALL' ? 1 : 0) +
    (loyaltyFilter !== 'ALL' ? 1 : 0) +
    (maxWaitTime < 60 ? 1 : 0) +
    (showCuisine && selectedCuisines.length > 0 ? 1 : 0);

  return (
    <>
      <header className="bg-white border-b border-[#f0eae1] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Brand */}
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-tr from-[#e05a33] to-[#d64520] p-2 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold tracking-tight text-slate-900">
                      DineIntellect
                    </h1>
                    {isCustomData ? (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Custom ({recordCount.toLocaleString()})
                      </span>
                    ) : null}
                    {dropMissingRows && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <FilterX className="w-2.5 h-2.5 text-amber-600" />
                        Cleaned ({recordCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-700/80 font-medium truncate max-w-[280px] sm:max-w-md">
                    AI Operations &amp; Retention • {activeDatasetName}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Controls: Filter Toggle, Settings & User Profile Icons */}
            <div className="flex items-center gap-2">
              {/* Filter Collapse/Expand Toggle Button */}
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isFilterExpanded
                    ? 'bg-[#faedd9] text-[#b45309] border-[#f4dbb8]'
                    : 'bg-[#f8f5ee] text-slate-700 border-[#f0eae1] hover:bg-[#f4ebe1]'
                }`}
                title={isFilterExpanded ? 'Hide filter parameters' : 'Show filter parameters'}
              >
                <Filter className="w-3.5 h-3.5 text-[#e05a33]" />
                <span className="hidden sm:inline">Diagnostic Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#e05a33] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                {isFilterExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  title="Reset all filters"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900 bg-[#f8f5ee] border border-[#f0eae1] hover:bg-[#f4ebe1] transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={() => setShowSettingsModal(true)}
                title={isCustomData ? `Active: ${activeDatasetName} (Click to manage/reset)` : 'Application Settings & Dataset Upload'}
                className="relative w-9 h-9 rounded-full bg-[#f8f5ee] border border-[#f0eae1] text-slate-700 flex items-center justify-center shadow-2xs hover:bg-[#f4ebe1] hover:shadow-sm transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#e05a33]" />
                {isCustomData && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" />
                )}
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                title="View Profile"
                className="w-9 h-9 rounded-full bg-[#f8f5ee] border border-[#f0eae1] text-slate-700 flex items-center justify-center shadow-2xs hover:bg-[#f4ebe1] hover:shadow-sm transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-[#e05a33]" />
              </button>
            </div>

          </div>

          {/* Moved Diagnostic Filter Parameters Container - Compact & Streamlined */}
          {isFilterExpanded && (
            <div className="mt-2 pt-2 border-t border-[#f0eae1] animate-in fade-in duration-200">
              <div className="bg-[#fcfbf9] border border-[#f0eae1] rounded-xl px-3.5 py-2.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#e05a33]" />
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                      Diagnostic Filter Parameters
                    </h3>
                  </div>
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Filters
                  </button>
                </div>

                {/* Optional Preferred Cuisine chips */}
                {showCuisine && (
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#f0eae1]/80">
                    <span className="text-[10px] font-semibold text-slate-600 flex-shrink-0">Cuisine:</span>
                    <div className="flex flex-wrap gap-1">
                      {['Chinese', 'American', 'Indian', 'Mexican', 'Italian'].map((c) => {
                        const selected = selectedCuisines.includes(c);
                        return (
                          <button
                            key={c}
                            onClick={() => toggleCuisine(c)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#e05a33] text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-[#f4ebe1] border border-[#f0eae1]'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Compact Filter Controls (Fits on 1 single row on desktop/tablet) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 items-end">
                  {/* 1. Dining Occasion */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5 truncate">Occasion</label>
                    <select
                      value={diningOccasion}
                      onChange={(e) => setDiningOccasion(e.target.value)}
                      className="w-full bg-white border border-[#f0eae1] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#e05a33] font-medium cursor-pointer shadow-2xs h-7.5"
                    >
                      <option value="ALL">All Occasions</option>
                      <option value="Casual">Casual</option>
                      <option value="Business">Business</option>
                      <option value="Celebration">Celebration</option>
                    </select>
                  </div>

                  {/* 2. Meal Type (Converted to Select Dropdown) */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5 truncate">Meal Type</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full bg-white border border-[#f0eae1] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#e05a33] font-medium cursor-pointer shadow-2xs h-7.5"
                    >
                      <option value="ALL">All Types</option>
                      <option value="Dine-in">Dine-in</option>
                      <option value="Takeaway">Takeaway</option>
                    </select>
                  </div>

                  {/* 3. Satisfaction Status */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5 truncate">Satisfaction</label>
                    <select
                      value={satisfactionStatus}
                      onChange={(e) => setSatisfactionStatus(e.target.value)}
                      className="w-full bg-white border border-[#f0eae1] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#e05a33] font-medium cursor-pointer shadow-2xs h-7.5"
                    >
                      <option value="ALL">All Status</option>
                      <option value="SATISFIED">High Satisfied [1]</option>
                      <option value="CHURN_RISK">Dissatisfied [0]</option>
                    </select>
                  </div>

                  {/* 4. Loyalty Program (Converted to Select Dropdown) */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5 truncate">Loyalty</label>
                    <select
                      value={loyaltyFilter}
                      onChange={(e) => setLoyaltyFilter(e.target.value)}
                      className="w-full bg-white border border-[#f0eae1] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#e05a33] font-medium cursor-pointer shadow-2xs h-7.5"
                    >
                      <option value="ALL">All Patrons</option>
                      <option value="MEMBERS">Members Only</option>
                      <option value="NON_MEMBERS">Non-Members</option>
                    </select>
                  </div>

                  {/* 5. Max Wait Time Threshold */}
                  <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                    <div className="flex justify-between items-center text-[10px] mb-0.5">
                      <span className="font-semibold text-slate-600 truncate">Max Wait</span>
                      <span className="font-bold text-[#e05a33] bg-[#faedd9] px-1.5 py-0.2 rounded border border-[#f4dbb8] text-[9.5px]">
                        {maxWaitTime}m
                      </span>
                    </div>
                    <div className="h-7.5 flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={60}
                        step={1}
                        value={maxWaitTime}
                        onChange={(e) => setMaxWaitTime(Number(e.target.value))}
                        className="w-full accent-[#e05a33] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative bg-white border border-[#f0eae1] rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eae1] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#faedd9] text-[#e05a33] flex items-center justify-center shadow-2xs">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Application Settings
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Configure dashboard preferences &amp; dataset
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-[#f8f5ee] border border-[#f0eae1] text-slate-600 hover:text-slate-900 hover:bg-[#f4ebe1] hover:shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden File Input for CSV / XLSX */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="space-y-4 pt-3 overflow-y-auto pr-1 flex-1">
              
              {/* 1. Dataset Management Section */}
              <div className="bg-[#fcfbf9] p-4 rounded-2xl border border-[#f0eae1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#e05a33]" />
                    <h4 className="text-xs font-bold text-slate-900">Dataset Source</h4>
                  </div>
                  {isCustomData ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Custom Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Default Demo (1,500)
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-[#f0eae1] flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 block text-[10px]">Active Data:</span>
                    <span className="font-semibold text-slate-800 truncate block">{activeDatasetName}</span>
                  </div>
                  <span className="text-xs font-bold text-[#e05a33] px-2 py-1 bg-[#faedd9] rounded-lg flex-shrink-0">
                    {recordCount.toLocaleString()} rows
                  </span>
                </div>

                {/* Upload Button */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? 'Parsing...' : 'Upload Data'}</span>
                  </button>

                  {/* Reset to Demo Data Button */}
                  <button
                    type="button"
                    onClick={handleResetClick}
                    disabled={!isCustomData}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      isCustomData
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 shadow-2xs'
                        : 'bg-slate-100/70 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                    title={isCustomData ? 'Reset back to system demo dataset (1,500 records)' : 'Already using default demo data'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset to Demo Data</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Supports <strong>.csv</strong> and <strong>.xlsx / .xls</strong>. System demo data (1,500 records) is safely preserved and will always remain available.
                </p>

                {/* Upload Feedback Messages */}
                {uploadSuccess && (
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">{uploadSuccess}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-2.5 rounded-xl animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">{uploadError}</span>
                  </div>
                )}
              </div>

              {/* 2. Dataset Missing Values Inspector (Checks Current/Uploaded Dataset) */}
              <div className="bg-[#fcfbf9] p-4 rounded-2xl border border-[#f0eae1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SearchCheck className="w-4 h-4 text-[#e05a33]" />
                    <h4 className="text-xs font-bold text-slate-900">Missing Values Audit</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      missingReport.hasMissing
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {missingReport.hasMissing ? `${missingReport.totalMissingCells} Missing Cells` : '100% Complete'}
                  </span>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-[10px] text-slate-400 block font-medium">Completeness</span>
                    <span className="text-xs font-bold text-slate-800">
                      {missingReport.overallCompletenessPct}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-[10px] text-slate-400 block font-medium">Clean Rows</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {missingReport.cleanRowsCount.toLocaleString()} / {missingReport.totalRows.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#f0eae1]">
                    <span className="text-[10px] text-slate-400 block font-medium">Rows w/ Missing</span>
                    <span className={`text-xs font-bold ${missingReport.rowsWithMissingCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {missingReport.rowsWithMissingCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Audit Status Banner */}
                {!missingReport.hasMissing ? (
                  <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium leading-snug">
                      No missing or null values found across all 19 standard dataset features.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">
                      Detected {missingReport.totalMissingCells} missing field values in active dataset. Safe fallbacks are automatically applied.
                    </span>
                  </div>
                )}

                {/* Toggle details accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMissingDetails(!showMissingDetails)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#f0eae1] py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Inspect Field Breakdown ({missingReport.totalFieldsChecked} features)</span>
                    {showMissingDetails ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {showMissingDetails && (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-[#f0eae1] bg-white divide-y divide-slate-100 text-[11px]">
                      {missingReport.fields.map((f) => (
                        <div key={f.field} className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50/80">
                          <span className="text-slate-700 font-medium truncate pr-2">{f.label}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {f.missingCount === 0 ? (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                0 missing
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                f.status === 'critical'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {f.missingCount} ({f.missingPercent}%)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2b. Interactive Drop Incomplete Rows Option */}
                <div className="bg-white p-3 rounded-xl border border-[#f0eae1] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <FilterX className="w-3.5 h-3.5 text-[#e05a33]" />
                        <h5 className="text-xs font-bold text-slate-900">
                          Exclude Incomplete Rows
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Drop rows with any blank/missing cells from active dashboard
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dropMissingRows}
                        onChange={(e) => onToggleDropMissingRows?.(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e05a33]"></div>
                    </label>
                  </div>

                  {missingReport.rowsWithMissingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onToggleDropMissingRows?.(!dropMissingRows)}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        dropMissingRows
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {dropMissingRows ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{missingReport.rowsWithMissingCount.toLocaleString()} Incomplete Rows Dropped · Click to Restore All</span>
                        </>
                      ) : (
                        <>
                          <FilterX className="w-3.5 h-3.5 text-amber-600" />
                          <span>Drop {missingReport.rowsWithMissingCount.toLocaleString()} Incomplete Rows (Keep {missingReport.cleanRowsCount.toLocaleString()} Clean Rows)</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="text-[10px] text-slate-500 flex items-start gap-1.5 bg-[#fcfbf9] px-2.5 py-1.5 rounded-lg border border-[#f0eae1]/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e05a33] flex-shrink-0 mt-1"></span>
                    <span className="leading-tight">
                      {dropMissingRows
                        ? `Filtered: Excluded ${missingReport.rowsWithMissingCount.toLocaleString()} rows with missing cells. Dashboard is using ${missingReport.cleanRowsCount.toLocaleString()} 100% complete records.`
                        : missingReport.hasMissing
                        ? `${missingReport.rowsWithMissingCount.toLocaleString()} rows have at least one blank field. Enable toggle to drop them.`
                        : 'Current dataset has 0 missing values. All 1,500 records are completely filled.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Preferred Cuisine Filter Preference */}
              <div className="flex items-center justify-between bg-[#fcfbf9] p-3.5 rounded-2xl border border-[#f0eae1]">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Preferred Cuisine Filter</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Show cuisine categories &amp; analytics</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCuisine}
                    onChange={(e) => setShowCuisine(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e05a33]"></div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setShowProfileModal(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white border border-[#f0eae1] rounded-3xl p-6 max-w-sm w-full shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eae1]">
              <h3 className="text-sm font-bold text-slate-900">User Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-[#f8f5ee] border border-[#f0eae1] text-slate-600 hover:text-slate-900 hover:bg-[#f4ebe1] hover:shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-full bg-[#faedd9] border-2 border-[#f4dbb8] text-[#e05a33] flex items-center justify-center shadow-md">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Alex Thorne</h4>
                <p className="text-xs text-slate-500 mt-0.5">Enterprise Operations &amp; Retention</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-3 bg-[#fcfbf9] p-3 rounded-xl border border-[#f0eae1]">
                <div className="w-8 h-8 rounded-lg bg-[#faedd9] text-[#e05a33] flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Position</span>
                  <span className="font-bold text-slate-800">General Manager (Operations &amp; Churn Prevention)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#fcfbf9] p-3 rounded-xl border border-[#f0eae1]">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Email</span>
                  <span className="font-bold text-slate-800 font-mono">manager@dineintellect.com</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#fcfbf9] p-3 rounded-xl border border-[#f0eae1]">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Security Role</span>
                  <span className="font-bold text-slate-800">Enterprise Administrator (Full RBAC Access)</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2.5 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
