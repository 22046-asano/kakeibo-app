'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Transaction, TransactionInsert, CreditCard } from '@/types';
import { Header, NavTab } from '@/components/Header';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCards } from '@/components/SummaryCards';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { CalendarView } from '@/components/CalendarView';
import { YearlyView } from '@/components/YearlyView';
import { CreditCardManager } from '@/components/CreditCardManager';
import { CARD_TEMPLATES } from '@/lib/creditCardUtils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 月の日付範囲（月初〜月末）を取得
  const getMonthDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  // クレジットカード情報の読み込み
  const fetchCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Cards fetch error (using fallback):', error.message);
        const local = localStorage.getItem('kakeibo_cards');
        if (local) {
          setCards(JSON.parse(local));
        } else {
          // 初期サンプルカード（楽天カードと三井住友）
          const initialCards: CreditCard[] = [
            {
              id: 'card-rakuten',
              name: '楽天カード',
              closing_day: 0,
              payment_month_offset: 1,
              payment_day: 27,
              holiday_rule: 'next_business_day',
              color: '#dc2626',
            },
            {
              id: 'card-smbc',
              name: '三井住友カード(10日払)',
              closing_day: 15,
              payment_month_offset: 1,
              payment_day: 10,
              holiday_rule: 'next_business_day',
              color: '#16a34a',
            },
          ];
          setCards(initialCards);
          localStorage.setItem('kakeibo_cards', JSON.stringify(initialCards));
        }
      } else if (data) {
        setCards(data as CreditCard[]);
      }
    } catch (err) {
      console.error('Fetch cards failed:', err);
    }
  }, []);

  // 取引データの読み込み (全期間取得してメモリ内で月別・年別を高速フィルタリング)
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Transactions fetch error (using fallback):', error.message);
        const localData = localStorage.getItem('kakeibo_fallback_data');
        if (localData) {
          setAllTransactions(JSON.parse(localData));
        }
      } else if (data) {
        setAllTransactions(data as Transaction[]);
      }
    } catch (err) {
      console.error('Fetch transactions failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初期ロード
  useEffect(() => {
    fetchCards();
    fetchTransactions();
  }, [fetchCards, fetchTransactions]);

  // Supabase Realtime リスナーの登録（PC・スマホ双方向の即時同期）
  useEffect(() => {
    const channel = supabase
      .channel('kakeibo-realtime-full')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_cards' },
        () => {
          fetchCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, fetchCards]);

  // 表示中の月の取引データを抽出
  const { startDate, endDate } = getMonthDateRange(currentDate);
  const monthlyTransactions = allTransactions.filter(
    (t) => t.date >= startDate && t.date <= endDate
  );

  // 月の切り替え
  const handleChangeMonth = (offset: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  };

  const handleResetToday = () => {
    setCurrentDate(new Date());
  };

  // 収支データの新規登録・更新
  const handleSubmitTransaction = async (data: TransactionInsert, id?: string) => {
    if (id) {
      const { error } = await supabase.from('transactions').update(data).eq('id', id);
      if (error) {
        const local = localStorage.getItem('kakeibo_fallback_data');
        const list: Transaction[] = local ? JSON.parse(local) : [];
        const updated = list.map((t) => (t.id === id ? { ...t, ...data } : t));
        localStorage.setItem('kakeibo_fallback_data', JSON.stringify(updated));
      }
    } else {
      const { error } = await supabase.from('transactions').insert([data]);
      if (error) {
        const local = localStorage.getItem('kakeibo_fallback_data');
        const list: Transaction[] = local ? JSON.parse(local) : [];
        const newRecord: Transaction = {
          ...data,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('kakeibo_fallback_data', JSON.stringify([newRecord, ...list]));
      }
    }
    await fetchTransactions();
  };

  // 収支データの削除
  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_fallback_data');
      if (local) {
        const list: Transaction[] = JSON.parse(local);
        const filtered = list.filter((t) => t.id !== id);
        localStorage.setItem('kakeibo_fallback_data', JSON.stringify(filtered));
      }
    }
    await fetchTransactions();
  };

  // カードの登録
  const handleAddCard = async (newCard: Omit<CreditCard, 'id'>) => {
    const { error } = await supabase.from('credit_cards').insert([newCard]);
    if (error) {
      const local = localStorage.getItem('kakeibo_cards');
      const list: CreditCard[] = local ? JSON.parse(local) : cards;
      const created: CreditCard = { ...newCard, id: `card-${Date.now()}` };
      localStorage.setItem('kakeibo_cards', JSON.stringify([...list, created]));
      setCards([...list, created]);
    } else {
      await fetchCards();
    }
  };

  // カードの削除
  const handleDeleteCard = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_cards');
      if (local) {
        const list: CreditCard[] = JSON.parse(local);
        const filtered = list.filter((c) => c.id !== id);
        localStorage.setItem('kakeibo_cards', JSON.stringify(filtered));
        setCards(filtered);
      }
    } else {
      await fetchCards();
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isSynced={true}
        onRefresh={() => {
          fetchTransactions();
          fetchCards();
        }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        {/* 1. 月別収支タブ */}
        {activeTab === 'dashboard' && (
          <div>
            <MonthSelector
              currentDate={currentDate}
              onChangeMonth={handleChangeMonth}
              onResetToday={handleResetToday}
            />

            <SummaryCards transactions={monthlyTransactions} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 order-2 lg:order-1">
                <CategoryBreakdown transactions={monthlyTransactions} />
              </div>
              <div className="lg:col-span-7 order-1 lg:order-2">
                <TransactionList
                  transactions={monthlyTransactions}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. カレンダー表示タブ */}
        {activeTab === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            transactions={allTransactions}
            cards={cards}
            onChangeMonth={handleChangeMonth}
            onResetToday={handleResetToday}
            onSelectTransaction={handleOpenEditModal}
          />
        )}

        {/* 3. 年間・バイト代タブ */}
        {activeTab === 'yearly' && (
          <YearlyView transactions={allTransactions} />
        )}

        {/* 4. クレジットカード管理タブ */}
        {activeTab === 'cards' && (
          <CreditCardManager
            cards={cards}
            transactions={allTransactions}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
          />
        )}
      </main>

      {/* フローティング追加ボタン */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3.5 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          <span>収支を記録</span>
        </button>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTransaction}
        editingTransaction={editingTransaction}
        cards={cards}
      />
    </div>
  );
}
