'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, IndianRupee } from 'lucide-react';

interface Expense {
  id: string;
  name: string;
  amount: number;
}

export default function ExpenseSplitterPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', name: 'Roommate 1 (Rent)', amount: 15000 },
    { id: '2', name: 'Roommate 2 (Groceries)', amount: 4500 },
  ]);

  const addExpense = () => {
    setExpenses([...expenses, { id: Math.random().toString(), name: `Person ${expenses.length + 1}`, amount: 0 }]);
  };

  const removeExpense = (id: string) => {
    if (expenses.length > 2) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const updateExpense = (id: string, field: 'name' | 'amount', value: string) => {
    setExpenses(expenses.map(e => {
      if (e.id === id) {
        return { ...e, [field]: field === 'amount' ? (Number(value) || 0) : value };
      }
      return e;
    }));
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = expenses.length > 0 ? total / expenses.length : 0;

  const settlements = expenses.map(e => {
    const diff = e.amount - perPerson;
    return {
      name: e.name || 'Unnamed',
      diff,
      status: diff > 0 ? 'Gets Back' : diff < 0 ? 'Owes' : 'Settled',
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-fuchsia-500" />
          <span>Roommate Expense Splitter</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Enter who paid how much for shared expenses (rent, groceries, bills) to instantly see who owes whom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-800">Who Paid What?</h2>
            <button
              onClick={addExpense}
              className="flex items-center gap-1 text-xs font-bold text-fuchsia-600 bg-fuchsia-50 hover:bg-fuchsia-100 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Person</span>
            </button>
          </div>

          <div className="space-y-4">
            {expenses.map((expense, idx) => (
              <div key={expense.id} className="flex items-center gap-4">
                <input
                  type="text"
                  value={expense.name}
                  onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                  placeholder="Person Name"
                  className="w-1/2 bg-slate-50 border border-slate-200 focus:border-fuchsia-500 text-sm px-4 py-2.5 rounded-xl outline-none transition"
                />
                <div className="relative w-1/2">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    value={expense.amount || ''}
                    onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-fuchsia-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                  />
                </div>
                {expenses.length > 2 && (
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="text-rose-400 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center">
            <div>
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total Spent</h3>
              <div className="text-4xl font-black text-fuchsia-400">₹{total.toLocaleString('en-IN')}</div>
            </div>
            <div className="text-right">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Equal Share (Per Person)</h3>
              <div className="text-2xl font-black">₹{Math.round(perPerson).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Settlement Summary</h3>
            <div className="space-y-4">
              {settlements.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 bg-slate-50/50">
                  <span className="font-bold text-slate-700 text-lg">{s.name}</span>
                  <div className="text-right">
                    <span className={`text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                      s.status === 'Gets Back' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'Owes' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {s.status}
                    </span>
                    {s.diff !== 0 && (
                      <div className={`text-xl font-black mt-1 ${s.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{Math.abs(Math.round(s.diff)).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
