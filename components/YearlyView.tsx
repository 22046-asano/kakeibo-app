'use client';

import React, { useState } from 'react';
import { 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  GraduationCap, 
  Building2, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Transaction, Employer } from '@/types';

interface YearlyViewProps {
  transactions: Transaction[];
  employers?: Employer[];
}

export const YearlyView: React.FC<YearlyViewProps> = ({ transactions, employers = [] }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 税制ラインのプリセット (2026年最新税制対応)
  const TAX_PRESETS = [
    { label: '178万円（2026年 所得税新非課税枠）', value: 1780000, desc: '令和8年度税制改正による所得税の新基準' },
    { label: '160万円（2025年 課税最低限引上げライン）', value: 1600000, desc: '令和7年度改正による課税最低限' },
    { label: '150万円（大学生・特定親族特別控除ライン）', value: 1500000, desc: '19〜22歳の大学生年代の手取り急減防止措置' },
    { label: '130万円（社会保険・健保の被扶養者上限）', value: [__redacted__], desc: '健康保険の扶養から外れないための上限' },
    { label: '103万円（従来の所得税ライン・旧基準）', value: 1030000, desc: '改正前の旧・年収の壁' },
  ];

  const [selectedLimit, setSelectedLimit] = useState<number>(1780000);
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  const [customLimitInput, setCustomLimitInput] = useState<string>('1780000');

  // 対象年のトランザクションを抽出
  const yearTransactions = transactions.filter((t) => t.date.startsWith(`${selectedYear}-`));

  // バイト代の集計 (カテゴリが「バイト代」の収入)
  const partTimeTransactions = yearTransactions.filter(
    (t) => t.type === 'income' && t.category === 'バイト代'
  );

  // 全バイト先の合算年間バイト代
  const totalPartTimeIncome = partTimeTransactions.reduce((sum, t) => sum + t.amount, 0);

  // バイト先別の集計
  const employerBreakdown = partTimeTransactions.reduce<Record<string, number>>((acc, t) => {
    const name = t.employer_name || 'バイト先未指定';
    acc[name] = (acc[name] || 0) + t.amount;
    return acc;
  }, {});

  // 月別バイト代の集計 (1月〜12月)
  const monthlyPartTime = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
    const amount = partTimeTransactions
      .filter((t) => t.date.startsWith(monthStr))
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: monthNum, amount };
  });

  // 年間総収入・総支出・収支差額
  const totalYearIncome = yearTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalYearExpense = yearTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalYearBalance = totalYearIncome - totalYearExpense;

  // 「大学」関連の年間支出
  const totalUniversityExpense = yearTransactions
    .filter((t) => t.type === 'expense' && t.category === '大学')
    .reduce((sum, t) => sum + t.amount, 0);

  // 選択された扶養ラインの計算
  const activeLimit = isCustomLimit ? (parseInt(customLimitInput, 10) || 1780000) : selectedLimit;
  const percent = Math.min((totalPartTimeIncome / activeLimit) * 100, 100);
  const remaining = Math.max(activeLimit - totalPartTimeIncome, 0);
  const isOver = totalPartTimeIncome > activeLimit;

  return (
    <div className="space-y-6">
      {/* 年選択ヘッダー */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
        <button
          onClick={() => setSelectedYear((y) => y - 1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xl font-bold text-slate-900">{selectedYear}年 年間集計</span>
          <p className="text-xs text-slate-500">バイト代合算年収 ＆ 扶養ラインシミュレーション</p>
        </div>

        <button
          onClick={() => setSelectedYear((y) => y + 1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* バイト代・年収ハイライトカード */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/15">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-200" />
            <span className="text-sm font-semibold text-blue-100">
              年間バイト代 総合計（複数バイト合算）
            </span>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
            給与受取 {partTimeTransactions.length} 回
          </span>
        </div>

        <div className="my-3">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ¥{totalPartTimeIncome.toLocaleString()}
          </p>
        </div>

        {/* 扶養ライン・税制基準選択 */}
        <div className="mt-5 pt-4 border-t border-white/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-100">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>扶養・非課税基準ラインの選択</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={isCustomLimit ? 'custom' : selectedLimit}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomLimit(true);
                  } else {
                    setIsCustomLimit(false);
                    setSelectedLimit(parseInt(e.target.value, 10));
                  }
                }}
                className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/30 focus:outline-none focus:bg-white focus:text-slate-900"
              >
                {TAX_PRESETS.map((p) => (
                  <option key={p.value} value={p.value} className="text-slate-900">
                    {p.label}
                  </option>
                ))}
                <option value="custom" className="text-slate-900">
                  カスタム入力
                </option>
              </select>

              {isCustomLimit && (
                <input
                  type="number"
                  value={customLimitInput}
                  onChange={(e) => setCustomLimitInput(e.target.value)}
                  placeholder="目標金額"
                  className="w-24 px-2 py-1 bg-white text-slate-900 text-xs font-bold rounded-lg"
                />
              )}
            </div>
          </div>

          {/* プログレスバー */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>上限基準: ¥{activeLimit.toLocaleString()}</span>
              <span>{percent.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-black/25 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOver ? 'bg-rose-400' : 'bg-emerald-300'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-100">
              {isOver ? (
                <span className="text-rose-200 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 基準上限を ¥{(totalPartTimeIncome - activeLimit).toLocaleString()} 超過しています
                </span>
              ) : (
                <span>基準まで あと <strong>¥{remaining.toLocaleString()}</strong></span>
              )}
            </div>
          </div>

          <div className="bg-black/15 rounded-xl p-2.5 text-[11px] text-blue-100 flex items-start gap-1.5 mt-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>
              税制改正（2025〜2026年）により、所得税の課税最低限は従来の103万円から160万円・178万円へと大幅に引き上げられました。学生の場合は健康保険の被扶養者基準（130万円）など、目的に応じて基準を切り替えて確認できます。
            </p>
          </div>
        </div>
      </div>

      {/* バイト先別 内訳サマリー */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>バイト先別の年間収入内訳</span>
        </h3>

        {Object.keys(employerBreakdown).length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            {selectedYear}年のバイト代データはまだありません
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(employerBreakdown).map(([name, amt]) => {
              const share = totalPartTimeIncome > 0 ? (amt / totalPartTimeIncome) * 100 : 0;
              return (
                <div key={name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 truncate">{name}</span>
                    <span className="text-slate-400 text-[11px]">{share.toFixed(1)}%</span>
                  </div>
                  <p className="text-base font-extrabold text-indigo-700 mt-1">
                    ¥{amt.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 年間全体サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-1">年間総収入（バイト代含む）</p>
          <p className="text-xl font-bold text-emerald-600">¥{totalYearIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-1">年間総支出</p>
          <p className="text-xl font-bold text-slate-900">¥{totalYearExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-1">年間収支差額（貯金純増額）</p>
          <p className={`text-xl font-bold ${totalYearBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {totalYearBalance >= 0 ? '+' : ''}¥{totalYearBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 「大学」カテゴリ支出サマリー */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">大学関連の年間支出</h3>
            <p className="text-xs text-slate-400">教科書・研究費・サークル・学費など</p>
          </div>
        </div>
        <p className="text-lg font-bold text-slate-900">¥{totalUniversityExpense.toLocaleString()}</p>
      </div>

      {/* 月別バイト代推移表 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>{selectedYear}年 各月のバイト代推移（合算）</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {monthlyPartTime.map(({ month, amount }) => (
            <div
              key={month}
              className={`p-3 rounded-xl border transition-all ${
                amount > 0
                  ? 'bg-blue-50/40 border-blue-200/80'
                  : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <span className="text-xs font-semibold text-slate-600">{month}月</span>
              <p
                className={`text-sm sm:text-base font-bold mt-0.5 ${
                  amount > 0 ? 'text-blue-700' : 'text-slate-400'
                }`}
              >
                ¥{amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
