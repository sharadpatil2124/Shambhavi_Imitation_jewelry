import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import adminService from '../services/adminService';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiX, 
  FiUpload, 
  FiFolder
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null // File object
  });
  const [existingImage, setExistingImage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      description: "",
      image: null
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      toast.warning("Please upload a category catalog cover image.");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("image", formData.image);

    setLoading(true);
    try {
      const response = await adminService.createCategory(data);
      if (response.success) {
        toast.success("New jewelry category created successfully.");
        setIsAddOpen(false);
        loadCategories();
      }
    } catch (error) {
      toast.error(error.message || "Failed to create category.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setExistingImage(category.image || "");
    setFormData({
      name: category.name,
      description: category.description || "",
      image: null
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    
    if (formData.image) {
      data.append("image", formData.image);
    } else {
      data.append("image", existingImage);
    }

    setLoading(true);
    try {
      const response = await adminService.updateCategory(selectedCategory._id, data);
      if (response.success) {
        toast.success("Category details updated successfully.");
        setIsEditOpen(false);
        loadCategories();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? All designs linked to this category might lose their category group assignment.")) {
      try {
        const response = await adminService.deleteCategory(id);
        if (response.success) {
          toast.success("Category deleted successfully.");
          loadCategories();
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete category.");
      }
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Jewelry Categories</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Manage catalog collections, descriptions, and cover graphics.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-5 text-xs tracking-wider uppercase transition-colors flex items-center shrink-0 cursor-pointer"
        >
          <FiPlus className="mr-2" size={16} /> Add Category
        </button>
      </div>

      {/* Search panel */}
      <div className="bg-white border border-gold-200/50 p-4 shadow-[0_2px_12px_rgba(240,235,220,0.08)] max-w-md">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name..."
            className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-12 pr-4 text-xs font-sans outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-secondary/60">Loading jewelry categories...</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div 
              key={category._id} 
              className="bg-white border border-gold-200/40 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-[0_4px_15px_rgba(240,235,220,0.3)] transition-all duration-300 group"
            >
              {/* Category cover image */}
              <div className="h-44 overflow-hidden relative border-b border-gold-100">
                <img 
                  src={category.image || 'https://via.placeholder.com/400x200?text=No+Image'} 
                  alt={category.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                  <h3 className="font-serif text-lg font-bold text-white tracking-wide m-0 drop-shadow-sm">{category.name}</h3>
                </div>
              </div>

              {/* Category details & actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-secondary/70 leading-relaxed font-sans min-h-[40px]">
                  {category.description || 'No description comments added for this jewelry collection category.'}
                </p>
                
                <div className="flex items-center justify-between border-t border-gold-50/80 pt-3">
                  <span className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider">
                    Slug: {category.slug}
                  </span>
                  <div className="flex space-x-2 text-xs">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex items-center text-gold-700 hover:text-primary transition-colors py-1 px-2.5 bg-[#FAF8F2] border border-gold-200/40 rounded-sm font-semibold cursor-pointer"
                    >
                      <FiEdit className="mr-1.5" size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="flex items-center text-red-650 hover:text-red-700 transition-colors py-1 px-2.5 bg-red-50/50 border border-red-200/30 rounded-sm font-semibold cursor-pointer"
                    >
                      <FiTrash2 className="mr-1.5" size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-secondary/50 border border-dashed border-gold-200">
          <FiFolder size={32} className="mx-auto mb-2 text-gold-300" />
          <p className="text-sm font-semibold">No jewelry categories found.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-md w-full rounded-none animate-scale-up">
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-primary tracking-wide">Create Jewelry Category</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 font-sans text-xs">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Necklaces, Earrings, Bangles..."
                  className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                />
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Description Comments</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the luxury collection..."
                  className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none resize-none"
                ></textarea>
              </div>

              {/* Cover image upload */}
              <div className="text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Cover Image (single photo) *</label>
                <div className="border-2 border-dashed border-gold-300 bg-[#FAF9F5] p-5 text-center relative hover:bg-gold-50/20 transition-colors">
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FiUpload className="mx-auto mb-2 text-gold-600" size={20} />
                  <p className="font-semibold text-primary">Upload catalog cover picture</p>
                </div>

                {formData.image && (
                  <div className="mt-3 p-1.5 border border-gold-200 flex items-center justify-between bg-[#FAF8F2]">
                    <span className="truncate max-w-[200px] font-mono text-[10px] text-secondary/70">{formData.image.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null })}
                      className="text-red-550 hover:text-red-700 cursor-pointer"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gold-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-transparent hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-2 px-5 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-gold-600 text-white font-bold py-2 px-5 uppercase tracking-wider cursor-pointer"
                >
                  {loading ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-md w-full rounded-none animate-scale-up">
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-primary tracking-wide">Edit Category Details</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 font-sans text-xs">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                />
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Description Comments</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none resize-none"
                ></textarea>
              </div>

              {/* Cover image replace */}
              <div className="text-left">
                {existingImage && !formData.image && (
                  <div className="mb-3">
                    <span className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Current Cover Picture</span>
                    <img src={existingImage} alt="cover" className="w-full h-24 object-cover border border-gold-200 shadow-sm" />
                  </div>
                )}

                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Replace Cover Image</label>
                <div className="border-2 border-dashed border-gold-300 bg-[#FAF9F5] p-5 text-center relative hover:bg-gold-50/20 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FiUpload className="mx-auto mb-2 text-gold-600" size={20} />
                  <p className="font-semibold text-primary">Upload replacement photo</p>
                </div>

                {formData.image && (
                  <div className="mt-3 p-1.5 border border-gold-200 flex items-center justify-between bg-[#FAF8F2]">
                    <span className="truncate max-w-[200px] font-mono text-[10px] text-secondary/70">{formData.image.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null })}
                      className="text-red-550 hover:text-red-700 cursor-pointer"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gold-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-transparent hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-2 px-5 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-gold-600 text-white font-bold py-2 px-5 uppercase tracking-wider cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
