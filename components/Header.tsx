'use client';

import React from 'react';
import {
  RefreshCw,
  Calendar as CalendarIcon,
  PieChart,
  HandCoins,
  Sliders,
  PlusCircle,
  LogOut,
  ShieldCheck,
  Landmark,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'yearly' | 'tracker' | 'settings';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSynced: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenBankBalanceModal?: () => void;
  unconfirmedCount?: number;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onRefresh,
  onOpenCreateModal,
  onOpenBankBalanceModal,
  unconfirmedCount = 0,
  userEmail,
  onSignOut,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'カレンダー', fullLabel: 'カレンダー・明細', icon: CalendarIcon },
    { id: 'yearly' as NavTab, label: 'レポート', fullLabel: 'レポート・年間扶養', icon: PieChart },
    { id: 'tracker' as NavTab, label: '立替・振込', fullLabel: '立替・振込予定', icon: HandCoins, badge: unconfirmedCount },
    { id: 'settings' as NavTab, label: 'カード・設定', fullLabel: 'カード・バイト先設定', icon: Sliders },
  ];

  return (
    <>
      {/* トップヘッダー（シンプル家計簿風 オレンジ＆ホワイト基調） */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-200/70 shadow-[0_1px_4px_rgba(249,115,22,0.05)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* ブランドロゴ（オレンジの貯金箱アイコン） */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/25 font-black text-lg">
              ¥
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                  シンプル家計簿
                </h1>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200/70">
                  <ShieldCheck className="w-3 h-3 text-orange-500" />
                  同期中
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate max-w-[180px]">
                {userEmail || 'PC・スマホ完全連動'}
              </p>
            </div>
          </div>

          {/* PC用 センターナビゲーション */}
          <nav className="hidden md:flex items-center bg-orange-50/70 p-1 rounded-2xl border border-orange-200/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-orange-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                  <span>{tab.fullLabel}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full leading-tight ${
                        isActive ? 'bg-white text-orange-600' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* 右側アクションボタン */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenBankBalanceModal && (
              <button
                onClick={onOpenBankBalanceModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-extrabold transition-colors"
                title="銀行預金残高を入力してつじつまを合わせる"
              >
                <Landmark className="w-3.5 h-3.5 text-orange-500" />
                <span>預金補正</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              title="最新データに更新"
              className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onSignOut && (
              <button
                onClick={onSignOut}
                title="ログアウト"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="hidden sm:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm shadow-orange-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>入力する</span>
            </button>
          </div>
        </div>
      </header>

      {/* モバイル用 下部タブバー（シンプル家計簿スタイル） */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 pb-safe shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
          {/* 1. 入力ボタン（シンプル家計簿の左端または中央の定番「入力」タブ） */}
          <button
            onClick={onOpenCreateModal}
            className="flex flex-col items-center justify-center py-1 gap-1 text-orange-500 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
              <PlusCircle className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <span className="text-[10px] font-extrabold text-orange-600">入力</span>
          </button>

          {/* 2〜5. カレンダー / レポート / 立替・振込 / 設定 */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
                  isActive ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'
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
        </div>
      </nav>
    </>
  );
};
