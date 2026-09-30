'use client';

import React, { useState } from 'react';
import { Building2, Plus, Trash2, Edit2, Clock, Calendar } from 'lucide-react';
import { Employer } from '@/types';

interface EmployerManagerProps {
  employers: Employer[];
  onAddEmployer: (emp: Omit<Employer, 'id'>) => Promise<void>;
  onUpdateEmployer: (id: string, emp: Omit<Employer, 'id'>) => Promise<void>;
  onDeleteEmployer: (id: string) => Promise<void>;
}

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
  const [color, setColor] = useState('#2563eb');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setHourlyWage('');
    setPaydayMemo('');
    setColor('#2563eb');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employer) => {
    setEditingId(emp.id);
    setName(emp.name);
    setHourlyWage(emp.hourly_wage ? emp.hourly_wage.toString() : '');
    setPaydayMemo(emp.payday_memo || '');
    setColor(emp.color || '#2563eb');
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
        name,
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
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>バイト先管理</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            複数のバイト先を登録し、収入の記録や年間集計で分けて管理できます。
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>バイト先を追加</span>
        </button>
      </div>

      {employers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">登録されたバイト先はありません</p>
          <p className="text-xs mt-1 text-slate-400">
            塾講師、カフェ、TAなど、お持ちのバイト先を登録してください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {employers.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: emp.color || '#2563eb' }}
                    />
                    <h3 className="font-bold text-slate-800 text-sm truncate">{emp.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      title="編集"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${emp.name}」を削除しますか？`)) {
                          onDeleteEmployer(emp.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {emp.hourly_wage && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>時給: ¥{emp.hourly_wage.toLocaleString()}</span>
                    </div>
                  )}
                  {emp.payday_memo && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>給与日: {emp.payday_memo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingId ? 'バイト先の編集' : 'バイト先の新規登録'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              バイト先の名称や時給、給与日を入力してください。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">バイト先名</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ○○塾、カフェ、大学TA など"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">基本時給（任意）</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(e.target.value)}
                    placeholder="1200"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">給料日メモ（任意）</label>
                <input
                  type="text"
                  value={paydayMemo}
                  onChange={(e) => setPaydayMemo(e.target.value)}
                  placeholder="例: 毎月25日振込、翌月10日振込 など"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
