"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "../../components/sellerdashboard";
import SellerHeader from "../../components/sellerHeader";
import { useMysteryBoxStore, MysteryBox } from "@/app/ZustandStore/mysteryBoxStore";
import { useProductStore } from "@/app/ZustandStore/productStore";
import { usecategoryStore } from "@/app/ZustandStore/Admin/categoryStore";

export default function MysteryBoxesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletedId, setDeletedId] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Toast state
  const [toast, setToast] = useState<{message: string; type: "success" | "error"; show: boolean} | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");

  const [selectedProducts, setSelectedProducts] = useState<{productId: number; quantity: number}[]>([]);

  // Stores
  const { sellerMysteryBoxes, loading, error, fetchSellerMysteryBoxes, addMysteryBox, deleteMysteryBox } = useMysteryBoxStore();
  const { products, fetchProducts } = useProductStore();
  const { category: dbCategories, getCategory, loading: categoriesLoading } = usecategoryStore();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => prev ? { ...prev, show: false } : null), 4000);
  };

  useEffect(() => {
    fetchSellerMysteryBoxes();
    fetchProducts();
    getCategory();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setDiscountPrice("");
    setStock("");
    setTotalValue("");
    setExpiryDate("");
    setManufactureDate("");
    setSelectedProducts([]);
  };

  const handleProductSelect = (productId: number, quantity: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      if (existing) {
        if (quantity <= 0) return prev.filter(p => p.productId !== productId);
        return prev.map(p => p.productId === productId ? { ...p, quantity } : p);
      }
      if (quantity > 0) return [...prev, { productId, quantity }];
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      showToast("Please select at least one product", "error");
      return;
    }

    try {
      await addMysteryBox({
        name,
        description,
        price,
        discountPrice,
        category,
        stock,
        totalValue,
        expiryDate,
        manufactureDate,
        productDetails: JSON.stringify(selectedProducts),
      });
      resetForm();
      setShowAddModal(false);
      fetchSellerMysteryBoxes();
      showToast("Mystery box added successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add mystery box", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deletedId) return;
    try {
      await deleteMysteryBox(deletedId);
      setShowDeleteModal(false);
      setDeletedId(null);
      showToast("Mystery box deleted successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete mystery box", "error");
    }
  };

  const activeCategories = dbCategories.filter(cat => cat.cStatus === "ACTIVE");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-black">
      <div className="fixed left-0 top-0 h-[100vh] z-30">
        <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all duration-300">
        <SellerHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Mystery Boxes"
          subtitle="Manage your surprise bundles"
        />

        {toast?.show && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`p-4 rounded shadow ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {toast.message}
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mystery Boxes</h1>
              <p className="text-gray-600">Bundle products to reduce food waste</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Mystery Box
            </button>
          </div>

          {loading && <div>Loading...</div>}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {sellerMysteryBoxes.length === 0 && !loading ? (
              <div className="text-center py-8 text-gray-500">
                No mystery boxes found. Create your first one!
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Box Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sellerMysteryBoxes.map((box) => (
                    <tr key={box.id}>
                      <td className="px-6 py-4 font-medium">{box.name}</td>
                      <td className="px-6 py-4">Rs. {box.price}</td>
                      <td className="px-6 py-4">{box.stock}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {box.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setDeletedId(box.id); setShowDeleteModal(true); }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded shadow max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Delete Box?</h2>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto flex flex-col text-black">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Create Mystery Box</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Box Name" className="w-full px-3 py-2 border rounded" required />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border rounded" required />
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (Rs.)" className="w-full px-3 py-2 border rounded" required />
                    <input type="number" value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="Estimated Total Value (Rs.)" className="w-full px-3 py-2 border rounded" required />
                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock Quantity" className="w-full px-3 py-2 border rounded" required />
                  </div>
                  
                  <div className="space-y-4">
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded" required>
                      <option value="">Select Category</option>
                      {activeCategories.map(c => <option key={c.cId} value={c.categoryName}>{c.categoryName}</option>)}
                    </select>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Expire Date</label>
                      <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full px-3 py-2 border rounded" required />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Manufacture Date (Optional)</label>
                      <input type="date" value={manufactureDate} onChange={e => setManufactureDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Select Products for this Box</h3>
                  <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                    {products.map(p => {
                      const selected = selectedProducts.find(sp => sp.productId === p.id);
                      return (
                        <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <span className="font-medium text-sm">{p.name}</span>
                            <span className="text-xs text-gray-500 ml-2">(Stock: {p.stock})</span>
                          </div>
                          <div>
                            <input 
                              type="number" 
                              min="0"
                              max={p.stock}
                              value={selected?.quantity || ""} 
                              onChange={(e) => handleProductSelect(p.id, parseInt(e.target.value) || 0)} 
                              placeholder="Qty" 
                              className="w-16 px-2 py-1 border rounded text-right" 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 border-t flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded">Create Box</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
