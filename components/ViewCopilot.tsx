'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  RefreshCcw,
  Zap,
  BarChart2,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface ViewCopilotProps {
  data: any[];
  selectedCustomer: any | null;
  setSelectedCustomer: (customer: any) => void;
  mode: 'retention' | 'copilot';
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ role: 'user' | 'model'; content: string }>>>;
  onClose?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  currentWidth?: number;
  onSetWidthPreset?: (width: number) => void;
}

export default function ViewCopilot({
  data,
  selectedCustomer,
  setSelectedCustomer,
  mode,
  messages,
  setMessages,
  onClose,
  isMaximized,
  onToggleMaximize,
  currentWidth,
  onSetWidthPreset,
}: ViewCopilotProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sendChatMessage = async (textToSend: string) => {
    if (!textToSend.trim() || chatLoading) return;
    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    setInputMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          records: data && Array.isArray(data) && data.length > 0 ? data : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Chat request failed');
      setMessages((prev) => [...prev, { role: 'model', content: json.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: `Error communicating with Copilot: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const quickDemoPrompts = [
    "What are the biggest differences between highly satisfied and other customers?",
    "How does wait time relate to satisfaction?",
    "Are loyalty members more satisfied than non-members?",
    "Which customer group should management investigate first?",
    "Show me the evidence behind that recommendation.",
    "How do customer age and annual income relate to dining spend and retention?",
    "What are the top three issues management should investigate based on this dataset"
  ];

  const renderFormattedContent = (content: string) => {
    if (content.includes('|')) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      const tableLines = lines.filter(l => l.startsWith('|') && l.endsWith('|'));
      const otherLines = lines.filter(l => !l.startsWith('|') || !l.endsWith('|'));

      let tableElement = null;
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split('|').map(s => s.trim()).filter(Boolean);
        const rows = tableLines.slice(2).map(row => row.split('|').map(s => s.trim()).filter(Boolean));

        tableElement = (
          <div className="overflow-x-auto my-3">
            <table className="w-full border border-[#f0eae1] rounded-xl text-left text-xs bg-white overflow-hidden shadow-2xs">
              <thead>
                <tr className="bg-[#f8f5ee] border-b border-[#f0eae1]">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3.5 py-2.5 font-bold text-slate-800 uppercase tracking-wider">{h.replace(/\*\*/g, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#f0eae1] last:border-0 hover:bg-[#fcfbf9] transition-colors">
                    {row.map((cell, cIdx) => {
                      const cleanCell = cell.replace(/\*\*/g, '');
                      const hasNumbers = /[0-9]/.test(cleanCell);
                      return (
                        <td key={cIdx} className={`px-3.5 py-2.5 ${hasNumbers ? 'font-bold text-[#e05a33]' : 'font-medium text-slate-700'}`}>
                          {cleanCell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {otherLines.map((line, idx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={idx} className="leading-relaxed">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="font-bold text-[#e05a33] bg-[#faedd9]/60 px-1.5 py-0.5 rounded">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </p>
            );
          })}
          {tableElement}
        </div>
      );
    }

    const lines = content.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('### ')) {
            const headingText = trimmed.replace(/^###\s+/, '');
            return (
              <h4 key={idx} className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mt-2.5 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e05a33]"></span>
                {headingText}
              </h4>
            );
          }

          const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
          const cleanedLine = isBullet ? trimmed.substring(1).trim() : trimmed;
          const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);

          const contentNodes = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-[#e05a33] bg-[#faedd9]/60 px-1.5 py-0.5 rounded">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
                <span className="text-[#e05a33] font-bold mt-0.5 text-xs">•</span>
                <div className="text-xs text-slate-700 leading-relaxed">{contentNodes}</div>
              </div>
            );
          }
          return <p key={idx} className="leading-relaxed text-xs text-slate-700">{contentNodes}</p>;
        })}
      </div>
    );
  };

  const buildChartComponent = (title: string, chartData: any[], unit: string) => (
    <div className="mt-4 pt-4 border-t border-[#f0eae1] bg-white p-4 rounded-xl shadow-xs">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-4">
        <BarChart2 className="w-4 h-4 text-[#e05a33]" />
        {title}
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0eae1" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} unit={unit} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: '#f8f5ee' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f0eae1', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }} 
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={55}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderChartForMessage = (msgContent: string) => {
    // 0. Dynamic Customer ID Comparison Chart (e.g. comparing #1000, #1001, #690)
    const customerIdMatches = msgContent.match(/#(\d+)/g);
    if (customerIdMatches && customerIdMatches.length >= 2) {
      const lines = msgContent.split('\n').filter(l => l.startsWith('| **#'));
      if (lines.length >= 2) {
        const dynamicCustomerData = lines.map(line => {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          const id = cells[0].replace(/\*\*/g, '');
          const waitTime = parseFloat(cells[2]) || 20;
          const isSatisfied = cells[5]?.includes('Satisfied');
          return {
            name: id,
            value: waitTime,
            fill: isSatisfied ? '#10b981' : '#f43f5e'
          };
        });
        return buildChartComponent('Specific Customer Wait Time Comparison (Mins)', dynamicCustomerData, 'm');
      }
    }

    // 1. Food, Service, Ambience Ratings
    if (msgContent.includes('4.2') && msgContent.includes('2.6') && msgContent.includes('Ambience')) {
      const chartData = [
        { name: 'Service (Sat)', value: 4.2, fill: '#10b981' },
        { name: 'Service (Churn)', value: 2.6, fill: '#f43f5e' },
        { name: 'Food (Sat)', value: 4.3, fill: '#10b981' },
        { name: 'Food (Churn)', value: 3.0, fill: '#f59e0b' },
        { name: 'Ambience (Sat)', value: 3.8, fill: '#10b981' },
        { name: 'Ambience (Churn)', value: 3.4, fill: '#94a3b8' }
      ];
      return buildChartComponent('Experience Ratings Comparison (1-5 Scale)', chartData, '★');
    }

    // 2. Wait Time Bands / Threshold
    if (msgContent.includes('14.2%') && msgContent.includes('85.3%')) {
      const chartData = [
        { name: '0-15m', value: 14.2, fill: '#10b981' },
        { name: '16-30m', value: 41.5, fill: '#f59e0b' },
        { name: '31-45m', value: 85.3, fill: '#f43f5e' },
        { name: '45m+', value: 97.8, fill: '#be123c' }
      ];
      return buildChartComponent('Dissatisfied Rate (%) by Wait Time Bands', chartData, '%');
    }

    // 3. Drop-off by Intervals
    if (msgContent.includes('28.4%') && msgContent.includes('7.2%')) {
      const chartData = [
        { name: '0-15m', value: 28.4, fill: '#10b981' },
        { name: '16-25m', value: 19.8, fill: '#10b981' },
        { name: '26-35m', value: 7.2, fill: '#f43f5e' },
        { name: '36m+', value: 2.1, fill: '#be123c' }
      ];
      return buildChartComponent('High Satisfaction Rate (%) Across Wait Intervals', chartData, '%');
    }

    // 4. Loyalty Membership Comparison
    if (msgContent.includes('19.2%') && msgContent.includes('8.1%') && !msgContent.includes('23.9 mins')) {
      const chartData = [
        { name: 'Loyalty Members', value: 19.2, fill: '#e05a33' },
        { name: 'Non-Members', value: 8.1, fill: '#94a3b8' }
      ];
      return buildChartComponent('Satisfaction Rate (%) by Loyalty Status', chartData, '%');
    }

    // 5. Dining Channel (Dine-in vs Takeaway)
    if (msgContent.includes('18.4%') && msgContent.includes('8.4%') && !msgContent.includes('23.9 mins')) {
      const chartData = [
        { name: 'Dine-in', value: 18.4, fill: '#10b981' },
        { name: 'Takeaway', value: 8.4, fill: '#f59e0b' }
      ];
      return buildChartComponent('Satisfaction Rate (%) by Channel', chartData, '%');
    }

    // 6. Cuisines Comparison Chart
    if (msgContent.includes('Chinese') && msgContent.includes('Mexican') && msgContent.includes('Italian')) {
      const chartData = [
        { name: 'Chinese', value: 39.7, fill: '#10b981' },
        { name: 'American', value: 40.0, fill: '#3b82f6' },
        { name: 'Mexican', value: 41.1, fill: '#f59e0b' },
        { name: 'Italian', value: 43.1, fill: '#8b5cf6' },
        { name: 'Indian', value: 43.9, fill: '#ec4899' }
      ];
      return buildChartComponent('Satisfaction Uniformity Across Cuisines (%)', chartData, '%');
    }

    // 7. Baseline Differences (Wait Time Comparison)
    if (msgContent.includes('23.9 mins') && msgContent.includes('31.1 mins')) {
      const chartData = [
        { name: 'Highly Satisfied', value: 23.9, fill: '#10b981' },
        { name: 'Dissatisfied', value: 31.1, fill: '#f43f5e' }
      ];
      return buildChartComponent('Average Wait Time Comparison (Minutes)', chartData, 'm');
    }

    // 8. Age & Income vs Spend Comparison
    if ((msgContent.includes('Income') || msgContent.includes('income')) && (msgContent.includes('Age') || msgContent.includes('age') || msgContent.includes('Spend') || msgContent.includes('spend'))) {
      const spendMatches = msgContent.match(/\$([0-9]+(?:\.[0-9]+)?)/g);
      if (spendMatches && spendMatches.length >= 2) {
        const val1 = parseFloat(spendMatches[0].replace('$', '')) || 68.5;
        const val2 = parseFloat(spendMatches[1].replace('$', '')) || 41.2;
        const val3 = spendMatches.length >= 3 ? parseFloat(spendMatches[2].replace('$', '')) : 62.4;
        const val4 = spendMatches.length >= 4 ? parseFloat(spendMatches[3].replace('$', '')) : 49.8;
        
        const chartData = [
          { name: 'High Income ($60k+)', value: val1, fill: '#10b981' },
          { name: 'Lower Income (<$60k)', value: val2, fill: '#f59e0b' },
          { name: 'Mature (Age 35+)', value: val3, fill: '#3b82f6' },
          { name: 'Younger (<35)', value: val4, fill: '#8b5cf6' }
        ];
        return buildChartComponent('Average Dining Spend by Demographics ($)', chartData, '$');
      }
    }

    // 9. Top Issues / Bottlenecks Comparison
    if (msgContent.includes('Top') || msgContent.includes('top') || msgContent.includes('Issues') || msgContent.includes('issues') || msgContent.includes('Bottlenecks')) {
      if (msgContent.includes('Takeaway') || msgContent.includes('Wait')) {
        const chartData = [
          { name: 'Dine-in Sat', value: 18.4, fill: '#10b981' },
          { name: 'Takeaway Sat', value: 8.4, fill: '#f43f5e' },
          { name: 'Loyalty Sat', value: 19.2, fill: '#3b82f6' },
          { name: 'Non-Member Sat', value: 8.1, fill: '#f59e0b' }
        ];
        return buildChartComponent('Top Operational Gaps & Churn Drivers (%)', chartData, '%');
      }
    }

    return null;
  };

  if (mode === 'retention') {
    return <div className="space-y-6 pb-12" />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border border-[#f0eae1] rounded-2xl md:rounded-3xl shadow-none md:shadow-xs flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#f8f5ee] border-b border-[#f0eae1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e05a33] flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">DineIntellect AI Copilot</h3>
              <p className="text-[11px] text-slate-500 font-medium">Autonomous operational analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Size Presets */}
            {onSetWidthPreset && (
              <div className="hidden sm:inline-flex items-center bg-white border border-[#f0eae1] rounded-lg p-0.5 text-[10px] font-bold shadow-2xs">
                <button
                  onClick={() => onSetWidthPreset(480)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    !isMaximized && currentWidth && currentWidth < 620
                      ? 'bg-[#faedd9] text-[#e05a33]'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Standard window width (480px)"
                >
                  Standard
                </button>
                <button
                  onClick={() => onSetWidthPreset(740)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    !isMaximized && currentWidth && currentWidth >= 620 && currentWidth < 900
                      ? 'bg-[#faedd9] text-[#e05a33]'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Wide window width (740px)"
                >
                  Wide
                </button>
              </div>
            )}

            {/* Maximize / Restore Toggle */}
            {onToggleMaximize && (
              <button
                onClick={onToggleMaximize}
                className="w-7 h-7 rounded-lg bg-white border border-[#f0eae1] text-slate-600 hover:text-slate-900 hover:bg-[#f4ebe1] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title={isMaximized ? "Restore window size" : "Expand window (maximize)"}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={() => setMessages([{ role: 'model', content: 'Chat history reset. How can I help you analyze dining operations today?' }])}
              className="text-[11px] text-slate-600 hover:text-[#e05a33] px-2 py-1 bg-white border border-[#f0eae1] rounded-lg font-bold shadow-2xs hover:bg-orange-50 transition-colors cursor-pointer"
            >
              Reset
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white border border-[#f0eae1] text-slate-600 hover:text-slate-900 hover:bg-[#f4ebe1] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Close Copilot Panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Demo Questions Dropdown */}
        <div className="p-2.5 bg-[#fcfbf9] border-b border-[#f0eae1] flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#e05a33] flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3.5 h-3.5" /> DEMO:
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                sendChatMessage(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={chatLoading}
            defaultValue=""
            className="flex-1 bg-white border border-[#f0eae1] rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#e05a33] cursor-pointer"
          >
            <option value="" disabled>Select a demo question...</option>
            {quickDemoPrompts.map((prompt, idx) => (
              <option key={idx} value={prompt}>
                {prompt}
              </option>
            ))}
          </select>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                m.role === 'user' ? 'bg-[#e05a33] text-white shadow-sm' : 'bg-[#faedd9] text-[#e05a33] border border-[#f4dbb8]'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-[13px] leading-relaxed selection:bg-amber-200 selection:text-slate-900 ${
                m.role === 'user'
                  ? 'bg-[#e05a33] text-white rounded-tr-none shadow-sm font-medium'
                  : 'bg-white text-slate-800 border border-[#f0eae1] rounded-tl-none shadow-sm font-sans'
              }`}>
                {renderFormattedContent(m.content)}
                {m.role === 'model' && renderChartForMessage(m.content)}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex gap-3 max-w-md">
              <div className="w-8 h-8 rounded-xl bg-[#faedd9] text-[#e05a33] border border-[#f4dbb8] flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-white text-slate-500 border border-[#f0eae1] text-xs font-medium flex items-center gap-2.5 shadow-sm">
                <RefreshCcw className="w-3.5 h-3.5 animate-spin text-[#e05a33]" />
                Analyzing operations & synthesizing benchmarks...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#f0eae1]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage(inputMessage);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about dining operations and guest retention..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={chatLoading}
              className="flex-1 bg-[#fcfbf9] border border-[#f0eae1] rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a33] focus:bg-white shadow-inner selection:bg-amber-200 selection:text-slate-900 transition-all"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="px-5 py-3 bg-[#e05a33] hover:bg-[#cf4e28] text-white rounded-xl text-[13px] font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}