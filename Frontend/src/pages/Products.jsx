import { useState, useEffect } from "react";
import { Search, Plus, Loader2, Trash2, Camera } from "lucide-react";
import { toast } from "react-toastify";
import { useGlobalContext } from "../context/context";
import Modal from '../components/Modal';
import { Input, Skeleton } from '../components/ui';
import { formatCurrency } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const PAGE_SIZE = 10;

const deriveStatus = (quantity = 0, reorderLevel = 10) => {
  if (Number(quantity) === 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "In Stock";
};

const getStatusColor = (status = "") => {
  switch (status.toLowerCase()) {
    case "in stock":
      return "bg-emerald-500/10 text-[var(--success)]";
    case "low stock":
      return "bg-amber-500/10 text-[var(--warning)]";
    case "out of stock":
      return "bg-rose-500/10 text-[var(--danger)]";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const initialProductForm = {
  name: "",
  sku: "",
  supplier: "",
  category: "",
  costPrice: "",
  sellingPrice: "",
  quantity: "0",
  description: "",
  reOrderLevel: "10",
};

export default function Products() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const { getProducts, createProduct, deleteProduct, getCategories, createCategory, analyzeProductImage, permissions, isSalesperson } = useGlobalContext();

  const handleImageAnalysis = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast.error('Choose a JPG, PNG, or WebP image under 8 MB.');
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setAnalyzingImage(true);
    try {
      const { data } = await analyzeProductImage(file);
      const details = data.data || data.product || data;
      setProductForm((form) => ({ ...form, name: details.name || form.name, description: details.description || form.description, ...(details.category ? { category: categories.find((item) => item.name?.toLowerCase() === details.category.toLowerCase())?._id || form.category } : {}) }));
      toast.success('Product details added. Review and complete the form.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Image analysis is unavailable. You can enter product details manually.');
    } finally { setAnalyzingImage(false); }
  };

  const updateProductForm = (updates) => {
    setProductForm((prev) => ({ ...prev, ...updates }));
  };

  const resetProductForm = (list = categories) => {
    const firstCategory = list[0]?._id || "";
    setProductForm({ ...initialProductForm, category: firstCategory });
  };

  const fetchProducts = async (page = 1, searchValue = "", categoryId = "") => {
    setIsLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (searchValue.trim()) params.search = searchValue.trim();
      if (categoryId) params.category = categoryId;
      const res = await getProducts(params);
      const productsData = Array.isArray(res.data?.products) ? res.data.products : [];
      setProducts(productsData);
      setPagination({
        currentPage: res.data?.currentPage || page,
        totalPages: res.data?.pages || 1,
        total: res.data?.total || productsData.length,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setCategories(list);
      if (!productForm.category && list.length > 0) {
        updateProductForm({ category: list[0]._id });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts(1, "", selectedCategory);
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!permissions.canCreateProduct) {
      toast.error("You're not allowed to add products");
      setShowAddModal(false);
      return;
    }
    // If user chose to create a new category from the modal, create it first
    let createdCategoryId = null;
    if (productForm.category === "__new__") {
      if (!categoryForm.name.trim()) {
        toast.error("Category name is required to create a new category");
        return;
      }
      setIsSavingCategory(true);
      try {
        await createCategory(categoryForm);
        const res = await getCategories();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setCategories(list);
        // find category by name (best effort)
        const created = list.find((c) => c.name === categoryForm.name) || list[0];
        createdCategoryId = created?._id || null;
        // update local form state so UI reflects new category
        setProductForm((p) => ({ ...p, category: createdCategoryId }));
        setCategoryForm({ name: "", description: "" });
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to create category";
        toast.error(msg);
        setIsSavingCategory(false);
        return;
      } finally {
        setIsSavingCategory(false);
      }
    }

    if (!productForm.category) {
      toast.error("Please select a category");
      return;
    }

    setIsSavingProduct(true);
    try {
      const payload = { ...productForm, category: createdCategoryId || productForm.category };
      const res = await createProduct(payload);
      toast.success(res.data?.message || "Product added!");
      setShowAddModal(false);
      resetProductForm();
      await fetchProducts(1, searchTerm, selectedCategory);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create product";
      toast.error(msg);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handlePageChange = (direction) => {
    const nextPage = pagination.currentPage + direction;
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    fetchProducts(nextPage, searchTerm, selectedCategory);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1, searchTerm, selectedCategory);
  };

  const disableProductSubmit =
    !permissions.canCreateProduct || !productForm.name.trim() || !productForm.sku.trim() || !productForm.category || isSavingProduct;

  const exportProducts = () => downloadCsv('spectra-products-page.csv',
    ['Product', 'SKU', 'Category', 'Supplier', 'Cost price (NGN)', 'Selling price (NGN)', 'Quantity', 'Stock value (NGN)', 'Status'],
    products.map((product) => {
      const quantity = Number.isFinite(Number(product.quantity)) ? Number(product.quantity) : 0;
      const costPrice = Number.isFinite(Number(product.costPrice)) ? Number(product.costPrice) : 0;
      const category = typeof product.category === 'object' ? product.category?.name : product.category;
      const sellingPrice = Number.isFinite(Number(product.sellingPrice)) ? Number(product.sellingPrice) : 0;
      const stockValue = costPrice * quantity;
      return [product.name, product.sku, category || 'Uncategorized', product.supplier || 'Unknown', costPrice, sellingPrice, quantity, Number.isFinite(stockValue) ? stockValue : '', product.stockStatus || deriveStatus(quantity, product.reOrderLevel ?? 10)];
    })
  );

  const handleOpenAddModal = () => {
    if (!permissions.canCreateProduct) {
      toast.error("You're not allowed to view this action");
      return;
    }
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!permissions.canManageProducts) {
      toast.error("Only managers can delete products");
      return;
    }
    const confirmed = window.confirm("Delete this product? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingProductId(productId);
    try {
      const res = await deleteProduct(productId);
      toast.success(res.data?.message || "Product deleted");
      await fetchProducts(pagination.currentPage, searchTerm, selectedCategory);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete product";
      toast.error(msg);
    } finally {
      setDeletingProductId("");
    }
  };

  return (
        <main className="w-full overflow-x-hidden py-5 text-[var(--text)] sm:py-7">
      <div>
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="flex items-center gap-4">
            <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Inventory</p><h1 className="app-page-title text-[var(--text)]">Products</h1>
            <p className="app-page-copy mt-2">
              {isSalesperson ? "Browse product stock and pricing in view-only mode" : "Manage your inventory products"}
            </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
              <button onClick={exportProducts} disabled={!products.length} className="app-control flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium disabled:opacity-50 sm:flex-none">Export page</button>
            <button
              onClick={handleOpenAddModal}
              className={`app-control flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm sm:flex-none ${
                permissions.canCreateProduct
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
              }`}
            >
              <Plus className="h-4 w-4" /> {permissions.canCreateProduct ? "Add Product" : "Manager Only"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="app-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="pl-10"
              />
            </div>
            <select
              aria-label="Filter products by category"
              className="theme-input app-control px-3 text-sm sm:w-56"
              value={selectedCategory}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedCategory(v);
                fetchProducts(1, searchTerm, v);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* Table for md and larger screens */}
        <div className="app-card hidden overflow-hidden lg:block">
          <div className="w-full overflow-x-auto">
            <table className="app-table min-w-[1320px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th>Product name</th><th>SKU</th>
                  <th>Category</th><th>Supplier</th><th>Cost Price</th><th>Selling Price</th><th>Quantity</th><th>Stock Value</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-[var(--muted)]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                        Loading products...
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[var(--muted)]">
                      No products yet.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  products.map((product) => {
                    const quantity = Number(product.quantity) || 0;
              const reOrderLevel = Number.isFinite(Number(product.reOrderLevel)) ? Number(product.reOrderLevel) : 10;
                    const stockValue = (Number(product.costPrice) || 0) * quantity;
                    const derivedStatus = product.stockStatus || deriveStatus(quantity, reOrderLevel);
                    const statusColor = getStatusColor(derivedStatus);

                    const categoryLabel =
                      typeof product.category === "object" && product.category !== null
                        ? product.category.name
                        : product.category || "Uncategorized";

                    return (
                      <tr key={product._id || product.sku || product.name}>
                        <td><div className="max-w-40 font-semibold text-[var(--text)]">{product.name}</div></td><td className="whitespace-nowrap text-[var(--muted)]">{product.sku}</td>
                        <td className="text-[var(--muted)]">{categoryLabel}</td>
                        <td className="text-[var(--muted)]">{product.supplier || "Unknown"}</td>
                        <td className="money-value whitespace-nowrap text-[var(--muted)]">{formatCurrency(product.costPrice)}</td>
                        <td className="money-value whitespace-nowrap text-[var(--muted)]">{formatCurrency(product.sellingPrice)}</td>
                        <td className="tabular-nums">{quantity}</td>
                        <td className="money-value whitespace-nowrap font-semibold text-[var(--text)]">{formatCurrency(stockValue)}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>
                            {derivedStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {permissions.canManageProducts ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product._id)}
                              disabled={deletingProductId === product._id}
                              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-[var(--danger)] transition hover:bg-rose-500/10 disabled:opacity-60"
                            >
                              {deletingProductId === product._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              Delete
                            </button>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">View only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
            <p className="text-sm text-[var(--muted)]">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} {pagination.total === 1 ? 'product' : 'products'})
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(-1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="app-control rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text)] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="app-control rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Responsive cards for small screens - avoid horizontal table scroll */}
        <div className="space-y-3 px-1 lg:hidden">
          {isLoading && (
            <div className="space-y-3">{[1, 2, 3].map((row) => <Skeleton key={row} className="h-40 w-full" />)}</div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="app-card"><div className="py-9 text-center"><p className="text-sm font-medium">No products found</p><p className="mt-1 text-xs text-[var(--muted)]">Try another search or category.</p></div></div>
          )}

          {!isLoading && products.map((product) => {
            const quantity = Number(product.quantity) || 0;
            const reOrderLevel = Number.isFinite(Number(product.reOrderLevel)) ? Number(product.reOrderLevel) : 10;
            const stockValue = (Number(product.costPrice) || 0) * quantity;
            const derivedStatus = product.stockStatus || deriveStatus(quantity, reOrderLevel);
            const statusColor = getStatusColor(derivedStatus);

            const categoryLabel =
              typeof product.category === "object" && product.category !== null
                ? product.category.name
                : product.category || "Uncategorized";

            return (
              <div key={product._id || product.sku || product.name} className="app-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[var(--text)]">{product.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>{derivedStatus}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[var(--muted)]">
                  <div><span className="text-[var(--muted)]">SKU</span><div className="text-[var(--text)]">{product.sku}</div></div>
                  <div><span className="text-[var(--muted)]">Category</span><div className="text-[var(--text)]">{categoryLabel}</div></div>
                  <div><span className="text-[var(--muted)]">Supplier</span><div className="text-[var(--text)]">{product.supplier || 'Unknown'}</div></div>
                  <div><span className="text-[var(--muted)]">Quantity</span><div className="text-[var(--text)]">{quantity}</div></div>
                  <div><span className="text-[var(--muted)]">Cost</span><div className="tabular-nums text-[var(--text)]">{formatCurrency(product.costPrice)}</div></div>
                  <div><span className="text-[var(--muted)]">Selling price</span><div className="tabular-nums text-[var(--text)]">{formatCurrency(product.sellingPrice)}</div></div>
                  <div><span className="text-[var(--muted)]">Stock Value</span><div className="tabular-nums text-[var(--text)]">{formatCurrency(stockValue)}</div></div>
                </div>
                {permissions.canManageProducts ? (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product._id)}
                      disabled={deletingProductId === product._id}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-[var(--danger)] transition hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      {deletingProductId === product._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted)]">
            <span>Page {pagination.currentPage} of {pagination.totalPages} · {pagination.total} {pagination.total === 1 ? 'product' : 'products'}</span>
            <div className="flex gap-2"><button type="button" onClick={() => handlePageChange(-1)} disabled={pagination.currentPage === 1 || isLoading} className="app-control rounded-lg border border-[var(--border)] px-3 text-[var(--text)] disabled:opacity-40">Previous</button><button type="button" onClick={() => handlePageChange(1)} disabled={pagination.currentPage === pagination.totalPages || isLoading} className="app-control rounded-lg border border-[var(--border)] px-3 text-[var(--text)] disabled:opacity-40">Next</button></div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add product" widthClass="max-w-2xl" topOffset="pt-10">
          <div className="bg-[var(--card)] rounded-xl shadow-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Product</h2>
                <button onClick={() => setShowAddModal(false)} className="text-[var(--muted)]">Close</button>
              </div>
              <form onSubmit={handleProductSubmit}>
                <div className="mb-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium">Snap to add</p><p className="mt-1 max-w-sm text-xs text-[var(--muted)]">Get a name and description suggestion from a photo. Review everything before saving.</p></div><label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium ${analyzingImage?'pointer-events-none opacity-60':''}`}><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e)=>handleImageAnalysis(e.target.files?.[0])}/>{analyzingImage?<Loader2 className="h-4 w-4 animate-spin"/>:<Camera className="h-4 w-4"/>}{analyzingImage?'Analyzing photo':'Take or upload photo'}</label></div>
                  {imagePreview && <div className="mt-3 flex items-center gap-3"><img src={imagePreview} alt="Selected product" className="h-14 w-14 rounded-lg object-cover"/><span className="text-xs text-[var(--muted)]">{analyzingImage?'Reading product details…':'Photo selected. Review suggested fields below.'}</span></div>}
                  <p className="mt-2 text-[11px] text-[var(--muted)]">Image analysis is optional. You can always enter the details manually.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Product Name*</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => updateProductForm({ name: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">SKU*</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => updateProductForm({ sku: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Category*</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => updateProductForm({ category: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__new__">+ Create new category</option>
                    </select>

                    {productForm.category === "__new__" && (
                      <div className="mt-3 p-3 border rounded bg-[var(--surface)]">
                        <label className="block text-sm font-medium text-[var(--muted)] mb-1">New Category Name*</label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm mb-2 bg-[var(--surface)] text-[var(--text)]"
                        />
                        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Supplier</label>
                    <input
                      type="text"
                      value={productForm.supplier}
                      onChange={(e) => updateProductForm({ supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Cost Price*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.costPrice}
                      onChange={(e) => updateProductForm({ costPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Selling Price*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.sellingPrice}
                      onChange={(e) => updateProductForm({ sellingPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Initial Quantity*</label>
                    <input
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) => updateProductForm({ quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Reorder Level</label>
                    <input
                      type="number"
                      value={productForm.reOrderLevel}
                      onChange={(e) => updateProductForm({ reOrderLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => updateProductForm({ description: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-[var(--surface)] text-[var(--text)]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disableProductSubmit || isSavingCategory}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded text-sm disabled:opacity-60"
                  >
                    {isSavingProduct || isSavingCategory ? "Saving..." : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
