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
  Edit2,
  Trash2,
  ReceiptText,
  PieChart,
} from 'lucide-react';
import { Transaction, Employer } from '@/types';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MonthSelector } from './MonthSelector';

interface YearlyViewProps {
  transactions: Transaction[];
  monthlyTransactions: Transaction[];
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  onResetToday: () => void;
  employers?: Employer[];
  onEditTransaction?: (t: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  transactions,
  monthlyTransactions,
  currentDate,
  onChangeMonth,
  onResetToday,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [reportMode, setReportMode] = useState<'monthly_pie' | 'annual_tax'>('monthly_pie');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [detailFilter, setDetailFilter] = useState<'parttime' | 'university' | 'all'>('parttime');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | null>(null);

  const TAX_PRESETS = [
    { label: '178万円（2026年 所得税新非課税枠）', shortLabel: '178万の壁', value: 178 * 10000 },
    { label: '160万円（2025年 課税最低限引上げライン）', shortLabel: '160万の壁', value: 160 * 10000 },
    { label: '150万円（大学生・特定親族特別控除ライン）', shortLabel: '150万の壁', value: 150 * 10000 },
    { label: '130万円（社会保険・被扶養者の上限）', shortLabel: '130万の壁', value: 130 * 10000 },
    { label: '123万円（税制改正後 扶養控除・基礎＋給与所得控除ライン）', shortLabel: '123万の壁', value: 123 * 10000 },
    { label: '103万円（従来の所得税ライン・旧基準）', shortLabel: '103万の壁', value: 103 * 10000 },
  ];

  const [selectedLimit, setSelectedLimit] = useState<number>(123 * 10000);
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  const [customLimitInput, setCustomLimitInput] = useState<string>('1230000');

  useEffect(() => {
    const saved = localStorage.getItem('kakeibo_tax_limit');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isCustom) {
          setIsCustomLimit(true);
          setCustomLimitInput(String(parsed.value || 1230000));
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

  // 対象年のトランザクション（調整金は年間収入・支出・バイト代計算から完全に除外）
  const yearTransactions = transactions.filter(
    (t) => t.date.startsWith(`${selectedYear}-`) && t.category !== '調整金'
  );

  // バイト代収入（調整金は含まれない）
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

  // 年間総収入・総支出・収支差額（調整金を除外した純粋な年間収支）
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
    ? parseInt(customLimitInput, 10) || 123 * 10000
    : selectedLimit;
  const percent = Math.min((totalPartTimeIncome / activeLimit) * 100, 100);
  const remaining = Math.max(activeLimit - totalPartTimeIncome, 0);
  const isOver = totalPartTimeIncome > activeLimit;

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
    <div className="space-y-5">
      {/* シンプル家計簿風 レポート切替バー（月間円グラフ ⇔ 年間・バイト代扶養） */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200/80 grid grid-cols-2 gap-1">
        <button
          onClick={() => setReportMode('monthly_pie')}
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            reportMode === 'monthly_pie'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-orange-50'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>月間カテゴリー別グラフ</span>
        </button>
        <button
          onClick={() => setReportMode('annual_tax')}
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            reportMode === 'annual_tax'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-orange-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>年間バイト代・扶養レポート</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. 月間カテゴリー別レポート（シンプル家計簿のレポート画面） */}
      {/* ========================================================= */}
      {reportMode === 'monthly_pie' && (
        <div className="space-y-4">
          <MonthSelector
            currentDate={currentDate}
            onChangeMonth={onChangeMonth}
            onResetToday={onResetToday}
          />
          <CategoryBreakdown
            transactions={monthlyTransactions}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. 年間バイト代・扶養レポート */}
      {/* ========================================================= */}
      {reportMode === 'annual_tax' && (
        <div className="space-y-5">
          {/* 年選択バー */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedYear((y) => y - 1);
                setSelectedMonthFilter(null);
              }}
              className="p-2 rounded-xl text-slate-600 hover:bg-orange-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-base sm:text-lg font-extrabold text-slate-800 tabular-nums">
                {selectedYear}年 バイト代年収・扶養計算
              </span>
              <p className="text-[11px] text-slate-400">
                ※預金残高の「調整金」はバイト代・年収計算から自動的に除外されています
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedYear((y) => y + 1);
                setSelectedMonthFilter(null);
              }}
              className="p-2 rounded-xl text-slate-600 hover:bg-orange-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* バイト代・扶養ラインシミュレーションカード */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/15">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-100" />
                <span className="text-xs sm:text-sm font-bold text-orange-50">
                  {selectedYear}年 バイト代累計（複数バイト先合算）
                </span>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold text-white tabular-nums">
                給与受取 {partTimeTransactions.length} 回
              </span>
            </div>

            <div className="my-3 flex flex-wrap items-baseline gap-4">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
                ¥{totalPartTimeIncome.toLocaleString()}
              </p>
              <span className="text-xs text-orange-50 tabular-nums">
                {isOver ? (
                  <span className="bg-rose-600 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    上限を ¥{(totalPartTimeIncome - activeLimit).toLocaleString()} 超過
                  </span>
                ) : (
                  <span>
                    選択中の上限基準まで あと{' '}
                    <strong className="text-white text-sm font-extrabold underline">
                      ¥{remaining.toLocaleString()}
                    </strong>
                  </span>
                )}
              </span>
            </div>

            {/* 扶養ライン・税制基準選択 */}
            <div className="mt-5 pt-4 border-t border-white/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-50">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>扶養・非課税基準ラインの選択（123万・130万・150万・178万等）</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={isCustomLimit ? 'custom' : selectedLimit}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomLimit(true);
                        handleSaveLimitSetting(true, parseInt(customLimitInput, 10) || 1230000);
                      } else {
                        const val = parseInt(e.target.value, 10);
                        setIsCustomLimit(false);
                        setSelectedLimit(val);
                        handleSaveLimitSetting(false, val);
                      }
                    }}
                    className="bg-white text-slate-900 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
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

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold tabular-nums text-orange-50">
                  <span>設定上限: ¥{activeLimit.toLocaleString()}</span>
                  <span>{percent.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOver ? 'bg-rose-500' : 'bg-white'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* 各年収の壁（103万 / 123万 / 130万 / 150万 / 160万 / 178万）までの残額一覧 */}
              <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {TAX_PRESETS.slice()
                  .reverse()
                  .map((preset) => {
                    const diff = preset.value - totalPartTimeIncome;
                    const isSelectedPreset = !isCustomLimit && selectedLimit === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setIsCustomLimit(false);
                          setSelectedLimit(preset.value);
                          handleSaveLimitSetting(false, preset.value);
                        }}
                        className={`p-2 rounded-xl text-left transition-all border ${
                          isSelectedPreset
                            ? 'bg-white text-orange-950 border-white shadow-sm'
                            : 'bg-black/15 text-white border-white/15 hover:bg-black/25'
                        }`}
                      >
                        <p className="text-[10px] font-extrabold opacity-80">{preset.shortLabel}</p>
                        <p
                          className={`text-xs font-extrabold tabular-nums mt-0.5 truncate ${
                            diff < 0
                              ? isSelectedPreset
                                ? 'text-rose-600'
                                : 'text-rose-200'
                              : ''
                          }`}
                        >
                          {diff >= 0 ? `残 ¥${diff.toLocaleString()}` : `超過 ¥${Math.abs(diff).toLocaleString()}`}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* 年間サマリー4カード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <p className="text-xs font-bold text-slate-400 mb-1">年間収入計（調整金除く）</p>
              <p className="text-base sm:text-xl font-extrabold text-sky-600 tabular-nums">
                ¥{totalYearIncome.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <p className="text-xs font-bold text-slate-400 mb-1">年間支出計（調整金除く）</p>
              <p className="text-base sm:text-xl font-extrabold text-rose-500 tabular-nums">
                ¥{totalYearExpense.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <p className="text-xs font-bold text-slate-400 mb-1">年間収支差額</p>
              <p
                className={`text-base sm:text-xl font-extrabold tabular-nums ${
                  totalYearBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
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

          {/* バイト先別内訳 ＆ 月別バイト代推移 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
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
                      <div key={name} className="p-3.5 bg-orange-50/40 rounded-xl border border-orange-100">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-extrabold text-slate-800 truncate">{name}</span>
                          <span className="text-slate-400 text-[11px] font-bold tabular-nums">
                            {share.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-base font-extrabold text-orange-600 tabular-nums">
                          ¥{amt.toLocaleString()}
                        </p>
                        <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span>月別バイト代推移（タップで月別明細確認）</span>
                </h3>
                {selectedMonthFilter !== null && (
                  <button
                    onClick={() => setSelectedMonthFilter(null)}
                    className="text-xs font-bold text-orange-600 hover:underline"
                  >
                    全月表示に戻す
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {monthlyPartTime.map(({ month, amount }) => {
                  const isSelected = selectedMonthFilter === month;
                  const barWidth = amount > 0 ? Math.max((amount / maxMonthlyAmount) * 100, 8) : 0;
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => setSelectedMonthFilter(isSelected ? null : month)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : amount > 0
                          ? 'bg-orange-50/40 border-orange-200/70 hover:bg-orange-50 text-slate-900'
                          : 'bg-slate-50/60 border-slate-100 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold">{month}月</span>
                      <p
                        className={`text-xs sm:text-sm font-extrabold mt-1 tabular-nums truncate ${
                          isSelected ? 'text-white' : amount > 0 ? 'text-orange-600' : 'text-slate-400'
                        }`}
                      >
                        ¥{amount.toLocaleString()}
                      </p>
                      <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${
                            isSelected ? 'bg-white' : 'bg-orange-500'
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  {selectedYear}年{selectedMonthFilter ? `${selectedMonthFilter}月` : ''}の明細（編集・削除）
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 tabular-nums">
                  {displayedYearTransactions.length}件
                </span>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDetailFilter('parttime')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    detailFilter === 'parttime'
                      ? 'bg-white text-orange-600 shadow-sm'
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
                    className="py-3 flex items-center justify-between gap-3 hover:bg-orange-50/30 px-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800">{t.category}</span>
                        {t.employer_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200/60">
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
                          t.type === 'expense' ? 'text-rose-500' : 'text-sky-600'
                        }`}
                      >
                        {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                      </span>

                      {onEditTransaction && (
                        <button
                          onClick={() => onEditTransaction(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50"
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
      )}
    </div>
  );
};
