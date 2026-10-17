'use client';

import React from 'react';
import {
  Wallet,
  RefreshCw,
  LayoutDashboard,
  HandCoins,
  Briefcase,
  Sliders,
  Plus,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'tracker' | 'yearly' | 'settings';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSynced: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  unconfirmedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onRefresh,
  onOpenCreateModal,
  unconfirmedCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: '家計簿', fullLabel: '月別収支・カレンダー', icon: LayoutDashboard },
    { id: 'tracker' as NavTab, label: '振込・立替', fullLabel: '振込予定・立替管理', icon: HandCoins, badge: unconfirmedCount },
    { id: 'yearly' as NavTab, label: '年間・扶養', fullLabel: '年間集計・バイト代', icon: Briefcase },
    { id: 'settings' as NavTab, label: 'カード・設定', fullLabel: 'カード・バイト先設定', icon: Sliders },
  ];

  return (
    <>
      {/* トップヘッダー */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 sm:px-6 flex items-center justify-between gap-4">
          {/* ブランドロゴ */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-center justify-center shadow-sm">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Smart Kakeibo
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  同期中
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                クラウド連動パーソナル家計簿・資産管理
              </p>
            </div>
          </div>

          {/* PC用 センターセグメントナビゲーション */}
          <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.fullLabel}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full leading-tight">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* 右側アクション */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              title="最新データに同期"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenCreateModal}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>収支を記帳</span>
            </button>
          </div>
        </div>
      </header>

      {/* モバイル用 ボトムナビゲーションバー（マネーフォワード ME / Zaim スタイル） */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-safe shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
          {/* 左2タブ */}
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* 中央：記帳ボタン */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <button
              onClick={onOpenCreateModal}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/35 flex items-center justify-center transform active:scale-95 transition-all border-2 border-white"
              aria-label="収支を記帳"
            >
              <Plus className="w-6 h-6 stroke-[2.5px]" />
            </button>
            <span className="text-[10px] font-bold text-indigo-600 mt-0.5">記帳</span>
          </div>

          {/* 右2タブ */}
          {tabs.slice(2, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
