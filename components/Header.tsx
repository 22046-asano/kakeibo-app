'use client';

import React from 'react';
import { Wallet, RefreshCw, Smartphone, Laptop, LayoutDashboard, Calendar, Briefcase, CreditCard } from 'lucide-react';

export type NavTab = 'dashboard' | 'calendar' | 'yearly' | 'cards';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSynced: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isSynced,
  onRefresh,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: '月別収支', icon: LayoutDashboard },
    { id: 'calendar' as NavTab, label: 'カレンダー', icon: Calendar },
    { id: 'yearly' as NavTab, label: '年間・バイト代', icon: Briefcase },
    { id: 'cards' as NavTab, label: 'カード管理', icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              スマート家計簿
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Laptop className="w-3 h-3" />
              <span>PC</span>
              <span>×</span>
              <Smartphone className="w-3 h-3" />
              <span>スマホ クラウド同期</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>リアルタイム連動</span>
          </div>

          <button
            onClick={onRefresh}
            title="データを再読み込み"
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
