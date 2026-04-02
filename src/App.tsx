import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Calendar, AlertCircle, CreditCard, Clock, Edit2, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Loan {
  id: string;
  name: string;
  lender: string;
  amount: number;
  dueDate?: number | null;
  isPaid: boolean;
}

export default function App() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [lastReset, setLastReset] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [showAdd, setShowAdd] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newLender, setNewLender] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  // Load data and handle monthly reset
  useEffect(() => {
    const storedLoans = localStorage.getItem('emi-loans-v2');
    const storedReset = localStorage.getItem('emi-last-reset-v2');
    
    let loadedLoans: Loan[] = storedLoans ? JSON.parse(storedLoans) : [];
    const currentMonthYear = new Date().getFullYear() + '-' + (new Date().getMonth() + 1);
    
    if (storedReset !== currentMonthYear) {
      loadedLoans = loadedLoans.map(loan => ({ ...loan, isPaid: false }));
      setLastReset(currentMonthYear);
      localStorage.setItem('emi-last-reset-v2', currentMonthYear);
    } else {
      setLastReset(storedReset);
    }
    
    setLoans(loadedLoans);
    setIsLoaded(true);
  }, []);

  // Save data on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('emi-loans-v2', JSON.stringify(loans));
    }
  }, [loans, isLoaded]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const togglePaid = (id: string) => {
    triggerHaptic();
    setLoans(loans.map(loan => 
      loan.id === id ? { ...loan, isPaid: !loan.isPaid } : loan
    ));
  };

  const confirmDelete = (id: string) => {
    setLoanToDelete(id);
  };

  const deleteLoan = () => {
    if (loanToDelete) {
      setLoans(loans.filter(loan => loan.id !== loanToDelete));
      setLoanToDelete(null);
    }
  };

  const openAdd = () => {
    setEditingLoan(null);
    setNewName('');
    setNewLender('');
    setNewAmount('');
    setNewDueDate('');
    setShowAdd(true);
  };

  const openEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setNewName(loan.name);
    setNewLender(loan.lender || '');
    setNewAmount(loan.amount.toString());
    setNewDueDate(loan.dueDate ? loan.dueDate.toString() : '');
    setShowAdd(true);
  };

  const saveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount) return;
    
    const amountNum = parseFloat(newAmount);
    const dueDateNum = newDueDate ? parseInt(newDueDate) : null;

    if (editingLoan) {
      setLoans(loans.map(loan => 
        loan.id === editingLoan.id 
          ? { ...loan, name: newName, lender: newLender, amount: amountNum, dueDate: dueDateNum }
          : loan
      ));
    } else {
      const newLoan: Loan = {
        id: crypto.randomUUID(),
        name: newName,
        lender: newLender,
        amount: amountNum,
        dueDate: dueDateNum,
        isPaid: false
      };
      setLoans([...loans, newLoan]);
    }
    
    setShowAdd(false);
  };

  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const paidAmount = loans.filter(l => l.isPaid).reduce((sum, loan) => sum + loan.amount, 0);
  const dueAmount = totalAmount - paidAmount;
  
  const paidCount = loans.filter(l => l.isPaid).length;
  const pendingCount = loans.length - paidCount;
  
  const progress = totalAmount === 0 ? 0 : (paidAmount / totalAmount) * 100;

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">EMI Tracker</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Track your loan payments</p>
          </div>
          <button 
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-1.5 bg-[#2548B5] hover:bg-[#1e3a94] text-white px-4 py-2 rounded-xl font-medium transition-colors active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Loan
          </button>
        </header>

        {/* Summary Card */}
        <div className="px-6 mb-8">
          <div className="bg-[#2548B5] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-blue-200 text-sm mb-1">{currentMonthName}</p>
                <h2 className="text-xl font-semibold">EMI Tracker</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold mb-1">
                ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-blue-200 text-sm">Total Monthly EMI</p>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-white/20 rounded-full mb-6 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-center">
              <div className="flex-1">
                <div className="flex justify-center mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-semibold text-lg">{paidCount}</div>
                <div className="text-xs text-blue-200">Paid</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="flex-1">
                <div className="flex justify-center mb-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-semibold text-lg">{pendingCount}</div>
                <div className="text-xs text-blue-200">Pending</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="flex-1">
                <div className="flex justify-center mb-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div className="font-semibold text-lg">₹{dueAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-blue-200">Due</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan List */}
        <div className="px-6">
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2548B5]">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">No loans added yet</h3>
              <p className="text-neutral-500 mb-8 text-sm leading-relaxed max-w-[260px] mx-auto">
                Tap "Add Loan" to start tracking your EMI payments. Each entry resets on the 1st of every month.
              </p>
              <button 
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 bg-[#2548B5] hover:bg-[#1e3a94] text-white px-6 py-3 rounded-xl font-medium transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Your First Loan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {loans.map(loan => {
                  const isOverdue = !loan.isPaid && loan.dueDate && new Date().getDate() > loan.dueDate;
                  
                  return (
                    <motion.div 
                      key={loan.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => togglePaid(loan.id)}
                      className={`relative group flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        loan.isPaid 
                          ? 'bg-neutral-50 border-neutral-100' 
                          : isOverdue 
                            ? 'bg-red-50/30 border-red-100' 
                            : 'bg-white border-neutral-100 shadow-sm hover:border-blue-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold truncate text-lg ${loan.isPaid ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                            {loan.name}
                          </h4>
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className={`font-medium ${loan.isPaid ? 'text-neutral-400' : 'text-[#2548B5]'}`}>
                            ₹{loan.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                          {loan.lender && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className={`truncate ${loan.isPaid ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {loan.lender}
                              </span>
                            </>
                          )}
                          {loan.dueDate && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className={`flex items-center gap-1 ${loan.isPaid ? 'text-neutral-400' : isOverdue ? 'text-red-600 font-medium' : 'text-neutral-500'}`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {loan.dueDate}{getOrdinalSuffix(loan.dueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div 
                          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            loan.isPaid 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-neutral-100 text-neutral-300 border-2 border-neutral-200'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${loan.isPaid ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Actions Menu (Edit/Delete) - Stop propagation to avoid toggling paid state */}
                      <div className="absolute -top-3 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(loan); }}
                          className="p-2 bg-white text-neutral-500 hover:text-[#2548B5] rounded-full shadow-sm border border-neutral-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); confirmDelete(loan.id); }}
                          className="p-2 bg-white text-neutral-500 hover:text-red-500 rounded-full shadow-sm border border-neutral-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAdd && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAdd(false)}
                className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-neutral-900">
                    {editingLoan ? 'Edit Loan' : 'Add New Loan'}
                  </h3>
                  <button 
                    onClick={() => setShowAdd(false)}
                    className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={saveLoan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Loan Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Home Loan"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2548B5] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bank / Lender</label>
                    <input 
                      type="text" 
                      value={newLender}
                      onChange={e => setNewLender(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2548B5] focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">EMI Amount (₹) *</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="1"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2548B5] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Due Date (Optional)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="31"
                        value={newDueDate}
                        onChange={e => setNewDueDate(e.target.value)}
                        placeholder="1-31"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2548B5] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-[#2548B5] text-white font-medium rounded-xl hover:bg-[#1e3a94] transition-colors active:scale-[0.98]"
                    >
                      {editingLoan ? 'Save Changes' : 'Add Loan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {loanToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLoanToDelete(null)}
                className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl text-center"
              >
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Loan?</h3>
                <p className="text-neutral-500 mb-6">
                  Are you sure you want to remove this loan? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setLoanToDelete(null)}
                    className="flex-1 py-3 text-neutral-700 font-medium bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={deleteLoan}
                    className="flex-1 py-3 text-white font-medium bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function getOrdinalSuffix(i: number) {
  const j = i % 10,
        k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}
