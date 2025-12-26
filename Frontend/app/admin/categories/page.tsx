"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "../../components/adminSidebar";
import AdminTopbar from "../../components/AdminTopbar";
import { usecategoryStore } from "@/app/ZustandStore/Admin/categoryStore";
import { Edit, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";

// Define Category type
interface Category {
  cId: number;
  categoryName: string;
  cDescription: string;
  cStatus: "ACTIVE" | "INACTIVE";
  icon?: string;
  iconUrl?: string;
}

export default function CategoriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Add form states
  const [categoryName, setCategoryName] = useState("");
  const [cDescription, setCDescription] = useState("");
  const [cStatus, setCStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [addIcon, setAddIcon] = useState<File | null>(null);
  const [addIconPreview, setAddIconPreview] = useState<string>("");
  
  // Edit form states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editIcon, setEditIcon] = useState<File | null | undefined>(undefined);
  const [editIconPreview, setEditIconPreview] = useState<string>("");
  const [currentEditIconUrl, setCurrentEditIconUrl] = useState<string>("");

  const { category, addCategory, getCategory, deleteCategory, updateCategory } =
    usecategoryStore();

  useEffect(() => {
    getCategory();
  }, []);

  // Handle icon file selection for add form
  const handleAddIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAddIcon(file);
      const previewUrl = URL.createObjectURL(file);
      setAddIconPreview(previewUrl);
    }
  };

  // Handle icon file selection for edit form
  const handleEditIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditIcon(file);
      const previewUrl = URL.createObjectURL(file);
      setEditIconPreview(previewUrl);
    }
  };

  // Remove icon from add form
  const removeAddIcon = () => {
    setAddIcon(null);
    setAddIconPreview("");
  };

  // Remove icon from edit form
  const removeEditIcon = () => {
    setEditIcon(null);
    setEditIconPreview("");
    // Set to null to indicate removal
    setEditIcon(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCategory(categoryName, cDescription, cStatus, addIcon || undefined);
    setShowAddModal(false);
    resetAddForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        categoryName: editCategoryName,
        cDescription: editDescription,
        cStatus: editStatus,
        icon: editIcon
      });
      setShowEditModal(false);
      resetEditForm();
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategoryId(cat.cId);
    setEditCategoryName(cat.categoryName);
    setEditDescription(cat.cDescription);
    setEditStatus(cat.cStatus);
    setCurrentEditIconUrl(cat.iconUrl || "");
    setEditIconPreview(cat.iconUrl || "");
    setEditIcon(undefined); // Reset to undefined (no change)
    setShowEditModal(true);
  };

  const handleDelete = (cId: number) => {
    setDeleteId(cId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteCategory(deleteId);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetAddForm = () => {
    setCategoryName("");
    setCDescription("");
    setCStatus("ACTIVE");
    setAddIcon(null);
    setAddIconPreview("");
  };

  const resetEditForm = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditDescription("");
    setEditStatus("ACTIVE");
    setEditIcon(undefined);
    setEditIconPreview("");
    setCurrentEditIconUrl("");
  };

  // Filter categories based on search and status
  const filteredCategories = category?.filter((cat) => {
    const matchesSearch = cat.categoryName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      cat.cDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      cat.cStatus.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalCategories = category?.length || 0;
  const activeCategories = category?.filter(cat => cat.cStatus === "ACTIVE").length || 0;
  const inactiveCategories = category?.filter(cat => cat.cStatus === "INACTIVE").length || 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden text-black">
        {/* Top Navigation Bar */}
        <div className="flex-shrink-0">
          <AdminTopbar
            title="Category Management"
            subtitle="Manage food categories and their display order"
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>
        
        {/* Main Content - Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Food Categories
              </h1>
              <p className="text-gray-600 mt-1">
                Add, edit, and organize food categories with icons
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`px-4 py-2 border rounded-lg ${
                  isReorderMode
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isReorderMode ? "Save Order" : "Reorder Categories"}
              </button>

              <button
                onClick={() => {
                  resetAddForm();
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span>+</span>
                <span>Add New Category</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-3 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <select
                  title="filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-blue-600">📁</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{totalCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-green-600">✅</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{activeCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-gray-600">⏸️</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Inactive Categories</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{inactiveCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-purple-600">📊</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Categories with Icons</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {category?.filter(cat => cat.icon).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Table with Icons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium">
                <div className="col-span-1">ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Icon</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            {filteredCategories && filteredCategories.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredCategories.map((cat) => (
                  <div key={cat.cId} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1 text-gray-800 font-medium">
                      {cat.cId}
                    </div>
                    <div className="col-span-3 text-gray-700">
                      {cat.categoryName}
                    </div>
                    <div className="col-span-3 text-gray-600">
                      {cat.cDescription || "No description"}
                    </div>
                    <div className="col-span-2">
                      {cat.iconUrl ? (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <img 
                              src={cat.iconUrl} 
                              alt={cat.categoryName}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<span class="text-gray-400">❌</span>';
                                }
                              }}
                            />
                          </div>
                          <span className="ml-2 text-xs text-gray-500">Icon</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-lg">🖼️</span>
                          </div>
                          <span className="ml-2 text-xs text-gray-500">No icon</span>
                        </div>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cat.cStatus === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {cat.cStatus}
                      </span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.cId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">📁</span>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching categories found"
                    : "No categories yet"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Get started by creating your first category"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={() => {
                      resetAddForm();
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <span>+</span>
                    <span>Create First Category</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Category Modal with Icon Upload */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add New Category
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body - Form */}
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Icon Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Icon (Optional)
                  </label>
                  <div className="flex flex-col items-center justify-center">
                    {addIconPreview ? (
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={addIconPreview} 
                            alt="Icon preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          title="Close"
                          type="button"
                          onClick={removeAddIcon}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Upload Icon</span>
                          <span className="text-xs text-gray-400 mt-1">PNG, JPG, SVG</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAddIconChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter category name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>

                {/* Category Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[100px]"
                    placeholder="Enter category description"
                    value={cDescription}
                    onChange={(e) => setCDescription(e.target.value)}
                  />
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                  title="Status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
                    value={cStatus}
                    onChange={(e) => setCStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetAddForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal with Icon Support */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Edit Category</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetEditForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body - Form */}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Icon Upload/View */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Icon
                  </label>
                  <div className="flex flex-col items-center justify-center">
                    {editIconPreview ? (
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={editIconPreview} 
                            alt="Icon preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          title="Close"
                          type="button"
                          onClick={removeEditIcon}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : currentEditIconUrl ? (
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={currentEditIconUrl} 
                            alt="Current icon"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeEditIcon}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          title="Remove icon"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Upload Icon</span>
                          <span className="text-xs text-gray-400 mt-1">PNG, JPG, SVG</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditIconChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    {!editIconPreview && !currentEditIconUrl && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Current: No icon • Click to upload
                      </p>
                    )}
                  </div>
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter category name"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                  />
                </div>

                {/* Category Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[100px]"
                    placeholder="Enter category description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    title="Status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetEditForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              {/* Modal Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Confirm Delete
                </h2>
              </div>

              {/* Modal Body */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Are you sure you want to delete this category? This action
                  cannot be undone.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
                >
                  No, Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}