"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

const Icon = ({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} />;
};

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: '佐藤 美咲',
      reading: 'サトウ ミサキ',
      phone: '090-1234-5678',
      email: 'misaki@example.com',
      birthday: '1995-05-15',
      notes: 'カラー剤でかぶれやすいので注意。会話は少なめを希望される方です。',
      lastVisit: '2023-11-20',
      visitCount: 9,
      history: [
        { date: '2023-11-20', note: '全体的に3cmカット。カラーはテラコッタベージュ。', isRewardUsed: false }
      ]
    }
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);
  const [newVisitNote, setNewVisitNote] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [useRewardThisTime, setUseRewardThisTime] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setVisitDate(new Date().toISOString().split('T')[0]);
  }, []);

  // 音声認識の設定
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声入力に対応していません。ChromeやSafariの最新版をご利用ください。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewVisitNote((prev: string) => prev + (prev ? " " : "") + transcript);
    };

    recognition.start();
  };

  const getFiftyDaysLater = (dateString: string) => {
    if (!dateString || dateString === '未来店') return null;
    const date = new Date(dateString);
    date.setDate(date.getDate() + 50);
    return date.toISOString().split('T')[0];
  };

  const getDueStatus = (lastVisitDate: string) => {
    if (!lastVisitDate || lastVisitDate === '未来店') return { isDue: false };
    const last = new Date(lastVisitDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return { isDue: diffDays >= 50 };
  };

  const isNextRewardTarget = (count: number) => {
    return count > 0 && (count + 1) % 10 === 0;
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return c.name.includes(searchTerm) || c.reading.includes(searchTerm);
    }).sort((a, b) => {
      return a.reading.localeCompare(b.reading, 'ja');
    });
  }, [customers, searchTerm]);

  const addVisit = (id: number) => {
    if (!newVisitNote.trim()) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const newHistory = [{ date: visitDate, note: newVisitNote, isRewardUsed: useRewardThisTime }, ...c.history]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const updated = {
          ...c,
          visitCount: Number(c.visitCount) + 1,
          lastVisit: visitDate,
          history: newHistory
        };
        if (selectedCustomer?.id === id) setSelectedCustomer(updated);
        return updated;
      }
      return c;
    }));
    setNewVisitNote('');
    setVisitDate(new Date().toISOString().split('T')[0]);
    setUseRewardThisTime(false);
  };

  const updateVisitCountManually = (id: number, newCount: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, visitCount: Number(newCount) };
        if (selectedCustomer?.id === id) setSelectedCustomer(updated);
        return updated;
      }
      return c;
    }));
  };

  const handleDeleteCustomer = () => {
    setCustomers(customers.filter(c => c.id !== showDeleteConfirm));
    if (selectedCustomer?.id === showDeleteConfirm) setSelectedCustomer(null);
    setShowDeleteConfirm(null);
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const reading = formData.get('reading') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const birthday = formData.get('birthday') as string;
    const notes = formData.get('notes') as string;

    if (!name || !reading) return;

    if (editingCustomer) {
      setCustomers(customers.map(c =>
        c.id === editingCustomer.id
          ? { ...c, name, reading, phone, email, birthday, notes }
          : c
      ));
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, name, reading, phone, email, birthday, notes });
      }
    } else {
      const visitCount = formData.get('visitCount') || 0;
      const lastVisit = (formData.get('lastVisit') as string) || '未来店';
      const newCustomer = {
        id: Date.now(),
        name,
        reading,
        phone,
        email,
        birthday,
        notes,
        visitCount: Number(visitCount),
        lastVisit,
        history: lastVisit !== '未来店' ? [{ date: lastVisit, note: '移行データ', isRewardUsed: false }] : []
      };
      setCustomers([...customers, newCustomer]);
    }
    setShowAddForm(false);
    setEditingCustomer(null);
  };

  return (
    <div className="min-h-screen text-[#5D4037] bg-[#FDF8F6]">
      <header className="bg-white/80 backdrop-blur-md border-b border-[#EAD7D1] sticky top-0 z-20 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedCustomer(null)}>
            <div className="w-10 h-10 bg-[#D9826C] rounded-full flex items-center justify-center text-white shadow-sm">
              <Icon name="Sparkles" size={20} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#A64B35] tracking-widest">ammiyu</h1>
          </div>
          <button onClick={() => { setEditingCustomer(null); setShowAddForm(true); }} className="bg-[#D9826C] text-white px-5 py-2 rounded-full flex items-center gap-2 hover:bg-[#C26D59] transition-all shadow-md active:scale-95 text-sm font-bold">
            <Icon name="UserPlus" size={18} /> 登録
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-5">
          <div className="relative">
            <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D9826C]" />
            <input
              type="text"
              placeholder="名前・フリガナで検索..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#EAD7D1] focus:outline-none focus:ring-2 focus:ring-[#D9826C] bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCustomers.length === 0 ? (
              <p className="text-center py-10 text-[#A64B35]/40 text-sm italic">該当する顧客がいません</p>
            ) : filteredCustomers.map(c => {
              const { isDue } = getDueStatus(c.lastVisit);
              const reward = isNextRewardTarget(c.visitCount);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all relative overflow-hidden ${selectedCustomer?.id === c.id ? 'bg-white border-[#D9826C] shadow-lg' : 'bg-white/70 border-white hover:border-[#EAD7D1] shadow-sm'}`}
                >
                  {isDue && <div className="absolute top-0 right-0 w-2 h-full bg-[#E27D60]"></div>}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[9px] text-[#A64B35]/60 font-bold">{c.reading}</p>
                        {reward && (
                          <span className="bg-[#E27D60] text-white text-[8px] px-1.5 py-0.5 rounded font-black animate-bounce-subtle">
                            次回特典
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold">{c.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-1 rounded-full font-black bg-[#FDF8F6] text-[#A64B35]">{c.visitCount}回</span>
                      <p className="text-[9px] text-[#A64B35]/40 mt-1">{c.lastVisit}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedCustomer ? (
            <div className="bg-white rounded-[2rem] border border-[#EAD7D1] shadow-xl overflow-hidden min-h-[600px] flex flex-col">
              <div className={`p-8 bg-gradient-to-br ${getDueStatus(selectedCustomer.lastVisit).isDue ? 'from-[#E27D60] to-[#C26D59]' : 'from-[#D9826C] to-[#C26D59]'} text-white`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-3xl font-serif font-bold">{selectedCustomer.name}</h2>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingCustomer(selectedCustomer); setShowAddForm(true); }} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="編集">
                          <Icon name="Edit" size={18} />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(selectedCustomer.id)} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="削除">
                          <Icon name="Trash2" size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-4">{selectedCustomer.reading}</p>

                    {selectedCustomer.notes && (
                      <div className="mb-4 bg-white/10 p-3 rounded-xl text-sm text-white/90 border border-white/20">
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                          <Icon name="Info" size={14} /> <span className="text-[10px] font-bold tracking-wider uppercase">Notes</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{selectedCustomer.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-white/90">
                      {selectedCustomer.birthday && (
                        <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                          <Icon name="Cake" size={14} /> {selectedCustomer.birthday}
                        </span>
                      )}
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                          <Icon name="Phone" size={14} /> {selectedCustomer.phone}
                        </span>
                      )}
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                          <Icon name="Mail" size={14} /> {selectedCustomer.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-3xl text-center min-w-[100px] self-start md:self-auto">
                    <p className="text-[9px] opacity-60 font-black mb-1 uppercase tracking-wider">Total Visits</p>
                    <input
                      type="number"
                      className="bg-transparent text-3xl font-serif font-bold w-16 text-center focus:outline-none focus:bg-white/20 rounded"
                      value={selectedCustomer.visitCount}
                      onChange={(e) => updateVisitCountManually(selectedCustomer.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-b bg-[#FDF8F6]/30">
                <div className="flex justify-between mb-4 items-center">
                  <h3 className="text-[10px] font-black text-[#A64B35]/50 flex items-center gap-2 tracking-widest uppercase">
                    <Icon name="PlusCircle" size={12} /> New Record
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={startListening}
                      className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse-red' : 'bg-white border text-[#D9826C] hover:bg-[#D9826C] hover:text-white'}`}
                      title="音声入力"
                    >
                      <Icon name={isListening ? "Mic" : "Mic"} size={16} />
                    </button>
                    <input type="date" className="text-xs font-bold p-1 bg-white border rounded-lg outline-none" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                  </div>
                </div>
                <textarea
                  className="w-full p-4 rounded-2xl border text-sm min-h-[80px] mb-4 focus:ring-2 focus:ring-[#D9826C] outline-none"
                  placeholder={isListening ? "お話しください..." : "施術内容や薬剤のメモなど..."}
                  value={newVisitNote}
                  onChange={e => setNewVisitNote(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={useRewardThisTime} onChange={e => setUseRewardThisTime(e.target.checked)} className="rounded border-[#EAD7D1] accent-[#D9826C]" />
                    特典（トリートメント等）を利用する
                  </label>
                  <button onClick={() => addVisit(selectedCustomer.id)} className="bg-[#D9826C] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#C26D59] transition-all active:scale-95">記録を保存</button>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-white">
                <h4 className="text-[10px] font-black text-[#A64B35]/40 mb-6 tracking-widest uppercase flex items-center gap-2">
                  <Icon name="History" size={12} /> History
                </h4>
                {selectedCustomer.history.length > 0 ? selectedCustomer.history.map((h: any, i: number) => (
                  <div key={i} className="pl-6 border-l-2 border-[#EAD7D1] pb-8 relative last:pb-0">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-[#D9826C] rounded-full border-4 border-white"></div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold text-[#D9826C] bg-[#FDF8F6] px-3 py-1 rounded-full border border-[#EAD7D1]/30">{h.date} 来店</span>
                      <span className="text-[11px] font-bold text-[#E27D60] bg-white px-3 py-1 rounded-full border border-[#E27D60]/30 shadow-sm">
                        再来目安: {getFiftyDaysLater(h.date)}
                      </span>
                      {h.isRewardUsed && <span className="text-[9px] bg-[#E27D60] text-white px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Reward Used</span>}
                    </div>
                    <p className="text-sm bg-[#FDF8F6] p-5 rounded-2xl border border-white shadow-sm leading-relaxed whitespace-pre-wrap text-[#5D4037]">{h.note}</p>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-[#FDF8F6]/20 rounded-[2rem] border-2 border-dashed border-[#EAD7D1]/50">
                    <Icon name="Clipboard" size={32} className="mx-auto mb-2 opacity-10" />
                    <p className="text-xs text-[#A64B35]/40 italic">施術履歴はまだありません</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#A64B35]/30 bg-white/40 rounded-[2rem] border-2 border-dashed border-[#EAD7D1] min-h-[600px]">
              <Icon name="Users" size={48} className="opacity-10 mb-4" />
              <p className="font-serif italic text-lg">顧客を選択してください</p>
              <p className="text-xs mt-2 opacity-60">左のリストから名前をクリック</p>
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Trash2" size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">顧客を削除しますか？</h2>
            <p className="text-sm text-[#A64B35]/60 mb-8 leading-relaxed">これまでの来店履歴を含むすべてのデータが完全に削除されます。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-[#FDF8F6] rounded-xl font-bold text-sm">キャンセル</button>
              <button onClick={handleDeleteCustomer} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95">削除する</button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-lg w-full shadow-2xl my-8 relative">
            <button onClick={() => { setShowAddForm(false); setEditingCustomer(null); }} className="absolute top-8 right-8 text-[#A64B35]/30 hover:text-[#A64B35] transition-colors">
              <Icon name="X" size={24} />
            </button>

            <h2 className="text-2xl font-serif font-bold mb-8 text-[#A64B35]">
              {editingCustomer ? '顧客情報の編集' : '新規顧客登録'}
            </h2>

            <form onSubmit={handleSaveCustomer} className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-[#A64B35]/50 ml-1 tracking-widest uppercase">Basic Info <span className="text-red-400">*</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" defaultValue={editingCustomer?.name || ''} className="w-full p-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none focus:ring-2 focus:ring-[#D9826C]/50" placeholder="お名前" required />
                  <input name="reading" defaultValue={editingCustomer?.reading || ''} className="w-full p-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none focus:ring-2 focus:ring-[#D9826C]/50" placeholder="フリガナ（ソート用）" required />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-[#A64B35]/50 ml-1 tracking-widest uppercase">Contact & Birthday (Optional)</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Icon name="Phone" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A64B35]/40" />
                    <input name="phone" defaultValue={editingCustomer?.phone || ''} className="w-full pl-10 pr-4 py-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none focus:ring-2 focus:ring-[#D9826C]/50" placeholder="電話番号" />
                  </div>
                  <div className="relative">
                    <Icon name="Mail" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A64B35]/40" />
                    <input name="email" type="email" defaultValue={editingCustomer?.email || ''} className="w-full pl-10 pr-4 py-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none focus:ring-2 focus:ring-[#D9826C]/50" placeholder="メールアドレス" />
                  </div>
                  <div className="relative">
                    <Icon name="Cake" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A64B35]/40" />
                    <input name="birthday" type="date" defaultValue={editingCustomer?.birthday || ''} className="w-full pl-10 pr-4 py-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none focus:ring-2 focus:ring-[#D9826C]/50" />
                  </div>
                  <div className="relative">
                    <Icon name="Info" size={14} className="absolute left-4 top-4 text-[#A64B35]/40" />
                    <textarea name="notes" defaultValue={editingCustomer?.notes || ''} className="w-full pl-10 pr-4 py-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none focus:ring-2 focus:ring-[#D9826C]/50 min-h-[80px]" placeholder="備考（アレルギー、好み、性格など...）" />
                  </div>
                </div>
              </section>

              {!editingCustomer && (
                <section className="pt-6 border-t border-[#EAD7D1]/50 space-y-4">
                  <h3 className="text-[10px] font-black text-[#A64B35]/50 ml-1 tracking-widest uppercase">Migration Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-[#A64B35]/60 ml-2 mb-1">現在の来店回数</p>
                      <input name="visitCount" type="number" defaultValue="0" className="w-full p-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none" />
                    </div>
                    <div>
                      <p className="text-[9px] text-[#A64B35]/60 ml-2 mb-1">最終来店日</p>
                      <input name="lastVisit" type="date" className="w-full p-4 border border-[#EAD7D1] rounded-2xl bg-[#FDF8F6]/30 text-sm outline-none" />
                    </div>
                  </div>
                </section>
              )}

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => { setShowAddForm(false); setEditingCustomer(null); }} className="flex-1 py-4 text-sm font-bold text-[#A64B35]/60 hover:text-[#A64B35]">キャンセル</button>
                <button type="submit" className="flex-2 py-4 px-8 bg-[#D9826C] text-white rounded-2xl font-bold shadow-lg hover:bg-[#C26D59] transition-all active:scale-95">
                  {editingCustomer ? '更新する' : 'この内容で登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
