import React, { useState, useEffect, useMemo } from 'react';
import { Play, Square, Settings, Clock, Calculator, CreditCard, Banknote, History, CheckCircle, Save, X, Edit, Trash2 } from 'lucide-react';

const formatTime = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

interface Room {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentSessionId: string | null;
}

interface Session {
  id: string;
  roomId: string;
  startTime: string;
  status: string;
  pricePerHour: number;
}

const DEFAULT_KARABOX_CONFIG = {
  version: 2,
  rooms: {
    "Box 1": {
      "Sáng": 35000,
      "Chiều": 45000,
      "Tối": 69000,
      "Đêm": 99000
    },
    "Box 2": {
      "Sáng": 45000,
      "Chiều": 65000,
      "Tối": 79000,
      "Đêm": 119000
    }
  },
  shifts: {
    "Sáng": { startHour: 6, endHour: 12 },
    "Chiều": { startHour: 12, endHour: 18 },
    "Tối": { startHour: 18, endHour: 24 },
    "Đêm": { startHour: 0, endHour: 6 }
  },
  surchargePerHour: 30000 
};

export default function KaraboxPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [config, setConfig] = useState<any>(DEFAULT_KARABOX_CONFIG);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckout, setShowCheckout] = useState<{room: Room, session: Session} | null>(null);

  const fetchData = async () => {
    try {
      const [roomsRes, sessionsRes, configRes] = await Promise.all([
        fetch('/api/karabox/rooms').then(res => res.json()),
        fetch('/api/karabox/sessions/active').then(res => res.json()),
        fetch('/api/config').then(res => res.json())
      ]);
      
      // Auto-create rooms if empty
      if (roomsRes.length === 0) {
        await Promise.all([
          fetch('/api/karabox/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Box 1', status: 'AVAILABLE' }) }),
          fetch('/api/karabox/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Box 2', status: 'AVAILABLE' }) })
        ]);
        const newRooms = await fetch('/api/karabox/rooms').then(res => res.json());
        setRooms(newRooms);
      } else {
        setRooms(roomsRes);
      }
      
      setActiveSessions(sessionsRes);
      if (configRes.karabox_pricing && configRes.karabox_pricing.version === 2) {
        setConfig(configRes.karabox_pricing);
      } else if (configRes.karabox_pricing && configRes.karabox_pricing.version !== 2) {
        // Upgrade to v2 automatically and save to DB
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ karabox_pricing: DEFAULT_KARABOX_CONFIG })
        });
        setConfig(DEFAULT_KARABOX_CONFIG);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    // Tự động refresh sau mỗi 1 phút để cập nhật giờ
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getPriceForCurrentTime = (roomName: string, date: Date = new Date()) => {
    const hour = date.getHours();
    let currentShift = 'Sáng';
    
    if (config.shifts) {
      for (const [shiftName, timeRule] of Object.entries(config.shifts)) {
        const { startHour, endHour }: any = timeRule;
        if (startHour <= endHour) {
          if (hour >= startHour && hour < endHour) currentShift = shiftName;
        } else {
          // Cross midnight edge case
          if (hour >= startHour || hour < endHour) currentShift = shiftName;
        }
      }
    }
    
    const roomPrices = config.rooms && config.rooms[roomName] ? config.rooms[roomName] : (config.rooms?.['Box 1'] || {});
    return roomPrices[currentShift] || 69000;
  };

  const handleStart = async (room: Room) => {
    if (!window.confirm(`Mở phòng ${room.name} lúc ${formatTime(new Date())}?`)) return;
    try {
      const userStr = localStorage.getItem('kiot_session_v1');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      await fetch('/api/karabox/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          pricePerHour: getPriceForCurrentTime(room.name),
          startTime: new Date().toISOString(),
          startEmployee: currentUser?.username || 'admin'
        })
      });
      fetchData();
    } catch (e) {
      alert("Lỗi khi mở phòng");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Karabox</h1>
          <p className="text-gray-500 text-sm mt-1">Cập nhật 1 phút trước</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
          >
            <Settings size={18} /> Cài đặt giá
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map(room => {
          const session = activeSessions.find(s => s.roomId === room.id);
          
          return (
            <div key={room.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${session ? 'border-pink-300 shadow-pink-100 ring-2 ring-pink-500/20' : 'hover:border-gray-300 hover:shadow-md'}`}>
              <div className={`p-5 text-white flex justify-between items-center ${session ? 'bg-gradient-to-r from-pink-600 to-rose-500' : 'bg-gradient-to-r from-gray-700 to-gray-600'}`}>
                <h3 className="text-xl font-bold">{room.name}</h3>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-white/20 shadow-sm backdrop-blur-sm">
                  {session ? 'Đang hát' : 'Trống'}
                </span>
              </div>
              
              <div className="p-6">
                {session ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <span className="flex items-center gap-2 font-medium"><Clock size={18} className="text-gray-400" /> Giờ vào:</span>
                      <span className="font-bold text-lg text-gray-900">{formatTime(session.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <span className="flex items-center gap-2 font-medium"><Calculator size={18} className="text-gray-400" /> Đơn giá:</span>
                      <span className="font-bold text-lg text-gray-900">{session.pricePerHour.toLocaleString()} đ/h</span>
                    </div>
                    
                    <button 
                      onClick={() => setShowCheckout({room, session})}
                      className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Trả Phòng & Thanh Toán
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 space-y-6">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <Play size={40} className="text-gray-300 ml-1" />
                    </div>
                    <button 
                      onClick={() => handleStart(room)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Bắt đầu (Mở phòng)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCheckout && (
        <CheckoutModal 
          room={showCheckout.room} 
          session={showCheckout.session} 
          config={config}
          onClose={() => setShowCheckout(null)}
          onSuccess={() => {
            setShowCheckout(null);
            fetchData();
          }}
        />
      )}
      
      {showSettings && (
        <SettingsModal
          config={config}
          onClose={() => setShowSettings(false)}
          onSave={async (newConfig: any) => {
            await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ karabox_pricing: newConfig })
            });
            fetchData();
            setShowSettings(false);
          }}
        />
      )}
      
      <HistorySection rooms={rooms} />
    </div>
  );
}

function CheckoutModal({ room, session, config, onClose, onSuccess }: any) {
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tính toán
  const now = new Date();
  const start = new Date(session.startTime);
  const durationMs = now.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const roomTotal = Math.round(durationHours * session.pricePerHour);

  // Tính phụ thu sau 12h đêm
  let surchargeMinutes = 0;
  const startHour = start.getHours();
  
  const isNightShift = config.shifts && config.shifts['Đêm'] && 
                       (startHour >= config.shifts['Đêm'].startHour && startHour < config.shifts['Đêm'].endHour);

  if (!isNightShift) {
    if (now.getDate() !== start.getDate() || now.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
      // Đã vắt qua ngày mới
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      surchargeMinutes = Math.max(0, (now.getTime() - midnight.getTime()) / 60000);
    }
  }
  
  const surchargePerHour = config.surchargePerHour || 30000;
  const surchargePerMin = surchargePerHour / 60;
  const surcharge = Math.round(surchargeMinutes * surchargePerMin);
  const rawTotal = roomTotal + surcharge - discount;
  const totalAmount = Math.floor(rawTotal / 1000) * 1000;

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const userStr = localStorage.getItem('kiot_session_v1');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      await fetch('/api/karabox/sessions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          endTime: now.toISOString(),
          durationHours,
          roomTotal,
          surcharge,
          discount,
          totalAmount,
          paymentMethod,
          checkoutEmployee: currentUser?.username || 'admin',
          notes,
          shiftId: null 
        })
      });
      onSuccess();
    } catch (e) {
      alert("Lỗi thanh toán!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <h2 className="font-bold text-xl flex items-center gap-2 text-gray-800">
            <CheckCircle className="text-green-600" />
            Thanh toán {room.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
              <div className="text-blue-600/80 mb-1 font-medium">Giờ vào</div>
              <div className="font-bold text-2xl text-blue-900">{formatTime(start)}</div>
            </div>
            <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl">
              <div className="text-green-600/80 mb-1 font-medium">Giờ ra</div>
              <div className="font-bold text-2xl text-green-900">{formatTime(now)}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-5 border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Thời lượng hát:</span>
              <span className="font-bold text-lg text-gray-900">{durationHours.toFixed(2)} giờ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Tiền phòng ({session.pricePerHour.toLocaleString()}/h):</span>
              <span className="font-bold text-lg text-gray-900">{roomTotal.toLocaleString()} đ</span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-dashed">
              <span className="text-orange-600 font-medium flex items-center gap-2">
                <Clock size={16} /> Phụ thu ({Math.round(surchargeMinutes)} phút):
              </span>
              <span className="font-bold text-lg text-orange-600">+{surcharge.toLocaleString()} đ</span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-dashed">
              <span className="text-gray-600 font-medium">Khuyến mãi / Giảm trừ:</span>
              <div className="relative">
                <input 
                  type="number" 
                  value={discount} 
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="border-gray-300 rounded-lg p-2 w-36 text-right font-bold pr-8 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                <span className="absolute right-3 top-2.5 text-gray-400 font-medium">đ</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-pink-50 rounded-xl border border-pink-100">
            <span className="font-bold text-xl text-pink-900">Tổng thanh toán:</span>
            <span className="font-bold text-3xl text-pink-600">{totalAmount.toLocaleString()} đ</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="font-bold text-gray-700">Phương thức thanh toán</div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentMethod('Tiền mặt')}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 font-medium transition-all ${paymentMethod === 'Tiền mặt' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm ring-2 ring-green-500/20' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                <Banknote size={28} className={paymentMethod === 'Tiền mặt' ? 'text-green-600' : 'text-gray-400'} /> Tiền mặt
              </button>
              <button 
                onClick={() => setPaymentMethod('Chuyển khoản')}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 font-medium transition-all ${paymentMethod === 'Chuyển khoản' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-500/20' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                <CreditCard size={28} className={paymentMethod === 'Chuyển khoản' ? 'text-blue-600' : 'text-gray-400'} /> Chuyển khoản
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Ghi chú (Tùy chọn)</label>
            <input 
              type="text" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              placeholder="Nhập ghi chú thanh toán..."
            />
          </div>
        </div>
        
        <div className="p-5 border-t bg-gray-50 flex gap-4">
          <button onClick={onClose} className="px-6 py-3 bg-white border shadow-sm hover:bg-gray-50 rounded-xl font-bold text-gray-700 transition-colors">Hủy</button>
          <button 
            disabled={isSubmitting}
            onClick={handleCheckout} 
            className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thu tiền'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ config, onClose, onSave }: any) {
  const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(config)));
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-xl flex items-center gap-2 text-gray-800">
            <Settings className="text-gray-600" />
            Cài đặt Giá & Phụ thu (Theo Ca)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-200/50 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Shifts configuration */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                1. Khung giờ các ca
              </h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
                {['Sáng', 'Chiều', 'Tối', 'Đêm'].map(shift => (
                  <div key={shift} className="flex items-center gap-4">
                    <span className="w-16 font-bold text-gray-700">{shift}</span>
                    <input type="number" className="border rounded-lg p-2 w-20 text-center" value={localConfig.shifts[shift]?.startHour || 0} onChange={e => {
                      setLocalConfig({
                        ...localConfig,
                        shifts: { ...localConfig.shifts, [shift]: { ...localConfig.shifts[shift], startHour: Number(e.target.value) } }
                      });
                    }} />
                    <span className="text-gray-500">h đến</span>
                    <input type="number" className="border rounded-lg p-2 w-20 text-center" value={localConfig.shifts[shift]?.endHour || 0} onChange={e => {
                      setLocalConfig({
                        ...localConfig,
                        shifts: { ...localConfig.shifts, [shift]: { ...localConfig.shifts[shift], endHour: Number(e.target.value) } }
                      });
                    }} />
                    <span className="text-gray-500">h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Surcharge config */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4">2. Phụ thu (vắt qua ca Đêm)</h3>
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-orange-900">Mức phụ thu:</span>
                  <div className="relative flex-1">
                    <input type="number" className="border-orange-200 rounded-lg p-2.5 w-full text-right font-bold text-orange-700 bg-white shadow-sm" value={localConfig.surchargePerHour || 30000} onChange={e => setLocalConfig({...localConfig, surchargePerHour: Number(e.target.value)})} />
                    <span className="absolute left-3 top-2.5 text-gray-400 font-medium">+</span>
                  </div>
                  <span className="font-bold text-orange-800">đ/h</span>
                </div>
                <p className="text-sm text-orange-700/80 mt-3 leading-relaxed">
                  Chỉ áp dụng khi khách hát từ ca Sáng/Chiều/Tối vắt sang thời gian của ca Đêm. (VD: Từ 23h đến 01h thì phần sau 00:00 bị tính thêm phụ thu). Nếu mở phòng ngay trong ca Đêm thì KHÔNG tính phụ thu.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              3. Bảng giá chi tiết theo phòng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Box 1', 'Box 2'].map(room => (
                <div key={room} className="border rounded-xl p-4 bg-white shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-3 text-lg border-b pb-2">{room}</h4>
                  <div className="space-y-3">
                    {['Sáng', 'Chiều', 'Tối', 'Đêm'].map(shift => (
                      <div key={shift} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                        <span className="font-medium text-gray-700">Ca {shift}</span>
                        <div className="flex items-center gap-2">
                          <input type="number" className="border rounded-md p-1.5 w-28 text-right font-bold text-blue-700" value={localConfig.rooms[room]?.[shift] || 0} onChange={e => {
                            setLocalConfig({
                              ...localConfig,
                              rooms: {
                                ...localConfig.rooms,
                                [room]: {
                                  ...localConfig.rooms[room],
                                  [shift]: Number(e.target.value)
                                }
                              }
                            });
                          }} />
                          <span className="text-gray-500 font-medium text-sm">đ/h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border hover:bg-gray-50 rounded-xl font-bold text-gray-700 transition-colors shadow-sm">Hủy</button>
          <button 
            onClick={() => onSave(localConfig)} 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Save size={20} /> Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}

function HistorySection({ rooms }: { rooms: Room[] }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<any>(null);

  const userStr = localStorage.getItem('kiot_session_v1');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.accessLevel === 'admin';

  const today = new Date();
  const [monthStr, setMonthStr] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

  const loadData = () => {
    setLoading(true);
    if (!monthStr) return;
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    fetch(`/api/karabox/sessions/completed?from=${start}&to=${end}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [monthStr]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn HỦY phiên hát này? (Doanh thu sẽ bị trừ đi)')) return;
    try {
      const res = await fetch(`/api/karabox/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('API failed');
      loadData();
    } catch(e) {
      alert('Lỗi khi hủy phiên');
    }
  };

  const totalRevenue = sessions.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="mt-8 bg-white rounded-2xl w-full flex flex-col shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><History size={24} className="text-blue-600" /> Lịch sử phiên hát</h2>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={monthStr} 
            onChange={(e) => setMonthStr(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {!loading && sessions.length > 0 && (
            <span className="text-sm font-bold text-gray-600 bg-gray-200/50 px-3 py-1.5 rounded-lg border border-gray-200 whitespace-nowrap">
              Tổng thu: <span className="text-green-700 font-black">{totalRevenue.toLocaleString()} đ</span>
            </span>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Không có dữ liệu trong tháng {monthStr}.</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="py-3 px-6 font-semibold">Phòng</th>
                <th className="py-3 px-6 font-semibold">Người mở</th>
                <th className="py-3 px-6 font-semibold">Người thu</th>
                <th className="py-3 px-6 font-semibold">Giờ vào</th>
                <th className="py-3 px-6 font-semibold">Giờ ra</th>
                <th className="py-3 px-6 font-semibold text-right">Tổng tiền</th>
                <th className="py-3 px-6 font-semibold text-center">HTTT</th>
                {isAdmin && <th className="py-3 px-6 font-semibold text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-800">{rooms.find(r => r.id === s.roomId)?.name || s.roomId.substring(0, 8)}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{s.startEmployee || '-'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{s.checkoutEmployee || '-'}</td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-700">{formatTime(s.startTime)}</td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-700">{formatTime(s.endTime)}</td>
                  <td className="py-4 px-6 text-right font-black text-gray-900">{s.totalAmount.toLocaleString()} đ</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${s.paymentMethod === 'Tiền mặt' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {s.paymentMethod}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditingSession(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Sửa"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hủy (Xóa)"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingSession && (
        <EditSessionModal 
          session={editingSession} 
          onClose={() => setEditingSession(null)} 
          onSuccess={() => {
            setEditingSession(null);
            loadData();
          }} 
        />
      )}
    </div>
  );
}

function EditSessionModal({ session, onClose, onSuccess }: any) {
  const [totalAmount, setTotalAmount] = useState(session.totalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState(session.paymentMethod);
  const [notes, setNotes] = useState(session.notes || '');

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/karabox/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: parseInt(totalAmount.replace(/\D/g, '') || '0'),
          paymentMethod,
          notes
        })
      });
      if (!res.ok) throw new Error('API failed');
      onSuccess();
    } catch(e) {
      alert("Lỗi lưu thông tin!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">Sửa Phiên Hát</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tổng tiền (đã thu)</label>
            <input type="text" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full border rounded-lg p-2 font-bold text-xl" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phương thức</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border rounded-lg p-2 font-medium">
              <option value="Tiền mặt">Tiền mặt</option>
              <option value="Chuyển khoản">Chuyển khoản</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lý do sửa</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nhập lý do admin sửa..." className="w-full border rounded-lg p-2 text-sm h-20"></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}
