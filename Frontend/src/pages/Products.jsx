import { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useGlobalContext } from "../context/context";
import Modal from '../components/Modal';
import SpectraLogo from '../assets/spectra.png';

const PAGE_SIZE = 10;

const formatCurrency = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "0.00";
  return amount.toFixed(2);
};

const deriveStatus = (quantity = 0, reorderLevel = 10) => {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "In Stock";
};

const getStatusColor = (status = "") => {
  switch (status.toLowerCase()) {
    case "in stock":
      return "bg-green-100 text-green-800";
    case "low stock":
      return "bg-yellow-100 text-yellow-800";
    case "out of stock":
      return "bg-red-100 text-red-800";
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
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  const { getProducts, createProduct, getCategories, createCategory, permissions, isSalesperson } = useGlobalContext();

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
      await fetchProducts(1, searchTerm);
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
    fetchProducts(nextPage, searchTerm);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1, searchTerm);
  };

  const disableProductSubmit =
    !permissions.canCreateProduct || !productForm.name.trim() || !productForm.sku.trim() || !productForm.category || isSavingProduct;

  const handleOpenAddModal = () => {
    if (!permissions.canCreateProduct) {
      toast.error("You're not allowed to view this action");
      return;
    }
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-x-hidden text-[var(--text)]">
      <div className="p-6">
        <div className="flex items-start justify-between flex-wrap mb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-[var(--surface)] p-3 shadow-lg ring-1 ring-white/10">
              <img src={SpectraLogo} alt="Spectra" className="h-12 w-12 object-contain" />
            </div>
            <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Products</h1>
            <p className="text-sm mt-2 mb-2 text-[var(--muted)]">
              {isSalesperson ? "Browse product stock and pricing in view-only mode" : "Manage your inventory products"}
            </p>
            </div>
          </div>
          <div className="flex items-center mt-2 gap-3">
            <button className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">Export</button>
            <button
              onClick={handleOpenAddModal}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                permissions.canCreateProduct
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
              }`}
            >
              <Plus className="h-4 w-4" /> {permissions.canCreateProduct ? "Add Product" : "Admin Only"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] text-sm"
              />
            </div>
            <select
              className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)]"
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
        <div className=" hidden lg:block bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full table-auto min-w-full">
              <thead className="bg-[var(--surface)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Product Name</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">SKU</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Category</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Supplier</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Cost Price</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Selling Price</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Quantity</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Stock Value</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-[var(--muted)]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                        Loading products...
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--muted)]">
                      No products yet.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  products.map((product) => {
                    const quantity = Number(product.quantity) || 0;
                    const reOrderLevel = Number(product.reOrderLevel) || 10;
                    const stockValue = (Number(product.costPrice) || 0) * quantity;
                    const derivedStatus = product.stockStatus || deriveStatus(quantity, reOrderLevel);
                    const statusColor = getStatusColor(derivedStatus);

                    const categoryLabel =
                      typeof product.category === "object" && product.category !== null
                        ? product.category.name
                        : product.category || "Uncategorized";

                    return (
                      <tr key={product._id || product.sku || product.name} className="border-b border-[var(--border)] hover:bg-[var(--surface)]">
                        <td className="py-4 px-4 text-sm font-medium text-[var(--text)]">{product.name}</td>
                        <td className="py-4 px-4 text-sm text-[var(--muted)]">{product.sku}</td>
                        <td className="py-4 px-4 text-sm text-[var(--muted)]">{categoryLabel}</td>
                        <td className="py-4 px-4 text-sm text-[var(--muted)]">{product.supplier || "Unknown"}</td>
                        <td className="py-4 px-4 text-sm text-[var(--muted)]">NGN {formatCurrency(product.costPrice)}</td>
                        <td className="py-4 px-4 text-sm text-[var(--muted)]">NGN {formatCurrency(product.sellingPrice)}</td>
                        <td className="py-4 px-4 text-sm text-[var(--muted)]">{quantity}</td>
                        <td className="py-4 px-4 text-sm font-medium text-[var(--text)]">NGN {formatCurrency(stockValue)}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {derivedStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted)]">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} products)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(-1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="px-3 py-1 border border-[var(--border)] rounded text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="px-3 py-1 border border-[var(--border)] rounded text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Responsive cards for small screens - avoid horizontal table scroll */}
        <div className="lg:hidden px-2 space-y-3">
          {isLoading && (
            <div className="py-8 text-center text-[var(--muted)]">Loading products...</div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="py-8 text-center text-[var(--muted)]">No products yet.</div>
          )}

          {!isLoading && products.map((product) => {
            const quantity = Number(product.quantity) || 0;
            const reOrderLevel = Number(product.reOrderLevel) || 10;
            const stockValue = (Number(product.costPrice) || 0) * quantity;
            const derivedStatus = product.stockStatus || deriveStatus(quantity, reOrderLevel);
            const statusColor = getStatusColor(derivedStatus);

            const categoryLabel =
              typeof product.category === "object" && product.category !== null
                ? product.category.name
                : product.category || "Uncategorized";

            return (
              <div key={product._id || product.sku || product.name} className="bg-[var(--card)] rounded-lg shadow-sm border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[var(--text)]">{product.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>{derivedStatus}</span>
                </div>
                <div className="mt-3 text-sm text-[var(--muted)] grid grid-cols-2 gap-2">
                  <div><span className="text-[var(--muted)]">SKU</span><div className="text-[var(--text)]">{product.sku}</div></div>
                  <div><span className="text-[var(--muted)]">Category</span><div className="text-[var(--text)]">{categoryLabel}</div></div>
                  <div><span className="text-[var(--muted)]">Supplier</span><div className="text-[var(--text)]">{product.supplier || 'Unknown'}</div></div>
                  <div><span className="text-[var(--muted)]">Quantity</span><div className="text-[var(--text)]">{quantity}</div></div>
                  <div><span className="text-[var(--muted)]">Cost</span><div className="text-[var(--text)]">NGN {formatCurrency(product.costPrice)}</div></div>
                  <div><span className="text-[var(--muted)]">Stock Value</span><div className="text-[var(--text)]">NGN {formatCurrency(stockValue)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} widthClass="max-w-2xl" topOffset="pt-10">
          <div className="bg-[var(--card)] rounded-xl shadow-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Product</h2>
                <button onClick={() => setShowAddModal(false)} className="text-[var(--muted)]">Close</button>
              </div>
              <form onSubmit={handleProductSubmit}>
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
    </div>
  );
}


