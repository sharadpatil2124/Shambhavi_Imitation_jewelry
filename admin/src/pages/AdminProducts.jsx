import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import adminService from '../services/adminService';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiFilter, 
  FiEye, 
  FiX, 
  FiUpload, 
  FiTrendingUp,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState(""); // "low", "out", "in"
  const [marketingFilter, setMarketingFilter] = useState(""); // "trending", "new"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    originalPrice: "",
    description: "",
    details: "",
    colors: "",
    sizes: "",
    weight: "",
    finishType: "",
    stock: "",
    isTrending: false,
    isNewArrival: false,
    images: [] // Selected files
  });

  const [existingImages, setExistingImages] = useState([]); // Images currently on server (during edit)

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, categoryFilter, stockFilter, marketingFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        category: categoryFilter
      };

      if (marketingFilter === 'trending') params.isTrending = 'true';
      if (marketingFilter === 'new') params.isNewArrival = 'true';

      const response = await productService.getProducts(params);
      if (response.success) {
        let filtered = response.products;
        
        // Manual stock filters since MERN backend GET /api/products might not support stock level filtering
        if (stockFilter === 'low') {
          filtered = filtered.filter(p => p.stock > 0 && p.stock < 5);
        } else if (stockFilter === 'out') {
          filtered = filtered.filter(p => p.stock === 0);
        } else if (stockFilter === 'in') {
          filtered = filtered.filter(p => p.stock >= 5);
        }

        setProducts(filtered);
        setTotalPages(response.pages);
        setTotalProducts(response.total);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load products list.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error("Failed to load categories dropdown:", error.message);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStockFilter("");
    setMarketingFilter("");
    setPage(1);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, images: [...formData.images, ...files] });
  };

  const removeSelectedFile = (index) => {
    const updatedFiles = [...formData.images];
    updatedFiles.splice(index, 1);
    setFormData({ ...formData, images: updatedFiles });
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      originalPrice: "",
      description: "",
      details: "",
      colors: "",
      sizes: "",
      weight: "",
      finishType: "",
      stock: "",
      isTrending: false,
      isNewArrival: false,
      images: []
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      toast.warning("Please upload at least one image asset for the product.");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("sku", formData.sku);
    data.append("category", formData.category);
    data.append("price", formData.price);
    data.append("originalPrice", formData.originalPrice);
    data.append("description", formData.description);
    data.append("details", formData.details);
    data.append("colors", formData.colors);
    data.append("sizes", formData.sizes);
    data.append("weight", formData.weight);
    data.append("finishType", formData.finishType);
    data.append("stock", formData.stock);
    data.append("isTrending", formData.isTrending);
    data.append("isNewArrival", formData.isNewArrival);
    
    formData.images.forEach(file => {
      data.append("images", file);
    });

    setLoading(true);
    try {
      const response = await adminService.createProduct(data);
      if (response.success) {
        toast.success("Product masterpiece listed successfully.");
        setIsAddOpen(false);
        loadProducts();
      }
    } catch (error) {
      toast.error(error.message || "Failed to list product.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setExistingImages(product.images || []);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?._id || product.category || "",
      price: product.price,
      originalPrice: product.originalPrice,
      description: product.description,
      details: product.details?.join(', ') || "",
      colors: product.colors?.join(', ') || "",
      sizes: product.sizes?.join(', ') || "",
      weight: product.weight || "",
      finishType: product.finishType || "",
      stock: product.stock,
      isTrending: product.isTrending,
      isNewArrival: product.isNewArrival,
      images: [] // New files to add
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("sku", formData.sku);
    data.append("category", formData.category);
    data.append("price", formData.price);
    data.append("originalPrice", formData.originalPrice);
    data.append("description", formData.description);
    data.append("details", formData.details);
    data.append("colors", formData.colors);
    data.append("sizes", formData.sizes);
    data.append("weight", formData.weight);
    data.append("finishType", formData.finishType);
    data.append("stock", formData.stock);
    data.append("isTrending", formData.isTrending);
    data.append("isNewArrival", formData.isNewArrival);

    // If new files are uploaded, append them
    if (formData.images.length > 0) {
      formData.images.forEach(file => {
        data.append("images", file);
      });
    } else {
      // Send existing images back if no new ones are provided
      existingImages.forEach(img => {
        data.append("images", img);
      });
    }

    setLoading(true);
    try {
      const response = await adminService.updateProduct(selectedProduct._id, data);
      if (response.success) {
        toast.success("Product details updated successfully.");
        setIsEditOpen(false);
        loadProducts();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this jewelry masterpiece? This action is permanent.")) {
      try {
        const response = await adminService.deleteProduct(id);
        if (response.success) {
          toast.success("Product deleted successfully.");
          loadProducts();
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete product.");
      }
    }
  };

  const openPreviewModal = (product) => {
    setSelectedProduct(product);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Jewelry Masterpieces</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Manage luxury jewelry listings, finish types, weight details, and inventory stock.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-5 text-xs tracking-wider uppercase transition-colors flex items-center shrink-0 cursor-pointer"
        >
          <FiPlus className="mr-2" size={16} /> Add Product
        </button>
      </div>

      {/* Search and Filter Panel */}
      <div className="bg-white border border-gold-200/50 p-5 shadow-[0_2px_12px_rgba(240,235,220,0.1)]">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU code, name, or comments..."
              className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-12 pr-4 text-xs font-sans outline-none focus:border-gold-500"
            />
          </div>

          {/* Category selection */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 px-4 text-xs font-sans outline-none focus:border-gold-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            {/* Search Button */}
            <button
              type="submit"
              className="flex-1 bg-gold-600 hover:bg-primary text-white font-bold py-2.5 px-4 text-xs tracking-wider uppercase transition-colors text-center cursor-pointer"
            >
              Apply Search
            </button>
            
            {/* Reset Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-transparent hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-2.5 px-3 text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Extended filters */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gold-100 text-xs font-sans text-secondary/70">
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gold-500" />
            <span className="font-semibold">Stock Status:</span>
            <button 
              onClick={() => setStockFilter(stockFilter === 'low' ? '' : 'low')}
              className={`px-3 py-1 border transition-colors ${stockFilter === 'low' ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold' : 'bg-white border-gold-200 hover:bg-gold-50/20'}`}
            >
              Low Stock (&lt;5)
            </button>
            <button 
              onClick={() => setStockFilter(stockFilter === 'out' ? '' : 'out')}
              className={`px-3 py-1 border transition-colors ${stockFilter === 'out' ? 'bg-red-50 text-red-700 border-red-300 font-bold' : 'bg-white border-gold-200 hover:bg-gold-50/20'}`}
            >
              Out of Stock
            </button>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <span className="font-semibold">Marketing Flags:</span>
            <button 
              onClick={() => setMarketingFilter(marketingFilter === 'trending' ? '' : 'trending')}
              className={`px-3 py-1 border transition-colors ${marketingFilter === 'trending' ? 'bg-gold-600 text-white border-gold-600 font-bold' : 'bg-white border-gold-200 hover:bg-gold-50/20'}`}
            >
              Trending Design
            </button>
            <button 
              onClick={() => setMarketingFilter(marketingFilter === 'new' ? '' : 'new')}
              className={`px-3 py-1 border transition-colors ${marketingFilter === 'new' ? 'bg-primary text-white border-primary font-bold' : 'bg-white border-gold-200 hover:bg-gold-50/20'}`}
            >
              New Arrival
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gold-200/40 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-secondary/60">Loading luxury catalog...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#FAF8F2] border-b border-gold-150 text-secondary/60 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4 w-20">Image</th>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Finish & Weight</th>
                  <th className="p-4 text-right">Retail Price</th>
                  <th className="p-4 text-center">Inventory</th>
                  <th className="p-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50">
                {products.map((product) => {
                  const imageSrc = product.images?.[0] || 'https://via.placeholder.com/60?text=No+Image';
                  const isLowStock = product.stock > 0 && product.stock < 5;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <tr key={product._id} className="hover:bg-gold-50/10 transition-colors">
                      <td className="p-4">
                        <img 
                          src={imageSrc} 
                          alt={product.name} 
                          className="w-12 h-12 object-cover border border-gold-200 shadow-sm"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <span className="font-serif text-sm font-bold text-primary block leading-none">{product.name}</span>
                          {product.isTrending && <span className="bg-amber-100 text-gold-700 px-1.5 py-0.2 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center shrink-0"><FiTrendingUp className="mr-0.5" /> Trending</span>}
                          {product.isNewArrival && <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center shrink-0"><FiZap className="mr-0.5" /> New</span>}
                        </div>
                        <p className="text-[10px] text-secondary/60 truncate max-w-xs">{product.description}</p>
                      </td>
                      <td className="p-4 font-mono text-secondary/80 font-bold">{product.sku}</td>
                      <td className="p-4 font-semibold text-secondary/80">{product.category?.name || 'Unassigned'}</td>
                      <td className="p-4">
                        <p className="font-semibold text-secondary/80">{product.finishType || 'Gold Plated'}</p>
                        <p className="text-[10px] text-secondary/50">{product.weight || 'N/A'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-primary">₹{product.price.toLocaleString()}</p>
                        {product.originalPrice > product.price && (
                          <p className="text-[10px] text-secondary/40 line-through">₹{product.originalPrice.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                          isOutOfStock ? 'bg-red-50 text-red-600 border-red-100' :
                          isLowStock ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' :
                           isLowStock ? `Low (${product.stock})` :
                           `${product.stock} units`}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2.5">
                          <button
                            onClick={() => openPreviewModal(product)}
                            className="text-secondary/60 hover:text-gold-600 transition-colors p-1 font-sans cursor-pointer"
                            title="Preview Masterpiece"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-secondary/60 hover:text-gold-600 transition-colors p-1 font-sans cursor-pointer"
                            title="Edit Attributes"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-secondary/60 hover:text-red-600 transition-colors p-1 font-sans cursor-pointer"
                            title="Delete permanently"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-secondary/50">
            <FiShoppingBag size={30} className="mx-auto mb-2 text-gold-300" />
            <p className="text-sm">No jewelry listings matched your filters.</p>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="bg-[#FAF8F2] border-t border-gold-200/50 px-6 py-4 flex items-center justify-between font-sans text-xs">
            <span className="text-secondary/60 font-semibold">
              Showing page <strong className="text-primary">{page}</strong> of <strong className="text-primary">{totalPages}</strong>
            </span>
            <div className="flex space-x-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-white border border-gold-250 p-2 text-gold-600 disabled:opacity-40 hover:bg-gold-50 cursor-pointer rounded-sm"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="bg-white border border-gold-250 p-2 text-gold-600 disabled:opacity-40 hover:bg-gold-50 cursor-pointer rounded-sm"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. ADD PRODUCT MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-none animate-scale-up">
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-serif text-lg font-bold text-primary tracking-wide">Add Jewelry Product</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Design Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Classic Temple Work Kasu Mala"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="KASU-MALA-001"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Category *</label>
                  {categories.length === 0 ? (
                    <div className="text-xs text-red-650 bg-red-50/50 p-2.5 border border-red-200/35 flex items-center justify-between font-sans">
                      <span>No categories found.</span>
                      <Link 
                        to="/categories" 
                        onClick={() => { setIsAddOpen(false); }}
                        className="text-gold-700 hover:text-primary underline font-bold uppercase text-[9px] tracking-wider"
                      >
                        Create One
                      </Link>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none text-secondary"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Finish Type (e.g. Gold Plated)</label>
                  <input
                    type="text"
                    value={formData.finishType}
                    onChange={(e) => setFormData({ ...formData, finishType: e.target.value })}
                    placeholder="22k Matte Gold Finish"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Weight (e.g. 45 grams)</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Approx. 35g"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Retail Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="4500"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Original Strike price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="5999"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Stock Count *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="15"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Masterpiece Description *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the jewelry..."
                  className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Bullet Details (Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Gold plating, Kemp stones, Adjustable thread"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Colors Available (Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Ruby Red, Emerald Green, Golden"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Sizes Available (Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="Adjustable, 2.4, 2.6, 2.8"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 py-2 bg-[#FAF8F2] border border-gold-200/50 px-4">
                <label className="flex items-center font-bold tracking-wider uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="mr-2 accent-gold-600 cursor-pointer"
                  />
                  Trending Design
                </label>
                <label className="flex items-center font-bold tracking-wider uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="mr-2 accent-gold-600 cursor-pointer"
                  />
                  New Arrival
                </label>
              </div>

              {/* Graphic upload drag and drop */}
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Product Graphics Assets (Upload max 5) *</label>
                <div className="border-2 border-dashed border-gold-300 bg-[#FAF9F5] p-5 text-center relative hover:bg-gold-50/20 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FiUpload className="mx-auto mb-2 text-gold-600" size={24} />
                  <p className="font-semibold text-primary">Drag & drop files here or click to pick</p>
                  <p className="text-[10px] text-secondary/50 mt-1">PNG, JPG, JPEG formats accepted</p>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {formData.images.map((file, idx) => (
                      <div key={idx} className="relative border border-gold-200 p-1 bg-white">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-full h-16 object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md cursor-pointer"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gold-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-transparent hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-2.5 px-6 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-6 uppercase tracking-wider cursor-pointer"
                >
                  {loading ? "Saving Masterpiece..." : "List Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT PRODUCT MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-none animate-scale-up">
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-serif text-lg font-bold text-primary tracking-wide">Edit Product Attributes</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Design Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Classic Temple Work Kasu Mala"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="KASU-MALA-001"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Category *</label>
                  {categories.length === 0 ? (
                    <div className="text-xs text-red-650 bg-red-50/50 p-2.5 border border-red-200/35 flex items-center justify-between font-sans">
                      <span>No categories found.</span>
                      <Link 
                        to="/categories" 
                        onClick={() => { setIsEditOpen(false); }}
                        className="text-gold-700 hover:text-primary underline font-bold uppercase text-[9px] tracking-wider"
                      >
                        Create One
                      </Link>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none text-secondary"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Finish Type</label>
                  <input
                    type="text"
                    value={formData.finishType}
                    onChange={(e) => setFormData({ ...formData, finishType: e.target.value })}
                    placeholder="22k Matte Gold Finish"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Approx. 35g"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Retail Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Original Price (Strikeout) *</label>
                  <input
                    type="number"
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Stock Count *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Description *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Bullet Details</label>
                  <input
                    type="text"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Colors</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Sizes</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 py-2 bg-[#FAF8F2] border border-gold-200/50 px-4">
                <label className="flex items-center font-bold tracking-wider uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="mr-2 accent-gold-600 cursor-pointer"
                  />
                  Trending Design
                </label>
                <label className="flex items-center font-bold tracking-wider uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="mr-2 accent-gold-600 cursor-pointer"
                  />
                  New Arrival
                </label>
              </div>

              {/* Existing Images Display */}
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Currently Saved Images</label>
                  <div className="grid grid-cols-5 gap-3">
                    {existingImages.map((img, idx) => (
                      <div key={idx} className="relative border border-gold-200 p-1 bg-white">
                        <img src={img} alt="saved" className="w-full h-16 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setExistingImages(existingImages.filter((_, i) => i !== idx));
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md cursor-pointer"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File additions */}
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Upload New / Replacement Images</label>
                <div className="border-2 border-dashed border-gold-300 bg-[#FAF9F5] p-5 text-center relative hover:bg-gold-50/20 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FiUpload className="mx-auto mb-2 text-gold-600" size={24} />
                  <p className="font-semibold text-primary">Select images to add</p>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {formData.images.map((file, idx) => (
                      <div key={idx} className="relative border border-gold-200 p-1 bg-white">
                        <img src={URL.createObjectURL(file)} alt="new preview" className="w-full h-16 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md cursor-pointer"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gold-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-transparent hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-2.5 px-6 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-6 uppercase tracking-wider cursor-pointer"
                >
                  {loading ? "Updating Masterpiece..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRODUCT DETAIL PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isPreviewOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-2xl w-full rounded-none animate-scale-up overflow-hidden">
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gold-600 uppercase font-sans">Masterpiece Spec Sheet</span>
              <button onClick={() => setIsPreviewOpen(false)} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans text-xs">
              {/* Left Images Carousel */}
              <div className="space-y-4">
                <img 
                  src={selectedProduct.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'} 
                  alt={selectedProduct.name} 
                  className="w-full h-64 object-cover border border-gold-200 shadow-sm"
                />
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.images?.slice(1, 5).map((img, index) => (
                    <img key={index} src={img} alt="alt" className="w-full h-12 object-cover border border-gold-100" />
                  ))}
                </div>
              </div>

              {/* Right Specifications */}
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gold-600 block">{selectedProduct.category?.name || 'Category'}</span>
                  <h2 className="font-serif text-xl font-bold tracking-wide text-primary m-0 mt-1">{selectedProduct.name}</h2>
                  <p className="text-[11px] font-mono text-secondary/50 mt-0.5">SKU: {selectedProduct.sku}</p>
                </div>

                <div className="pb-3 border-b border-gold-100">
                  <span className="text-[10px] text-secondary/50 block">Pricing Matrix</span>
                  <span className="text-xl font-bold text-primary mr-2">₹{selectedProduct.price.toLocaleString()}</span>
                  {selectedProduct.originalPrice > selectedProduct.price && (
                    <span className="text-xs text-secondary/40 line-through">₹{selectedProduct.originalPrice.toLocaleString()}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 py-1 text-secondary/80 font-medium">
                  <div>
                    <span className="text-[10px] text-secondary/50 block font-normal">Finish Type</span>
                    <span>{selectedProduct.finishType || 'Gold Plated'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-secondary/50 block font-normal">Net Weight</span>
                    <span>{selectedProduct.weight || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-secondary/50 block font-normal">Stock Level</span>
                    <span className={selectedProduct.stock === 0 ? 'text-red-600 font-bold' : 'text-primary'}>
                      {selectedProduct.stock} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-secondary/50 block font-normal">Stars rating</span>
                    <span className="flex items-center text-gold-600 font-bold font-sans">
                      {selectedProduct.rating} / 5.0
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-secondary/50 block">Product Story</span>
                  <p className="text-secondary/70 leading-relaxed mt-1 text-[11px] max-h-24 overflow-y-auto pr-1">
                    {selectedProduct.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF8F2] border-t border-gold-150 p-4 flex justify-end">
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="bg-primary hover:bg-gold-600 text-white font-bold py-2 px-5 uppercase tracking-wider cursor-pointer font-sans text-xs"
              >
                Close specs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
