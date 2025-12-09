import React, { useEffect, useState } from 'react'
import { useGlobalContext } from '../context/context'
import { Loader2, Plus } from 'lucide-react'
import PurchaseItem from '../components/PurchaseItem'
import PurchaseSummary from '../components/PurchaseSummary'
import { toast } from 'react-toastify'

const StockIn = () => {
  const { getProductsDropdown, createPurchase, getPurchases, getProducts } = useGlobalContext();
  const [productsDropdown, setProductsDropdown] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [filterMode, setFilterMode] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);

  const [form, setForm] = useState({ productId: '', quantity: 1, costPrice: '', supplier: '', date: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProductsDropdown = async () => {
    try {
      const res = await getProductsDropdown();
      setProductsDropdown(res.data?.products || []);
    } catch (err) {
      console.error(err);
    }
  }

  const fetchPurchases = async (p = 1) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit };
      const now = new Date();
      if (filterMode === 'today') {
        params.filter = 'today';
      } else if (filterMode === 'last7') {
        params.filter = 'last7days';
      } else if (filterMode === 'month') {
        // use custom start/end for month
        params.start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
        params.end = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
      } else if (filterMode === 'custom' && startDateFilter && endDateFilter) {
        params.start = startDateFilter.toISOString().slice(0,10);
        params.end = endDateFilter.toISOString().slice(0,10);
      }

      const res = await getPurchases(params);
      const data = res.data || {};
      setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
      setPages(data.totalPages || 1);
      setPage(data.currentPage || p);
      setTotalCount(data.total || data.totalCount || (Array.isArray(data.purchases) ? data.purchases.length : 0));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchases');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProductsDropdown();
    fetchPurchases();
  }, []);

  useEffect(()=>{
    fetchPurchases(page);
  }, [filterMode, startDateFilter, endDateFilter, page]);

  const openModal = () => {
    setForm({ productId: '', quantity: 1, costPrice: '', supplier: '', date: '' });
    setShowModal(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.costPrice) {
      toast.error('Please fill required fields');
      return;
    }
    setIsSaving(true);
    try {
      await createPurchase({
        productId: form.productId,
        quantity: form.quantity,
        costPrice: form.costPrice,
        supplier: form.supplier,
        date: form.date || undefined,
      });
      toast.success('Purchase recorded');
      setShowModal(false);
      await fetchPurchases();
      await fetchProducts();
      await fetchProductsDropdown();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to record purchase';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 overflow-x-hidden'> 
      <div className='p-6'>
        <div className='flex items-start justify-between flex-wrap mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Stock In (Purchases) </h1>
            <p className='text-sm mt-2 text-gray-600'>Record all incoming inventory and purchases</p>
          </div>
          <div className='flex items-center mt-2 gap-3'>
            <button className='px-4 py-2 border rounded-lg text-sm'>Export</button>
            <button onClick={openModal} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm"> <Plus className='h-4 w-4'/> Record Purchase</button>
          </div>
        </div>

        <PurchaseSummary totalValue={purchases.reduce((s,p)=> s + (Number(p.totalCost) || (Number(p.quantity||0) * Number(p.costPrice||0)) || 0), 0)} transactions={totalCount} />

        <div className='mb-4 flex items-center gap-2'>
          <button onClick={() => { setFilterMode('today'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='today' ? 'bg-black text-white':'border'}`}>Today</button>
          <button onClick={() => { setFilterMode('last7'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='last7' ? 'bg-black text-white':'border'}`}>Last 7 days</button>
          <button onClick={() => { setFilterMode('month'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='month' ? 'bg-black text-white':'border'}`}>This month</button>
          <button onClick={() => { setFilterMode('custom'); setPage(1); }} className={`px-3 py-1 rounded ${filterMode==='custom' ? 'bg-black text-white':'border'}`}>Custom</button>
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
              <button onClick={() => { fetchPurchases(1); }} className='px-3 py-2 bg-blue-600 text-white rounded'>Apply</button>
            </div>
          </div>
        )}

        <div>
          {isLoading ? (
            <div className='py-6 text-center'><Loader2 className='animate-spin mx-auto'/></div>
          ) : (
            <div className='space-y-3'>
              {purchases.map(p => (
                <PurchaseItem key={p._id} purchase={p} />
              ))}

              <div className='flex items-center justify-center gap-3 mt-4'>
                <button disabled={page<=1} onClick={() => { const np = Math.max(1, page-1); setPage(np); fetchPurchases(np); }} className='px-3 py-1 border rounded disabled:opacity-50'>Prev</button>
                <div>Page {page} / {pages}</div>
                <button disabled={page>=pages} onClick={() => { const np = Math.min(pages, page+1); setPage(np); fetchPurchases(np); }} className='px-3 py-1 border rounded disabled:opacity-50'>Next</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-10 z-50'>
          <div className='bg-white rounded-xl shadow-lg w-full max-w-md mx-4 sm:mx-0 max-h-[85vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-bold'>Record Purchase</h2>
                <button onClick={() => setShowModal(false)} className='text-gray-500'>Close</button>
              </div>
              <form onSubmit={handleSubmit} className='space-y-3'>
                <div>
                  <label className='block text-sm text-gray-700 mb-1'>Product</label>
                  <select className='w-full px-3 py-2 border rounded' value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
                    <option value=''>Select product</option>
                    {productsDropdown.map(p => <option key={p._id} value={p._id}>{p.name} ({p.quantity})</option>)}
                  </select>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-sm text-gray-700 mb-1'>Quantity</label>
                    <input type='number' min={1} className='w-full px-3 py-2 border rounded' value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <label className='block text-sm text-gray-700 mb-1'>Cost Price</label>
                    <input type='number' step='0.01' className='w-full px-3 py-2 border rounded' value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className='block text-sm text-gray-700 mb-1'>Supplier (optional)</label>
                  <input type='text' className='w-full px-3 py-2 border rounded' value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} />
                </div>
                <div className='flex justify-end gap-2'>
                  <button type='button' onClick={() => setShowModal(false)} className='px-4 py-2 border rounded'>Cancel</button>
                  <button type='submit' disabled={isSaving} className='px-4 py-2 bg-blue-600 text-white rounded'>{isSaving ? 'Saving...' : 'Record'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default StockIn