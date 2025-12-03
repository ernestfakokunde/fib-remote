 import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AiOutlinePlus } from "react-icons/ai";
import { useGlobalContext } from "../context/context";
import AddProductModal from "../components/AddProductModal";

const Products = () => {
  const { getProducts } = useGlobalContext();
  const [products, setProducts] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Products</h1>
        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <AiOutlinePlus /> Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 font-semibold">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Selling</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((p) => (
                <tr key={p._id} className="border-b">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.category?.name}</td>
                  <td className="p-3">${p.costPrice}</td>
                  <td className="p-3">${p.sellingPrice}</td>
                  <td className="p-3">{p.quantity}</td>
                  <td
                    className={`p-3 font-bold ${
                      p.stockStatus === "Low Stock"
                        ? "text-yellow-600"
                        : p.stockStatus === "Out of Stock"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {p.stockStatus}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-4 text-center" colSpan="6">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add Product */}
      {openModal && (
        <AddProductModal
          fetchProducts={fetchProducts}
          onClose={() => setOpenModal(false)}
        />
      )}
    </div>
  );
};

export default Products;
