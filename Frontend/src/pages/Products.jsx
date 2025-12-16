import { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useGlobalContext } from "../context/context";
import Modal from '../components/Modal'

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

  const { getProducts, createProduct, getCategories, createCategory } = useGlobalContext();

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

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsSavingCategory(true);
    try {
      await createCategory(categoryForm);
      toast.success("Category created");
      setCategoryForm({ name: "", description: "" });
      const res = await getCategories();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setCategories(list);
      resetProductForm(list);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create category";
      toast.error(msg);
    } finally {
      setIsSavingCategory(false);
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

  const handleSearchReset = () => {
    setSearchTerm("");
    fetchProducts(1, "");
  };

  const noCategories = categories.length === 0;
  const disableProductSubmit =
    !productForm.name.trim() || !productForm.sku.trim() || !productForm.category || isSavingProduct;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm mt-2 mb-2 text-gray-600">Manage your inventory products</p>
          </div>
          <div className="flex items-center mt-2 gap-3">
            <button className="px-4 py-2 border rounded-lg text-sm">Export</button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
        </div>

        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
        <div className=" hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full table-auto min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Product Name</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">SKU</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Supplier</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Cost Price</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Selling Price</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Stock Value</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Loading products...
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
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
                      <tr key={product._id || product.sku || product.name} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{product.sku}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{categoryLabel}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{product.supplier || "Unknown"}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">NGN {formatCurrency(product.costPrice)}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">NGN {formatCurrency(product.sellingPrice)}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{quantity}</td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">NGN {formatCurrency(stockValue)}</td>
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

          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-600">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} products)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(-1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="px-3 py-1 border rounded text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="px-3 py-1 border rounded text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Responsive cards for small screens - avoid horizontal table scroll */}
        <div className="lg:hidden px-2 space-y-3">
          {isLoading && (
            <div className="py-8 text-center text-gray-500">Loading products...</div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="py-8 text-center text-gray-500">No products yet.</div>
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
              <div key={product._id || product.sku || product.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>{derivedStatus}</span>
                </div>
                <div className="mt-3 text-sm text-gray-700 grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">SKU</span><div className="text-gray-900">{product.sku}</div></div>
                  <div><span className="text-gray-500">Category</span><div className="text-gray-900">{categoryLabel}</div></div>
                  <div><span className="text-gray-500">Supplier</span><div className="text-gray-900">{product.supplier || 'Unknown'}</div></div>
                  <div><span className="text-gray-500">Quantity</span><div className="text-gray-900">{quantity}</div></div>
                  <div><span className="text-gray-500">Cost</span><div className="text-gray-900">NGN {formatCurrency(product.costPrice)}</div></div>
                  <div><span className="text-gray-500">Stock Value</span><div className="text-gray-900">NGN {formatCurrency(stockValue)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} widthClass="max-w-2xl" topOffset="pt-10">
          <div className="bg-white rounded-xl shadow-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Product</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500">Close</button>
              </div>
              <form onSubmit={handleProductSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => updateProductForm({ name: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU*</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => updateProductForm({ sku: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => updateProductForm({ category: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
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
                      <div className="mt-3 p-3 border rounded bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Category Name*</label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border rounded text-sm mb-2"
                        />
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={productForm.supplier}
                      onChange={(e) => updateProductForm({ supplier: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.costPrice}
                      onChange={(e) => updateProductForm({ costPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.sellingPrice}
                      onChange={(e) => updateProductForm({ sellingPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity*</label>
                    <input
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) => updateProductForm({ quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      value={productForm.reOrderLevel}
                      onChange={(e) => updateProductForm({ reOrderLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => updateProductForm({ description: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disableProductSubmit || isSavingCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-60"
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


