import React, { useEffect, useState } from 'react'
import SaleCard from '../components/SaleCard'
import { useGlobalContext } from '../context/context'
import Modal from '../components/Modal'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { formatCurrency, formatNumber } from '../utils/format';

const StockOut = () => {
  const { getSales, createSale, getProducts } = useGlobalContext();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // all | today | last7 | month | custom

  const [form, setForm] = useState({ productId: '', quantity: 1, sellingPrice: '', date: '', customer: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [totals, setTotals] = useState({ totalRevenue: 0, totalProfit: 0, totalSales: 0 });

  const fetchSales = async (p = 1) => {
    setIsLoading(true);
    let isMounted = true;
    try {
      const params = { page: p, limit };

      const now = new Date();
      if (filterMode === 'today') {
        const d = now.toISOString().slice(0,10);
        params.startDate = d;
        params.endDate = d;
      } else if (filterMode === 'last7') {
        const end = now.toISOString().slice(0,10);
        const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
        params.startDate = start;
        params.endDate = end;
      } else if (filterMode === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
        const end = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
        params.startDate = start;
        params.endDate = end;
      } else if (filterMode === 'custom' && startDateFilter && endDateFilter) {
        params.startDate = startDateFilter.toISOString().slice(0,10);
        params.endDate = endDateFilter.toISOString().slice(0,10);
      }

      const res = await getSales(params);
      const data = res.data || {};
      if (!isMounted) return;
      setSales(Array.isArray(data.sales) ? data.sales : []);
      setPages(data.pages || 1);
      setPage(data.currentPage || p);

      // overall totals for the current filter (independent of pagination)
      setTotals({
        totalRevenue: Number(data.totalRevenue || 0),
        totalProfit: Number(data.totalProfit || 0),
        totalSales: Number(data.total || data.totalSales || 0),
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sales');
    } finally {
      setIsLoading(false);
    }
  }

  const fetchProducts = async () => {
    let isMounted = true;
    try {
      const res = await getProducts({ limit: 100 });
      if (!isMounted) return;
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!mounted) return;
      await fetchSales(page);
      await fetchProducts();
    };
    init();
    return () => { mounted = false; };
  // include `page` so navigation triggers fetch automatically
  }, []);

  useEffect(() => {
    // refetch when filter, dates or page changes
    fetchSales(page);
  }, [filterMode, startDateFilter, endDateFilter, page]);

  const openModal = () => {
    setForm({ productId: '', quantity: 1, sellingPrice: '', date: '', customer: '' });
    setShowModal(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.sellingPrice) {
      toast.error('Please fill required fields');
      return;
    }
    setIsSaving(true);
    try {
      await createSale({
        productId: form.productId,
        quantity: form.quantity,
        sellingPrice: form.sellingPrice,
        date: form.date || undefined,
        customer: form.customer || undefined,
      });
      toast.success('Sale recorded');
      setShowModal(false);
      await fetchSales();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to record sale';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  // metrics (coming from backend summary so they don't change when paginating)
  const totalRevenue = totals.totalRevenue;
  const totalProfit = totals.totalProfit;
  const totalSales = totals.totalSales;

  return (
    <div className='min-h-screen bg-gray-50 overflow-x-hidden'> 
        <div className='p-6'>
            <div className='flex items-start justify-between flex-wrap mb-6'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>Stock Out (sales) </h1>
                <p className='text-sm mt-2 text-gray-600'>Record all outgoing inventory and Sales</p>
              </div>
              <div className='flex items-center mt-2 gap-3'>
                <button className='px-4 py-2 border rounded-lg text-sm'>Export</button>
                <button onClick={openModal} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm"> <Plus className='h-4 w-4'/> Record Sale</button>
              </div>
            </div>

            <div className='mt-3 grid lg:grid-cols-3 gap-4 md:grid-cols-2'>
                <SaleCard
                  title={"Total Revenue"}
                  value={formatCurrency(totalRevenue)}
                />
                <SaleCard
                  title={"Total Profit"}
                  value={formatCurrency(totalProfit)}
                />
                <SaleCard
                  title={"Total Sales"}
                  value={formatNumber(totalSales)}
                />
            </div>

            <div className='mt-6'>
              <h2 className='text-lg font-medium'>Recent Sales</h2>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <button onClick={() => { setFilterMode('today'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='today' ? 'bg-black text-white':'border'}`}>Today</button>
                  <button onClick={() => { setFilterMode('last7'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='last7' ? 'bg-black text-white':'border'}`}>Last 7 days</button>
                  <button onClick={() => { setFilterMode('month'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='month' ? 'bg-black text-white':'border'}`}>This month</button>
                  <button onClick={() => { setFilterMode('custom'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='custom' ? 'bg-black text-white':'border'}`}>Custom</button>
                </div>
              </div>

              {filterMode === 'custom' && (
                <div className='flex items-center gap-2 mb-3'>
                  <div>
                    <label className='text-sm text-gray-600 block'>Start</label>
                    <input type='date' className='px-2 py-1 border rounded' value={startDateFilter ? startDateFilter.toISOString().slice(0,10) : ''} onChange={(e) => setStartDateFilter(e.target.value ? new Date(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className='text-sm text-gray-600 block'>End</label>
                    <input type='date' className='px-2 py-1 border rounded' value={endDateFilter ? endDateFilter.toISOString().slice(0,10) : ''} onChange={(e) => setEndDateFilter(e.target.value ? new Date(e.target.value) : null)} />
                  </div>
                  <div className='flex items-end'>
                    <button onClick={() => { fetchSales(1); }} className='px-3 py-2 bg-blue-600 text-white rounded'>Apply</button>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className='py-6 text-center'><Loader2 className='animate-spin mx-auto'/></div>
              ) : (
                <div className='space-y-3'>
                  {sales.map((s) => (
                    <div key={s._id} className='bg-white border p-3 rounded-md shadow-sm flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>{s.product?.name || 'Product'}</div>
                        <div className='text-sm font-bold text-gray-500'>
                          Qty: {formatNumber(s.quantity)} • Revenue: {formatCurrency(s.totalRevenue)} • Selling Price: {formatCurrency(s.sellingPrice)}
                        </div>
                      </div>
                      <div className='text-sm text-gray-500'>{new Date(s.date || s.createdAt).toLocaleString()}</div>
                    </div>
                  ))}

                  {/* pagination */}
                  <div className='flex items-center justify-center gap-3 mt-4'>
                    <button disabled={page<=1} onClick={() => { const p = Math.max(1, page-1); setPage(p); fetchSales(p); }} className='px-3 py-1 border rounded disabled:opacity-50'>Prev</button>
                    <div>Page {page} / {pages}</div>
                    <button disabled={page>=pages} onClick={() => { const p = Math.min(pages, page+1); setPage(p); fetchSales(p); }} className='px-3 py-1 border rounded disabled:opacity-50'>Next</button>
                  </div>
                </div>
              )}
        </div>

        {showModal && (
          <Modal onClose={() => setShowModal(false)} widthClass="max-w-md" topOffset="pt-10">
            <div className='bg-white rounded-xl shadow-lg w-full max-h-[85vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-bold'>Record Sale</h2>
                  <button onClick={() => setShowModal(false)} className='text-gray-500'>Close</button>
                </div>
                <form onSubmit={handleSubmit} className='space-y-3'>
                  <div>
                    <label className='block text-sm text-gray-700 mb-1'>Product</label>
                    <select className='w-full px-3 py-2 border rounded' value={form.productId} onChange={(e) => {
                      const pid = e.target.value;
                      setForm((f) => ({ ...f, productId: pid }));
                      const p = products.find(x => x._id === pid);
                      if (p) setForm((f) => ({ ...f, sellingPrice: p.sellingPrice }));
                    }}>
                      <option value=''>Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} - ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-sm text-gray700 mb-1'>Quantity</label>
                      <input type='number' min={1} className='w-full px-3 py-2 border rounded' value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-700 mb-1'>Selling Price</label>
                      <input type='number' step='0.01' className='w-full px-3 py-2 border rounded' value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm text-gray-700 mb-1'>Customer (optional)</label>
                    <input type='text' className='w-full px-3 py-2 border rounded' value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} />
                  </div>
                  <div className='flex justify-end gap-2'>
                    <button type='button' onClick={() => setShowModal(false)} className='px-4 py-2 border rounded'>Cancel</button>
                    <button type='submit' disabled={isSaving} className='px-4 py-2 bg-blue-600 text-white rounded'>{isSaving ? 'Saving...' : 'Record'}</button>
                  </div>
                </form>
              </div>
            </div>
          </Modal>
        )}
    </div>
    </div>
  )
}

export default StockOut;