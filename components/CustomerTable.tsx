'use client';

import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Flag,
  FlagOff,
  NotebookPen,
  Eraser,
  X,
  Trash2,
  Check
} from 'lucide-react';

interface CustomerTableProps {
  data: any[];
  onSelectForCopilot: (customer: any) => void;
  showCuisine: boolean;
  onBatchAnalyze?: (selectedCustomers: any[], customerNotes: Record<string, string>) => void;
  lowScoreFilter?: { type: 'food' | 'service' | 'ambience'; label: string; count: number } | null;
  onClearLowScoreFilter?: () => void;
}

export default function CustomerTable({
  data,
  onSelectForCopilot,
  showCuisine,
  onBatchAnalyze,
  lowScoreFilter,
  onClearLowScoreFilter
}: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);
  const itemsPerPage = 20; // 20 records per page for smooth performance

  // Multi-selection state (Preserved across pagination)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Persistent Flagged IDs and Notes (initialized from localStorage without cascading effect render)
  const [flaggedIds, setFlaggedIds] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedFlags = localStorage.getItem('dineintellect_flagged_customers');
      return savedFlags ? JSON.parse(savedFlags) : [];
    } catch {
      return [];
    }
  });

  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const savedNotes = localStorage.getItem('dineintellect_customer_notes');
      return savedNotes ? JSON.parse(savedNotes) : {};
    } catch {
      return {};
    }
  });

  // Active Note Modal State
  const [noteCustomer, setNoteCustomer] = useState<any | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Toggle flag status with persistent auto-save
  const toggleFlag = (id: number) => {
    setFlaggedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('dineintellect_flagged_customers', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save flagged customers:', e);
      }
      return updated;
    });
  };

  // Clear all flags button
  const handleClearAllFlags = () => {
    if (flaggedIds.length === 0) return;
    setFlaggedIds([]);
    try {
      localStorage.removeItem('dineintellect_flagged_customers');
    } catch (e) {
      console.warn('Failed to clear flagged customers:', e);
    }
  };

  // Clear all notes button
  const handleClearAllNotes = () => {
    if (Object.keys(customerNotes).length === 0) return;
    setCustomerNotes({});
    try {
      localStorage.removeItem('dineintellect_customer_notes');
    } catch (e) {
      console.warn('Failed to clear customer notes:', e);
    }
  };

  // Selection toggle (Preserved across page switching)
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open note modal for a specific customer
  const handleOpenNote = (customer: any) => {
    setNoteCustomer(customer);
    setNoteDraft(customerNotes[String(customer.CustomerID)] || '');
    setSavedSuccess(false);
  };

  // Save note to state and localStorage
  const handleSaveNote = () => {
    if (!noteCustomer) return;
    const custIdStr = String(noteCustomer.CustomerID);
    const updated = { ...customerNotes };

    if (noteDraft.trim()) {
      updated[custIdStr] = noteDraft.trim();
    } else {
      delete updated[custIdStr];
    }

    setCustomerNotes(updated);
    try {
      localStorage.setItem('dineintellect_customer_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save customer notes:', e);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setNoteCustomer(null);
      setSavedSuccess(false);
    }, 400);
  };

  // Delete note
  const handleDeleteNote = () => {
    if (!noteCustomer) return;
    const custIdStr = String(noteCustomer.CustomerID);
    const updated = { ...customerNotes };
    delete updated[custIdStr];

    setCustomerNotes(updated);
    try {
      localStorage.setItem('dineintellect_customer_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save customer notes:', e);
    }
    setNoteCustomer(null);
  };

  // Filter logic: includes ID, notes text, cuisine, occasion, and gender
  const filteredData = data.filter((item) => {
    const noteText = customerNotes[String(item.CustomerID)] || '';
    const matchesSearch =
      String(item.CustomerID).includes(searchTerm) ||
      noteText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (showCuisine && item.PreferredCuisine?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.DiningOccasion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Gender?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Sort logic: supports FLAGGED / REVIEWED (brings all flagged AND reviewed items to the top)
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'FLAGGED' || sortBy === 'FLAGGED_AND_REVIEWED') {
      const aReviewed = flaggedIds.includes(a.CustomerID) || Boolean(customerNotes[String(a.CustomerID)]);
      const bReviewed = flaggedIds.includes(b.CustomerID) || Boolean(customerNotes[String(b.CustomerID)]);

      if (aReviewed && !bReviewed) return -1;
      if (!aReviewed && bReviewed) return 1;

      // Secondary: flagged first, then notes
      const aFlagged = flaggedIds.includes(a.CustomerID);
      const bFlagged = flaggedIds.includes(b.CustomerID);
      if (aFlagged && !bFlagged) return -1;
      if (!aFlagged && bFlagged) return 1;

      return (a.CustomerID || 0) - (b.CustomerID || 0);
    }
    if (sortBy === 'NOTES_ONLY') {
      const aHasNote = Boolean(customerNotes[String(a.CustomerID)]);
      const bHasNote = Boolean(customerNotes[String(b.CustomerID)]);
      if (aHasNote && !bHasNote) return -1;
      if (!aHasNote && bHasNote) return 1;
      return (a.CustomerID || 0) - (b.CustomerID || 0);
    }
    if (sortBy === 'WAIT_TIME') {
      return (b.WaitTime || 0) - (a.WaitTime || 0);
    }
    if (sortBy === 'SPEND') {
      return (b.AverageSpend || 0) - (a.AverageSpend || 0);
    }
    if (sortBy === 'SERVICE_RATING') {
      return (a.ServiceRating || 0) - (b.ServiceRating || 0);
    }
    // DEFAULT
    return (a.CustomerID || 0) - (b.CustomerID || 0);
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentPageIds = paginatedData.map((d) => d.CustomerID);
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  // Trigger batch analysis in Copilot (Figure 4)
  const handleBatchAnalyzeClick = () => {
    if (selectedIds.length === 0 || !onBatchAnalyze) return;
    const selectedCustomers = data.filter((d) => selectedIds.includes(d.CustomerID));
    onBatchAnalyze(selectedCustomers, customerNotes);
  };

  const reviewedOrFlaggedCount = Array.from(
    new Set([...flaggedIds, ...Object.keys(customerNotes).map(Number)])
  ).length;

  return (
    <div
      id="customer-dining-records-explorer"
      className="bg-white border border-[#f0eae1] rounded-2xl shadow-xs overflow-visible relative scroll-mt-6"
    >
      {/* Active Low Score Drill-Down Filter Banner */}
      {lowScoreFilter && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-200/80 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-rose-800">
              Active Drill-Down: Filtered to customers with {lowScoreFilter.label} &lt; 3.0
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-rose-700 border border-rose-200 shadow-2xs">
              {lowScoreFilter.count} records
            </span>
          </div>
          {onClearLowScoreFilter && (
            <button
              onClick={onClearLowScoreFilter}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset drill-down filter
            </button>
          )}
        </div>
      )}

      {/* Table Header & Toolbar */}
      <div className="p-5 border-b border-[#f0eae1] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Customer Dining Records Explorer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Explore real dining records and trigger AI incident intelligence</p>
        </div>

        {/* Toolbar: Search, Clear Flags/Notes, and Sort By */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search exact ID, notes or cu..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#fcfbf9] border border-[#f0eae1] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e05a33] w-52 sm:w-60 font-mono transition-all"
            />
          </div>

          {/* Clear Flags Button */}
          <button
            type="button"
            onClick={handleClearAllFlags}
            disabled={flaggedIds.length === 0}
            title="Unflag all flagged customer records"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-amber-200/80 bg-amber-50/70 text-amber-800 hover:bg-amber-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <FlagOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Clear Flags {flaggedIds.length > 0 ? `(${flaggedIds.length})` : ''}</span>
          </button>

          {/* Clear Notes Button */}
          <button
            type="button"
            onClick={handleClearAllNotes}
            disabled={Object.keys(customerNotes).length === 0}
            title="Clear all saved customer review notes"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-blue-200/80 bg-blue-50/70 text-blue-800 hover:bg-blue-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <Eraser className="w-3.5 h-3.5 text-blue-600" />
            <span>Clear Notes {Object.keys(customerNotes).length > 0 ? `(${Object.keys(customerNotes).length})` : ''}</span>
          </button>

          {/* Sort By Dropdown (Screenshot 1 & 2) */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-[#fcfbf9] border border-[#f0eae1] rounded-xl px-3 py-2 text-xs text-slate-700 font-medium hover:bg-[#f8f5ee] transition-all cursor-pointer">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none cursor-pointer text-slate-800 font-medium"
              >
                <option value="DEFAULT">Sort: ID (Default)</option>
                <option value="FLAGGED">
                  Sort: Flagged &amp; Reviewed {reviewedOrFlaggedCount > 0 ? `(${reviewedOrFlaggedCount})` : ''}
                </option>
                <option value="NOTES_ONLY">
                  Sort: Has Review Notes {Object.keys(customerNotes).length > 0 ? `(${Object.keys(customerNotes).length})` : ''}
                </option>
                <option value="WAIT_TIME">Sort: Longest Wait Time</option>
                <option value="SPEND">Sort: Highest Spend</option>
                <option value="SERVICE_RATING">Sort: Lowest Service Rating</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table with overflow-visible to ensure tooltip is never clipped */}
      <div className="overflow-visible">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f8f5ee]/80 text-slate-600 border-b border-[#f0eae1] font-semibold relative">
              <th className="py-3 px-4 min-w-[170px]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectAllCurrentPage}
                    title="Select / deselect all visible customers on this page"
                    className="w-3.5 h-3.5 rounded text-[#e05a33] border-slate-300 focus:ring-[#e05a33] accent-[#e05a33] cursor-pointer"
                  />
                  <span>Customer ID</span>
                </div>
              </th>
              <th className="py-3 px-4">Demographics</th>
              <th className="py-3 px-4">{showCuisine ? 'Cuisine & Occasion' : 'Occasion'}</th>
              <th className="py-3 px-4">Frequency &amp; Time</th>
              <th className="py-3 px-4">AvgSpend</th>
              <th className="py-3 px-4">Wait Time</th>
              <th
                className="py-3 px-4 relative select-none cursor-pointer"
                onMouseEnter={() => setShowRatingTooltip(true)}
                onMouseLeave={() => setShowRatingTooltip(false)}
              >
                Ratings (S/F/A)
                {showRatingTooltip && (
                  <div className="absolute z-50 left-4 top-full mt-1 w-48 bg-white/95 backdrop-blur-md border border-[#f0eae1] text-slate-900 text-[11px] rounded-xl p-3 shadow-2xl space-y-1 font-sans animate-in fade-in duration-200 pointer-events-none">
                    <div className="font-bold border-b border-[#f0eae1] pb-1 mb-1 text-[#e05a33]">Rating Breakdown</div>
                    <div><strong>S</strong>: ServiceRating</div>
                    <div><strong>F</strong>: FoodRating</div>
                    <div><strong>A</strong>: AmbianceRating</div>
                  </div>
                )}
              </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">AI Analyse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f0e8] text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  {sortBy === 'FLAGGED' && reviewedOrFlaggedCount === 0
                    ? 'No customers have been flagged or reviewed yet. Click the flag or notebook icon next to any Customer ID.'
                    : 'No matching real CSV customer records found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isFlagged = flaggedIds.includes(row.CustomerID);
                const custNote = customerNotes[String(row.CustomerID)];
                const hasNote = Boolean(custNote);
                const isSelected = selectedIds.includes(row.CustomerID);

                return (
                  <tr
                    key={row.CustomerID}
                    className={`hover:bg-[#fcfbf9] transition-colors group ${
                      isSelected ? 'bg-orange-50/40' : isFlagged ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Customer ID column: Checkbox + Flag + Notebook Note + #ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* 0. Customer multi-select checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(row.CustomerID)}
                          className="w-3.5 h-3.5 rounded text-[#e05a33] border-slate-300 focus:ring-[#e05a33] accent-[#e05a33] cursor-pointer mr-0.5"
                          title={isSelected ? 'Deselect customer' : 'Select for multi-customer AI analysis'}
                        />

                        {/* 1. Flag for review button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlag(row.CustomerID);
                          }}
                          title={isFlagged ? 'Flagged for review (Click to unflag)' : 'Flag for review'}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isFlagged
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-2xs'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-[#f8f5ee]'
                          }`}
                        >
                          <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-600' : ''}`} />
                        </button>

                        {/* 2. Leave / Edit Note button (NotebookPen icon, no emoji) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenNote(row);
                          }}
                          title={hasNote ? `Note: "${custNote}" (Click to view/edit)` : 'Leave a note'}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
                            hasNote
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-2xs'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-[#f8f5ee]'
                          }`}
                        >
                          <NotebookPen className="w-3.5 h-3.5" />
                          {hasNote && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full border border-white" />
                          )}
                        </button>

                        {/* 3. Customer ID */}
                        <span className="font-mono font-bold text-slate-900 ml-0.5">
                          #{row.CustomerID}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{row.Age} yrs, {row.Gender}</div>
                      <div className="text-[10px] text-slate-400">Income: ${row.Income?.toLocaleString()}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{showCuisine ? `${row.PreferredCuisine}, ${row.DiningOccasion}, ${row.MealType}` : `${row.DiningOccasion}, ${row.MealType}`}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{row.VisitFrequency || 'Weekly'}, {row.TimeOfVisit || row.MealType || 'Breakfast'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ${row.AverageSpend?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg font-medium inline-block ${
                        row.WaitTime > 40 ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold' : 'bg-[#f8f5ee] text-slate-700'
                      }`}>
                        {Number(row.WaitTime).toFixed(2)}m
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-mono text-[11px] font-medium">
                        <span className="text-amber-600 font-bold">★ {row.ServiceRating}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-600">{row.FoodRating}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-600">{row.AmbianceRating}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {row.HighSatisfaction === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Satisfied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Dissatisfied
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectForCopilot(row)}
                        title="AI Analyse"
                        className="inline-flex items-center justify-center p-2.5 bg-[#e05a33] hover:bg-[#cf4e28] hover:shadow-sm text-white rounded-xl transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Screenshot 3 Area: Auto shows AI Analyse button when customers are selected) */}
      <div className="p-4 border-t border-[#f0eae1] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.length)} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </span>
          {flaggedIds.length > 0 && (
            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {flaggedIds.length} flagged for review
            </span>
          )}
          {Object.keys(customerNotes).length > 0 && (
            <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {Object.keys(customerNotes).length} with notes
            </span>
          )}

          {/* AI Analyse Button in Screenshot 3 location */}
          {selectedIds.length > 0 && (
            <div className="inline-flex items-center gap-2 ml-2 animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={handleBatchAnalyzeClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-tr from-[#e05a33] to-[#d64520] hover:from-[#cf4e28] hover:to-[#be3e1a] text-white rounded-xl text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI Analyse ({selectedIds.length} Selected)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-slate-700 underline text-[11px] cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-[#f8f5ee] text-slate-700 hover:bg-[#f4ebe1] hover:shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg bg-[#f8f5ee] text-slate-700 hover:bg-[#f4ebe1] hover:shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Action Pill Bar for Batch AI Analysis (Follows viewport so user can trigger from anywhere) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-3.5 animate-in slide-in-from-bottom duration-300">
          <span className="text-xs font-medium">
            <strong className="text-amber-400 font-bold">{selectedIds.length}</strong> customer{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleBatchAnalyzeClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Analyse Selected
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Leave a Note Modal */}
      {noteCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setNoteCustomer(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white border border-[#f0eae1] rounded-3xl p-6 max-w-md w-full shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eae1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <NotebookPen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Review Note for Customer #{noteCustomer.CustomerID}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {noteCustomer.DiningOccasion} ({noteCustomer.MealType}) • Spend: ${Number(noteCustomer.AverageSpend).toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNoteCustomer(null)}
                className="w-8 h-8 rounded-full bg-[#f8f5ee] border border-[#f0eae1] text-slate-600 hover:text-slate-900 hover:bg-[#f4ebe1] hover:shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Operational Notes &amp; Observations:
              </label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={5}
                placeholder="Write specific incident remarks, floor supervisor feedback, follow-up actions, or customer preferences..."
                className="w-full bg-[#fcfbf9] border border-[#f0eae1] rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e05a33] focus:bg-white resize-none transition-all"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              {customerNotes[String(noteCustomer.CustomerID)] ? (
                <button
                  type="button"
                  onClick={handleDeleteNote}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Note
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNoteCustomer(null)}
                  className="px-4 py-2 bg-[#f8f5ee] hover:bg-[#f0eae1] text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved!
                    </>
                  ) : (
                    'Save Note'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
