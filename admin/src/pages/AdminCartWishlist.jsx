import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartWishlistAnalytics } from '../store/adminSlice';
import { 
  FiHeart, 
  FiShoppingBag, 
  FiDollarSign, 
  FiClock, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiTrendingUp, 
  FiEye, 
  FiX, 
  FiAlertTriangle 
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminCartWishlist() {
  const dispatch = useDispatch();
  const { cartWishlist, loading } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("carts"); // 'carts', 'wishlists', 'popular'
  const [selectedCart, setSelectedCart] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCartWishlistAnalytics())
      .unwrap()
      .catch((err) => {
        toast.error(err || "Failed to load cart & wishlist analytics.");
      });
  }, [dispatch]);

  const { wishlistAnalytics = [], cartAnalytics = {} } = cartWishlist || {};
  const { totalCarts = 0, totalValue = 0, totalItems = 0, popularItems = [], cartsList = [] } = cartAnalytics;

  const openCartDetails = (cart) => {
    setSelectedCart(cart);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCart(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Cart & Wishlist Analytics</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Analyze popular wishlist designs, customer shopping bags, and potential abandoned checkout revenue.</p>
        </div>
      </div>

      {/* Cart Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gold-200/40 p-5 shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-gold-600 border border-gold-200/30">
            <FiShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider font-sans">Active Shopping Bags</p>
            <h4 className="text-xl font-bold text-primary font-serif tracking-wide">{totalCarts} Carts</h4>
          </div>
        </div>

        <div className="bg-white border border-gold-200/40 p-5 shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100">
            <FiDollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider font-sans">Abandoned Cart Value</p>
            <h4 className="text-xl font-bold text-primary font-serif tracking-wide">{formatCurrency(totalValue)}</h4>
          </div>
        </div>

        <div className="bg-white border border-gold-200/40 p-5 shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FiTrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider font-sans">Unpurchased Articles</p>
            <h4 className="text-xl font-bold text-primary font-serif tracking-wide">{totalItems} Jewelry Pieces</h4>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gold-200 flex space-x-6 text-xs uppercase tracking-wider font-bold">
        <button
          onClick={() => setActiveTab("carts")}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === "carts" ? "border-gold-500 text-gold-600" : "border-transparent text-secondary/60 hover:text-primary"
          }`}
        >
          Abandoned Carts Ledger ({cartsList.length})
        </button>
        <button
          onClick={() => setActiveTab("wishlists")}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === "wishlists" ? "border-gold-500 text-gold-600" : "border-transparent text-secondary/60 hover:text-primary"
          }`}
        >
          Most Wishlisted Designs ({wishlistAnalytics.length})
        </button>
        <button
          onClick={() => setActiveTab("popular")}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === "popular" ? "border-gold-500 text-gold-600" : "border-transparent text-secondary/60 hover:text-primary"
          }`}
        >
          Popular In-Cart Items ({popularItems.length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-secondary/60">Fetching collection statistics...</p>
        </div>
      )}

      {/* TAB 1: Abandoned Carts Ledger */}
      {!loading && activeTab === "carts" && (
        cartsList.length > 0 ? (
          <div className="bg-white border border-gold-200/40 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-gold-100 bg-[#FAF8F2] text-secondary/50 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Customer Details</th>
                    <th className="p-4 text-center">Total Items</th>
                    <th className="p-4 text-right">Estimated Value</th>
                    <th className="p-4">Last Active Time</th>
                    <th className="p-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-50 text-secondary">
                  {cartsList.map((cart) => (
                    <tr key={cart._id} className="hover:bg-gold-50/10 transition-colors">
                      <td className="p-4">
                        {cart.user ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 font-serif font-bold flex items-center justify-center border border-gold-200/40">
                              {cart.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-primary">{cart.user.name}</p>
                              <span className="text-[10px] text-secondary/50 block">{cart.user.email}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-secondary/40 font-medium">Guest Cart</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 bg-[#FAF8F2] border border-gold-200/50 font-bold font-mono">
                          {cart.itemsCount}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-primary">
                        {formatCurrency(cart.total)}
                      </td>
                      <td className="p-4 text-secondary/70">
                        <p className="flex items-center">
                          <FiClock className="mr-1.5 text-gold-400" size={12} />
                          {new Date(cart.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openCartDetails(cart)}
                          className="inline-flex items-center justify-center p-2 bg-[#FAF8F2] border border-gold-200 hover:bg-gold-50 text-gold-700 hover:text-gold-800 transition-colors font-semibold cursor-pointer rounded-sm text-xs"
                        >
                          <FiEye size={13} className="mr-1" /> View Items
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-secondary/50 border border-dashed border-gold-200 bg-white">
            <FiShoppingBag size={32} className="mx-auto mb-2 text-gold-300" />
            <p className="text-sm font-semibold">No active shopping carts found in the database.</p>
          </div>
        )
      )}

      {/* TAB 2: Most Wishlisted Designs */}
      {!loading && activeTab === "wishlists" && (
        wishlistAnalytics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistAnalytics.map((item, idx) => {
              const product = item._id;
              if (!product) return null;
              return (
                <div key={idx} className="bg-white border border-gold-200/40 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                  <div className="flex space-x-4">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'} 
                      alt={product.name} 
                      className="w-20 h-20 object-cover border border-gold-100 rounded-sm shrink-0"
                    />
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center space-x-1 text-gold-600 font-bold text-xs uppercase tracking-wider">
                        <FiHeart fill="currentColor" size={12} />
                        <span>{item.count} Wishlists</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-primary truncate" title={product.name}>{product.name}</h4>
                      <p className="text-[10px] font-mono text-secondary/50">SKU: {product.sku}</p>
                      <p className="font-bold text-primary text-xs">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                  <div className="border-t border-gold-50 mt-4 pt-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-secondary/50">Stock Available:</span>
                    <span className={`px-2 py-0.5 rounded-sm ${
                      product.stock > 10 ? 'bg-emerald-50 text-emerald-600' :
                      product.stock > 0 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-secondary/50 border border-dashed border-gold-200 bg-white">
            <FiHeart size={32} className="mx-auto mb-2 text-gold-300" />
            <p className="text-sm font-semibold">No products have been added to wishlists yet.</p>
          </div>
        )
      )}

      {/* TAB 3: Popular In-Cart Items */}
      {!loading && activeTab === "popular" && (
        popularItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularItems.map((item, idx) => {
              const product = item._id;
              if (!product) return null;
              return (
                <div key={idx} className="bg-white border border-gold-200/40 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                  <div className="flex space-x-4">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'} 
                      alt={product.name} 
                      className="w-20 h-20 object-cover border border-gold-100 rounded-sm shrink-0"
                    />
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center space-x-1 text-gold-600 font-bold text-xs uppercase tracking-wider">
                        <FiShoppingBag size={12} />
                        <span>Qty in Carts: {item.count}</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-primary truncate" title={product.name}>{product.name}</h4>
                      <p className="text-[10px] font-mono text-secondary/50">SKU: {product.sku}</p>
                      <p className="font-bold text-primary text-xs">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                  <div className="border-t border-gold-50 mt-4 pt-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-secondary/50">Stock Available:</span>
                    <span className={`px-2 py-0.5 rounded-sm ${
                      product.stock > 10 ? 'bg-emerald-50 text-emerald-600' :
                      product.stock > 0 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-secondary/50 border border-dashed border-gold-200 bg-white">
            <FiShoppingBag size={32} className="mx-auto mb-2 text-gold-300" />
            <p className="text-sm font-semibold">No products are currently in customer shopping carts.</p>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* ITEM DETAILS MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && selectedCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-lg w-full rounded-none animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold text-primary tracking-wide">Customer Cart Contents</h3>
                <p className="text-[9px] text-secondary/60 uppercase tracking-widest font-sans mt-0.5">Itemized Checkout Analytics</p>
              </div>
              <button onClick={closeModal} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer p-1">
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-left">
              
              {/* Customer Contact */}
              {selectedCart.user && (
                <div className="bg-[#FAF9F5] border border-gold-200/30 p-3.5 space-y-1.5 text-xs text-secondary">
                  <p className="font-bold text-primary text-xs flex items-center">
                    <FiUser className="mr-2 text-gold-600" size={13} /> {selectedCart.user.name}
                  </p>
                  <p className="flex items-center text-[11px]">
                    <FiMail className="mr-2 text-gold-500" size={12} /> {selectedCart.user.email}
                  </p>
                  {selectedCart.user.phone && (
                    <p className="flex items-center text-[10px]">
                      <FiPhone className="mr-2 text-gold-500" size={11} /> {selectedCart.user.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-bold text-secondary uppercase tracking-wider font-sans border-b border-gold-100 pb-1">Unpurchased Bags Details</h5>
                <div className="divide-y divide-gold-50">
                  {selectedCart.items?.map((item, idx) => (
                    <div key={idx} className="py-3 flex space-x-4 items-center justify-between text-xs">
                      <div className="flex space-x-3 items-center overflow-hidden">
                        <img 
                          src={item.product?.images?.[0] || 'https://via.placeholder.com/60?text=No+Image'} 
                          alt={item.product?.name || 'Item'} 
                          className="w-12 h-12 object-cover border border-gold-100/50 rounded-sm shrink-0"
                        />
                        <div className="truncate">
                          <h6 className="font-semibold text-primary truncate max-w-[200px]" title={item.product?.name}>{item.product?.name || 'Deleted Product'}</h6>
                          <div className="flex space-x-2 text-[9px] font-bold uppercase tracking-wider text-secondary/50 mt-0.5">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </div>
                          {item.product?.stock < item.quantity && (
                            <span className="inline-flex items-center text-[9px] font-bold text-amber-600 mt-1">
                              <FiAlertTriangle className="mr-1" /> Exceeds stock (available: {item.product?.stock})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-primary">{item.quantity} x {formatCurrency(item.product?.price || 0)}</p>
                        <p className="text-[10px] font-bold text-gold-700">Subtotal: {formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF8F2] border-t border-gold-100 p-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-secondary/50 uppercase block">Cart Value Summary</span>
                <strong className="text-base text-primary font-serif font-bold">{formatCurrency(selectedCart.total)}</strong>
              </div>
              <button
                onClick={closeModal}
                className="bg-primary hover:bg-gold-600 text-white font-bold py-2 px-5 text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
