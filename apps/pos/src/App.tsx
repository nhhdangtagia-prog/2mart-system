import { Button, Input, Card, CardContent } from '@2mart/ui'

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      
      {/* LEFT PANEL: CATALOG (70%) */}
      <div className="flex-[7] flex flex-col border-r border-slate-800 bg-slate-950 p-4">
        {/* Header / Search */}
        <div className="mb-6 flex gap-4">
          <Input 
            className="h-14 text-lg bg-slate-900 border-slate-700 placeholder:text-slate-500" 
            placeholder="Tìm kiếm sản phẩm (Tên, SKU, Barcode)..." 
          />
          <Button size="icon" className="h-14 w-14 bg-slate-800 text-slate-300 hover:bg-slate-700">
            🔍
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <Button variant="secondary" className="rounded-full px-6">⭐ Yêu thích</Button>
          <Button variant="ghost" className="rounded-full px-6">🔥 Bán chạy</Button>
          <Button variant="ghost" className="rounded-full px-6">Đồ uống</Button>
          <Button variant="ghost" className="rounded-full px-6">Bánh kẹo</Button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto mt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Mock Product 1 */}
          <Card className="bg-slate-900 border-slate-800 overflow-hidden cursor-pointer hover:border-slate-600 transition-colors">
            <div className="h-32 bg-slate-800 flex items-center justify-center text-4xl">🥤</div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm truncate">Coca Cola 330ml</h3>
              <p className="text-emerald-400 font-bold mt-1">10.000 đ</p>
              <p className="text-xs text-slate-500 mt-1">Còn 24</p>
            </CardContent>
          </Card>
          
          {/* Mock Product 2 */}
          <Card className="bg-slate-900 border-slate-800 overflow-hidden cursor-pointer hover:border-slate-600 transition-colors">
            <div className="h-32 bg-slate-800 flex items-center justify-center text-4xl">🥔</div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm truncate">Snack Lay's Vị Tự Nhiên</h3>
              <p className="text-emerald-400 font-bold mt-1">25.000 đ</p>
              <p className="text-xs text-amber-500 font-medium mt-1">⚠ Còn 2</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RIGHT PANEL: CART & CHECKOUT (30%) */}
      <div className="flex-[3] flex flex-col bg-slate-900 p-4">
        {/* Cart Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-lg">Đơn hàng #1002</h2>
            <p className="text-xs text-slate-400">Thu ngân: Admin • Ca 1</p>
          </div>
          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
            🗑️
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {/* Mock Item */}
          <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Coca Cola 330ml</h4>
              <p className="text-emerald-400 font-semibold text-sm">10.000 đ</p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-700">-</Button>
              <span className="font-medium w-4 text-center">2</span>
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-700">+</Button>
            </div>
          </div>
        </div>

        {/* Checkout Section */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Tạm tính (2)</span>
            <span className="font-medium">20.000 đ</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Giảm giá</span>
            <span className="font-medium text-amber-400">- 0 đ</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold">Tổng tiền</span>
            <span className="text-3xl font-black text-emerald-400">20.000 đ</span>
          </div>

          <Button size="lg" className="w-full h-20 text-3xl font-black bg-(--color-cash) hover:bg-(--color-cash)/90 text-white shadow-xl mb-3">
            TIỀN MẶT
          </Button>
          
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" className="h-14 font-semibold text-lg bg-slate-800 hover:bg-slate-700">QR</Button>
            <Button variant="secondary" className="h-14 font-semibold text-lg bg-slate-800 hover:bg-slate-700">THẺ</Button>
            <Button variant="secondary" className="h-14 font-semibold text-sm bg-slate-800 hover:bg-slate-700">CHIA TIỀN</Button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default App
