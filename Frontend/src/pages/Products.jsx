import { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useGlobalContext } from "../context/context";

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

  const fetchProducts = async (page = 1, searchValue = "") => {
    setIsLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (searchValue.trim()) params.search = searchValue.trim();
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

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.category) {
      toast.error("Please create or select a category first");
      return;
    }
    setIsSavingProduct(true);
    try {
      const res = await createProduct(productForm);
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noCategories = categories.length === 0;
  const disableProductSubmit =
    !productForm.name.trim() || !productForm.sku.trim() || !productForm.category || isSavingProduct;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management System</h1>
          <h2 className="text-xl font-semibold text-gray-700">Products</h2>
          <p className="text-gray-600 mt-1">Manage your inventory products</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <form className="flex flex-1 gap-3" onSubmit={handleSearchSubmit}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleSearchReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </form>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add Category</h3>
              <p className="text-sm text-gray-600">
                Categories help keep your catalog organised. Create one before adding products.
              </p>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCategorySubmit}>
              <input
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <input
                type="text"
                name="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={isSavingCategory}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingCategory ? "Saving..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] sm:min-w-0">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Product Name</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">SKU</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Category</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Supplier</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Cost Price</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Selling Price</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Quantity</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Stock Value</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span>Loading products...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500">
                      No products yet. Add your first product to see it listed here.
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
                      <tr key={product._id || product.sku || product.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">{product.name}</td>
                        <td className="py-4 px-6 text-gray-700">{product.sku}</td>
                        <td className="py-4 px-6 text-gray-700">{categoryLabel}</td>
                        <td className="py-4 px-6 text-gray-700">{product.supplier || "Unknown"}</td>
                        <td className="py-4 px-6 text-gray-700">${formatCurrency(product.costPrice)}</td>
                        <td className="py-4 px-6 text-gray-700">${formatCurrency(product.sellingPrice)}</td>
                        <td className="py-4 px-6 text-gray-700">{quantity}</td>
                        <td className="py-4 px-6 font-medium text-gray-900">${formatCurrency(stockValue)}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                            {derivedStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} products total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(-1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h2>
              <form onSubmit={handleProductSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={productForm.name}
                        onChange={(e) => updateProductForm({ name: e.target.value })}
                        placeholder="Enter product name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SKU*</label>
                      <input
                        type="text"
                        name="sku"
                        value={productForm.sku}
                        onChange={(e) => updateProductForm({ sku: e.target.value })}
                        placeholder="e.g., PROD-001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category*</label>
                      <select
                        name="category"
                        value={productForm.category}
                        onChange={(e) => updateProductForm({ category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        disabled={noCategories}
                      >
                        {noCategories && <option value="">Create a category first</option>}
                        {!noCategories &&
                          categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                      {noCategories && <p className="text-xs text-red-500 mt-1">You need at least one category.</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={productForm.description}
                        onChange={(e) => updateProductForm({ description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                      <input
                        type="text"
                        name="supplier"
                        value={productForm.supplier}
                        onChange={(e) => updateProductForm({ supplier: e.target.value })}
                        placeholder="Enter supplier name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price*</label>
                        <input
                          type="number"
                          name="costPrice"
                          step="0.01"
                          value={productForm.costPrice}
                          onChange={(e) => updateProductForm({ costPrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price*</label>
                        <input
                          type="number"
                          name="sellingPrice"
                          step="0.01"
                          value={productForm.sellingPrice}
                          onChange={(e) => updateProductForm({ sellingPrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Quantity*</label>
                        <input
                          type="number"
                          name="quantity"
                          value={productForm.quantity}
                          onChange={(e) => updateProductForm({ quantity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                        <input
                          type="number"
                          name="reOrderLevel"
                          value={productForm.reOrderLevel}
                          onChange={(e) => updateProductForm({ reOrderLevel: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disableProductSubmit}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingProduct ? "Adding..." : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-6 hidden lg:block">
        <h3 className="text-lg font-semibold mb-6 text-gray-300">Navigation</h3>
        <nav className="space-y-2">
          {["Dashboard", "Products", "Stock-In", "Stock-Out", "Expenses", "Reports", "Settings"].map((item) => (
            <a
              key={item}
              href="#"
              className={`block py-2 px-4 rounded-lg transition-colors ${
                item === "Products" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}


