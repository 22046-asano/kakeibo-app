'use client';

import React, { useState } from 'react';
import { Building2, Plus, Trash2, Edit2, Clock, Calendar, X } from 'lucide-react';
import { Employer } from '@/types';

interface EmployerManagerProps {
  employers: Employer[];
  onAddEmployer: (emp: Omit<Employer, 'id'>) => Promise<void>;
  onUpdateEmployer: (id: string, emp: Omit<Employer, 'id'>) => Promise<void>;
  onDeleteEmployer: (id: string) => Promise<void>;
}

const COLOR_SWATCHES = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#d97706',
  '#e11d48',
  '#7c3aed',
  '#2563eb',
  '#0f172a',
];

export const EmployerManager: React.FC<EmployerManagerProps> = ({
  employers,
  onAddEmployer,
  onUpdateEmployer,
  onDeleteEmployer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [paydayMemo, setPaydayMemo] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setHourlyWage('');
    setPaydayMemo('');
    setColor('#4f46e5');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employer) => {
    setEditingId(emp.id);
    setName(emp.name);
    setHourlyWage(emp.hourly_wage ? emp.hourly_wage.toString() : '');
    setPaydayMemo(emp.payday_memo || '');
    setColor(emp.color || '#4f46e5');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('バイト先名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const wageNum = hourlyWage ? parseInt(hourlyWage, 10) : undefined;
      const data = {
        name: name.trim(),
        hourly_wage: isNaN(wageNum as number) ? null : wageNum,
        payday_memo: paydayMemo,
        color,
      };

      if (editingId) {
        await onUpdateEmployer(editingId, data);
      } else {
        await onAddEmployer(data);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('バイト先の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>バイト先マスタ管理・編集</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            登録したバイト先の名称や時給・給料日メモも後から自由に変更できます
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>バイト先を追加</span>
        </button>
      </div>

      {employers.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-600">登録されたバイト先はありません</p>
          <p className="text-xs mt-1 text-slate-400">
            塾講師、カフェ、大学TAなど、複数のバイト先を登録して管理できます
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {employers.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleOpenEdit(emp)}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: emp.color || '#4f46e5' }}
                    />
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                      {emp.name}
                    </h3>
                  </div>
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl flex items-center gap-1"
                      title="編集"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>編集</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${emp.name}」を削除しますか？`)) {
                          onDeleteEmployer(emp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100 tabular-nums">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      基本時給:{' '}
                      <strong>
                        {emp.hourly_wage ? `¥${emp.hourly_wage.toLocaleString()}` : '未設定'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>給与日: {emp.payday_memo || '未設定'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingId ? 'バイト先の編集・変更' : 'バイト先の新規登録'}
                </h3>
                <p className="text-xs text-slate-400">
                  名称を変更すると過去の明細のバイト先名表記も自動更新されます
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">バイト先名</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ○○塾、カフェ、大学TA など"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  基本時給（任意）
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ¥
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(e.target.value)}
                    placeholder="1200"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tabular-nums focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  給料日メモ（任意）
                </label>
                <input
                  type="text"
                  value={paydayMemo}
                  onChange={(e) => setPaydayMemo(e.target.value)}
                  placeholder="例: 毎月25日振込、翌月10日振込 など"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  識別カラー
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => setColor(sw)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === sw ? 'scale-110 ring-2 ring-offset-2 ring-slate-900' : ''
                      }`}
                      style={{ backgroundColor: sw }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : editingId ? '変更を保存' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
