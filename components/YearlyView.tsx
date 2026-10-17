'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Building2,
  SlidersHorizontal,
  Info,
  Edit2,
  Trash2,
  ReceiptText,
} from 'lucide-react';
import { Transaction, Employer } from '@/types';

interface YearlyViewProps {
  transactions: Transaction[];
  employers?: Employer[];
  onEditTransaction?: (t: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [detailFilter, setDetailFilter] = useState<'parttime' | 'university' | 'all'>('parttime');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | null>(null);

  const TAX_PRESETS = [
    { label: '178万円（2026年 所得税新非課税枠）', value: 178 * 10000 },
    { label: '160万円（2025年 課税最低限引上げライン）', value: 160 * 10000 },
    { label: '150万円（大学生・特定親族特別控除ライン）', value: 150 * 10000 },
    { label: '130万円（社会保険・被扶養者の上限）', value: 130 * 10000 },
    { label: '103万円（従来の所得税ライン・旧基準）', value: 103 * 10000 },
  ];

  const [selectedLimit, setSelectedLimit] = useState<number>(178 * 10000);
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  const [customLimitInput, setCustomLimitInput] = useState<string>('1780000');

  // 設定した上限額をローカルストレージに保存・復元
  useEffect(() => {
    const saved = localStorage.getItem('kakeibo_tax_limit');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isCustom) {
          setIsCustomLimit(true);
          setCustomLimitInput(String(parsed.value || 1780000));
        } else if (parsed.value) {
          setIsCustomLimit(false);
          setSelectedLimit(parsed.value);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveLimitSetting = (isCustom: boolean, val: number) => {
    localStorage.setItem('kakeibo_tax_limit', JSON.stringify({ isCustom, value: val }));
  };

  // 対象年のトランザクション
  const yearTransactions = transactions.filter((t) => t.date.startsWith(`${selectedYear}-`));

  // バイト代収入
  const partTimeTransactions = yearTransactions.filter(
    (t) => t.type === 'income' && t.category === 'バイト代'
  );
  const totalPartTimeIncome = partTimeTransactions.reduce((sum, t) => sum + t.amount, 0);

  // バイト先別の集計
  const employerBreakdown = partTimeTransactions.reduce<Record<string, number>>((acc, t) => {
    const name = t.employer_name || 'バイト先未指定';
    acc[name] = (acc[name] || 0) + t.amount;
    return acc;
  }, {});

  // 月別バイト代推移 (1月〜12月)
  const monthlyPartTime = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
    const amount = partTimeTransactions
      .filter((t) => t.date.startsWith(monthStr))
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: monthNum, amount };
  });

  const maxMonthlyAmount = Math.max(...monthlyPartTime.map((m) => m.amount), 1);

  // 年間総収入・総支出・収支差額
  const totalYearIncome = yearTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalYearExpense = yearTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalYearBalance = totalYearIncome - totalYearExpense;

  // 大学関連の年間支出
  const universityTransactions = yearTransactions.filter(
    (t) => t.type === 'expense' && t.category === '大学'
  );
  const totalUniversityExpense = universityTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 扶養ライン計算
  const activeLimit = isCustomLimit
    ? parseInt(customLimitInput, 10) || 178 * 10000
    : selectedLimit;
  const percent = Math.min((totalPartTimeIncome / activeLimit) * 100, 100);
  const remaining = Math.max(activeLimit - totalPartTimeIncome, 0);
  const isOver = totalPartTimeIncome > activeLimit;

  // 明細リスト表示用フィルタ
  const displayedYearTransactions = yearTransactions.filter((t) => {
    if (selectedMonthFilter !== null) {
      const mPrefix = `${selectedYear}-${String(selectedMonthFilter).padStart(2, '0')}`;
      if (!t.date.startsWith(mPrefix)) return false;
    }
    if (detailFilter === 'parttime') return t.type === 'income' && t.category === 'バイト代';
    if (detailFilter === 'university') return t.type === 'expense' && t.category === '大学';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 年選択バー */}
      <div className="bg-white rounded-3xl p-3 sm:px-5 sm:py-3.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] border border-slate-200/80 flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedYear((y) => y - 1);
            setSelectedMonthFilter(null);
          }}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
            {selectedYear}年 年間レポート・扶養管理
          </span>
        </div>

        <button
          onClick={() => {
            setSelectedYear((y) => y + 1);
            setSelectedMonthFilter(null);
          }}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* バイト代・扶養ラインシミュレーション ヒーローカード */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              {selectedYear}年 バイト代累計（複数バイト先合算）
            </span>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-bold text-emerald-300 tabular-nums">
            振込回数 {partTimeTransactions.length} 回
          </span>
        </div>

        <div className="my-3 flex flex-wrap items-baseline gap-4">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
            ¥{totalPartTimeIncome.toLocaleString()}
          </p>
          <span className="text-xs text-slate-300 tabular-nums">
            {isOver ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                上限を ¥{(totalPartTimeIncome - activeLimit).toLocaleString()} 超過
              </span>
            ) : (
              <span>
                上限基準まで あと{' '}
                <strong className="text-emerald-400 text-sm font-extrabold">
                  ¥{remaining.toLocaleString()}
                </strong>
              </span>
            )}
          </span>
        </div>

        {/* 扶養ライン・税制基準選択 */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>目標・扶養基準ラインの変更（自動保存）</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={isCustomLimit ? 'custom' : selectedLimit}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomLimit(true);
                    handleSaveLimitSetting(true, parseInt(customLimitInput, 10) || 1780000);
                  } else {
                    const val = parseInt(e.target.value, 10);
                    setIsCustomLimit(false);
                    setSelectedLimit(val);
                    handleSaveLimitSetting(false, val);
                  }
                }}
                className="bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:bg-white focus:text-slate-900"
              >
                {TAX_PRESETS.map((p) => (
                  <option key={p.value} value={p.value} className="text-slate-900">
                    {p.label}
                  </option>
                ))}
                <option value="custom" className="text-slate-900">
                  自由入力（カスタム金額）
                </option>
              </select>

              {isCustomLimit && (
                <input
                  type="number"
                  value={customLimitInput}
                  onChange={(e) => {
                    setCustomLimitInput(e.target.value);
                    handleSaveLimitSetting(true, parseInt(e.target.value, 10) || 0);
                  }}
                  placeholder="上限額(円)"
                  className="w-28 px-2.5 py-1.5 bg-white text-slate-900 text-xs font-extrabold rounded-xl tabular-nums"
                />
              )}
            </div>
          </div>

          {/* プログレスバー */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold tabular-nums text-slate-300">
              <span>設定上限: ¥{activeLimit.toLocaleString()}</span>
              <span>{percent.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 年間サマリー3カード + 大学支出 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold text-slate-400 mb-1">年間総収入</p>
          <p className="text-base sm:text-xl font-extrabold text-emerald-600 tabular-nums">
            ¥{totalYearIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold text-slate-400 mb-1">年間総支出</p>
          <p className="text-base sm:text-xl font-extrabold text-slate-900 tabular-nums">
            ¥{totalYearExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold text-slate-400 mb-1">年間収支差額</p>
          <p
            className={`text-base sm:text-xl font-extrabold tabular-nums ${
              totalYearBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'
            }`}
          >
            {totalYearBalance >= 0 ? '+' : ''}¥{totalYearBalance.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>大学関連支出計</span>
          </p>
          <p className="text-base sm:text-xl font-extrabold text-slate-900 tabular-nums">
            ¥{totalUniversityExpense.toLocaleString()}
          </p>
        </div>
      </div>

      {/* バイト先別内訳 ＆ 月別バイト代棒グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* バイト先別内訳 */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>バイト先別の年間収入内訳</span>
          </h3>

          {Object.keys(employerBreakdown).length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              {selectedYear}年のバイト代データはまだありません
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(employerBreakdown).map(([name, amt]) => {
                const share = totalPartTimeIncome > 0 ? (amt / totalPartTimeIncome) * 100 : 0;
                return (
                  <div key={name} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-extrabold text-slate-800 truncate">{name}</span>
                      <span className="text-slate-400 text-[11px] font-bold tabular-nums">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-indigo-600 tabular-nums">
                      ¥{amt.toLocaleString()}
                    </p>
                    <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 月別バイト代推移グラフ（タップで月別絞り込み） */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>月別バイト代推移（月をタップで明細確認）</span>
            </h3>
            {selectedMonthFilter !== null && (
              <button
                onClick={() => setSelectedMonthFilter(null)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                全月表示に戻す
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {monthlyPartTime.map(({ month, amount }) => {
              const isSelected = selectedMonthFilter === month;
              const barWidth = amount > 0 ? Math.max((amount / maxMonthlyAmount) * 100, 8) : 0;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonthFilter(isSelected ? null : month)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : amount > 0
                      ? 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50 text-slate-900'
                      : 'bg-slate-50/60 border-slate-100 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>{month}月</span>
                  </div>
                  <p
                    className={`text-xs sm:text-sm font-extrabold mt-1 tabular-nums truncate ${
                      isSelected ? 'text-white' : amount > 0 ? 'text-indigo-700' : 'text-slate-400'
                    }`}
                  >
                    ¥{amount.toLocaleString()}
                  </p>
                  <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        isSelected ? 'bg-white' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 年間明細履歴（直接編集・削除対応） */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {selectedYear}年{selectedMonthFilter ? `${selectedMonthFilter}月` : ''}の登録明細（編集・削除）
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
              {displayedYearTransactions.length}件
            </span>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDetailFilter('parttime')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                detailFilter === 'parttime'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              バイト代のみ
            </button>
            <button
              onClick={() => setDetailFilter('university')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                detailFilter === 'university'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              大学支出のみ
            </button>
            <button
              onClick={() => setDetailFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                detailFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              全明細
            </button>
          </div>
        </div>

        {displayedYearTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            該当する明細データはありません
          </p>
        ) : (
          <div className="divide-y divide-slate-100 pt-2 max-h-96 overflow-y-auto">
            {displayedYearTransactions.map((t) => (
              <div
                key={t.id}
                onClick={() => onEditTransaction && onEditTransaction(t)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2.5 rounded-xl cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{t.category}</span>
                    {t.employer_name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                        {t.employer_name}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 tabular-nums">{t.date}</span>
                  </div>
                  {t.memo && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{t.memo}</p>
                  )}
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`text-sm font-extrabold tabular-nums ${
                      t.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                    }`}
                  >
                    {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                  </span>

                  {onEditTransaction && (
                    <button
                      onClick={() => onEditTransaction(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title="編集"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteTransaction && (
                    <button
                      onClick={() => {
                        if (confirm('この明細を削除してもよろしいですか？')) {
                          onDeleteTransaction(t.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
