import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchDashboardAnalytics, 
  fetchSalesReport, 
  fetchRevenueStats,
  fetchOrdersThunk
} from '../store/adminSlice';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  FiDollarSign, 
  FiShoppingBag, 
  FiUsers, 
  FiStar, 
  FiAlertTriangle, 
  FiArrowUpRight,
  FiActivity
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const COLORS = ['#C5A059', '#E5C483', '#D4AF37', '#9A7B43', '#806430', '#D2B48C'];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { analytics, monthlySales, dailyRevenue, orders, loading } = useSelector((state) => state.admin);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    dispatch(fetchDashboardAnalytics());
    dispatch(fetchSalesReport());
    dispatch(fetchRevenueStats());
    dispatch(fetchOrdersThunk({ limit: 5 }));
  }, [dispatch]);

  const chartDataRevenue = dailyRevenue && dailyRevenue.length > 0
    ? dailyRevenue.map(item => ({ date: item._id, revenue: item.revenue }))
    : [];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartDataMonthly = monthlySales && monthlySales.length > 0
    ? monthlySales.map(item => ({
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        sales: item.totalSales
      })).reverse()
    : [];

  const statusPieData = analytics?.orderStatus 
    ? [
        { name: 'Processing', value: analytics.orderStatus.processing || 0 },
        { name: 'Dispatched', value: analytics.orderStatus.dispatched || 0 },
        { name: 'Out For Delivery', value: analytics.orderStatus.outForDelivery || 0 },
        { name: 'Delivered', value: analytics.orderStatus.delivered || 0 },
        { name: 'Cancelled', value: analytics.orderStatus.cancelled || 0 }
      ].filter(item => item.value > 0)
    : [];

  const pieDataToRender = statusPieData;

  const cards = [
    {
      title: 'Total Revenue',
      value: `₹${(analytics?.counters?.totalRevenue ?? 0).toLocaleString()}`,
      change: '+18.5% from last month',
      icon: FiDollarSign,
      color: 'bg-amber-500/10 text-gold-600'
    },
    {
      title: 'Total Orders',
      value: analytics?.counters?.totalOrders ?? 0,
      change: '+12.4% from last week',
      icon: FiShoppingBag,
      color: 'bg-yellow-500/10 text-gold-600'
    },
    {
      title: 'Active Customers',
      value: analytics?.counters?.totalUsers ?? 0,
      change: '+8.2% new registrations',
      icon: FiUsers,
      color: 'bg-emerald-500/10 text-emerald-600'
    },
    {
      title: 'Total Reviews',
      value: analytics?.counters?.totalReviews ?? 0,
      change: '4.8 Avg Star Rating',
      icon: FiStar,
      color: 'bg-blue-500/10 text-blue-600'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* 1. Header welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-wide text-primary m-0">
            Shambhavi Imitation Dashboard
          </h1>
          <p className="text-xs text-secondary/60 mt-1 font-sans">
            Review live retail metrics, inventory limits, and customer reviews.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white border border-gold-200/50 p-2.5 shadow-sm text-xs font-semibold uppercase tracking-wider text-gold-700">
          <FiActivity className="animate-pulse text-gold-600" size={16} />
          <span>Portal Live Status</span>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-gold-200/40 p-6 rounded-none shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider mb-2 font-sans">{card.title}</p>
                <h3 className="text-2xl font-bold text-primary font-serif tracking-wide">{card.value}</h3>
                <span className="text-[10px] font-bold text-emerald-600 mt-2 block font-sans">{card.change}</span>
              </div>
              <div className={`p-3 ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-white border border-gold-200/40 p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif text-base font-bold text-primary tracking-wide">Daily Revenue Trends</h3>
              <p className="text-[10px] text-secondary/50 uppercase tracking-wider font-semibold">Last 7 Active Sales Days</p>
            </div>
            <Link to="/orders" className="text-[10px] font-bold text-gold-600 uppercase tracking-widest hover:underline flex items-center">
              View Sales <FiArrowUpRight className="ml-1" />
            </Link>
          </div>
          <div className="h-80 w-full font-sans text-xs">
            {mounted && (
              chartDataRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartDataRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebd8" />
                    <XAxis dataKey="date" stroke="#9A7B43" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9A7B43" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #C5A059', borderRadius: 0, fontFamily: 'Inter' }}
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#C5A059" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-gold-200 text-secondary/50 font-semibold">
                  <FiDollarSign size={24} className="mb-2 text-gold-300" />
                  <span>No daily revenue records found.</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Order Status Distribution Pie Chart */}
        <div className="bg-white border border-gold-200/40 p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-serif text-base font-bold text-primary tracking-wide">Order Operations</h3>
            <p className="text-[10px] text-secondary/50 uppercase tracking-wider font-semibold">Active Pipeline Allocation</p>
          </div>
          <div className="h-60 w-full relative flex items-center justify-center font-sans text-xs">
            {mounted && (
              pieDataToRender.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieDataToRender}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieDataToRender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-gold-200 text-secondary/50 font-semibold">
                  <FiShoppingBag size={24} className="mb-2 text-gold-300" />
                  <span>No active pipeline allocation.</span>
                </div>
              )
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-secondary/70">
            {pieDataToRender.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Monthly Bar Chart and Low Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue */}
        <div className="bg-white border border-gold-200/40 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="font-serif text-base font-bold text-primary tracking-wide">Monthly Revenue</h3>
            <p className="text-[10px] text-secondary/50 uppercase tracking-wider font-semibold">Fiscal Cumulative Comparison</p>
          </div>
          <div className="h-64 w-full font-sans text-xs">
            {mounted && (
              chartDataMonthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={chartDataMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebd8" />
                    <XAxis dataKey="month" stroke="#9A7B43" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9A7B43" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #C5A059', borderRadius: 0, fontFamily: 'Inter' }}
                      formatter={(value) => [`₹${value}`, 'Sales']}
                    />
                    <Bar dataKey="sales" fill="#C5A059" radius={[2, 2, 0, 0]}>
                      {chartDataMonthly.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-gold-200 text-secondary/50 font-semibold">
                  <FiShoppingBag size={24} className="mb-2 text-gold-300" />
                  <span>No monthly sales comparison data.</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gold-200/40 p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif text-base font-bold text-primary tracking-wide flex items-center">
                <FiAlertTriangle className="text-gold-600 mr-2 animate-bounce" />
                Critical Inventory Limits
              </h3>
              <p className="text-[10px] text-secondary/50 uppercase tracking-wider font-semibold">Stock Levels Below 5 units</p>
            </div>
            <Link to="/products" className="text-[10px] font-bold text-gold-600 uppercase tracking-widest hover:underline">
              Manage Inventory
            </Link>
          </div>
          <div className="overflow-x-auto">
            {analytics?.lowStockAlerts && analytics.lowStockAlerts.length > 0 ? (
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-gold-100 text-secondary/50 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="pb-3">Design Name</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-50">
                  {analytics.lowStockAlerts.map((product) => (
                    <tr key={product._id} className="hover:bg-gold-50/10 transition-colors">
                      <td className="py-3 font-semibold text-primary">{product.name}</td>
                      <td className="py-3 font-mono text-secondary/70">{product.sku}</td>
                      <td className="py-3 text-right font-semibold">₹{product.price.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 font-bold border border-red-100 rounded-sm">
                          {product.stock} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-48 flex flex-col justify-center items-center text-secondary/50 border border-dashed border-gold-200">
                <FiShoppingBag size={24} className="mb-2 text-gold-300" />
                <p className="text-xs font-semibold">No critical inventory shortages found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Orders */}
      <div className="bg-white border border-gold-200/40 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-serif text-base font-bold text-primary tracking-wide">Recent Placed Orders</h3>
            <p className="text-[10px] text-secondary/50 uppercase tracking-wider font-semibold">Latest Pipeline Requests</p>
          </div>
          <Link to="/orders" className="text-[10px] font-bold text-gold-600 uppercase tracking-widest hover:underline">
            View All Orders
          </Link>
        </div>
        <div className="overflow-x-auto">
          {orders && orders.length > 0 ? (
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-gold-100 text-secondary/50 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Placement Date</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3 text-right">Total Price</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="hover:bg-gold-50/10 transition-colors">
                    <td className="py-3.5 font-mono text-gold-700 font-bold">{order._id.substring(18).toUpperCase()}</td>
                    <td className="py-3.5">
                      <p className="font-semibold text-primary">{order.shippingAddress?.name || order.user?.name || 'Guest'}</p>
                      <p className="text-[10px] text-secondary/50">{order.user?.email || ''}</p>
                    </td>
                    <td className="py-3.5 text-secondary/70">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                        order.isPaid 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {order.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-primary">₹{order.totalPrice.toLocaleString()}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-secondary/50">
              <p className="text-xs">No customer orders recorded in backend collections.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
