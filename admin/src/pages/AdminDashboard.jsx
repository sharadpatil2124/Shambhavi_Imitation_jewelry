import { useEffect, useState } from 'react';
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
  FiActivity,
  FiRotateCcw
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const COLORS = ['#F59E0B', '#6366F1', '#3B82F6', '#0EA5E9', '#10B981', '#EF4444', '#F43F5E', '#A855F7'];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { analytics, monthlySales, dailyRevenue, orders } = useSelector((state) => state.admin);
  const [mounted, setMounted] = useState(false);
  const [revenueTab, setRevenueTab] = useState('daily'); // 'daily' | 'monthly'

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

  const allStatusList = analytics?.orderStatus 
    ? [
        { name: 'Pending', value: analytics.orderStatus.pending || 0, color: '#F59E0B' },
        { name: 'Confirmed', value: analytics.orderStatus.confirmed || 0, color: '#6366F1' },
        { name: 'Processing', value: analytics.orderStatus.processing || 0, color: '#3B82F6' },
        { name: 'Shipped', value: analytics.orderStatus.shipped || 0, color: '#0EA5E9' },
        { name: 'Delivered', value: analytics.orderStatus.delivered || 0, color: '#10B981' },
        { name: 'Cancelled', value: analytics.orderStatus.cancelled || 0, color: '#EF4444' },
        { name: 'Cancellation Requested', value: analytics.orderStatus.cancellationRequested || 0, color: '#F43F5E' },
        { name: 'Refunded', value: analytics.orderStatus.refunded || 0, color: '#A855F7' }
      ]
    : [];

  const statusPieData = allStatusList.filter(item => item.value > 0);
  const pieDataToRender = statusPieData;

  const cards = [
    {
      title: 'Net Revenue',
      value: `₹${(analytics?.counters?.totalRevenue ?? 0).toLocaleString()}`,
      change: analytics?.counters?.totalRefunded 
        ? `₹${analytics.counters.totalRefunded.toLocaleString()} auto-deducted in refunds`
        : 'Active delivered revenue',
      icon: FiDollarSign,
      color: 'bg-amber-500/10 text-gold-600'
    },
    {
      title: 'Delivered Orders',
      value: analytics?.counters?.totalOrders ?? 0,
      change: 'Active delivered orders',
      icon: FiShoppingBag,
      color: 'bg-yellow-500/10 text-gold-600'
    },
    {
      title: 'Total Refunds',
      value: `₹${(analytics?.counters?.totalRefunded ?? 0).toLocaleString()}`,
      change: `${analytics?.counters?.refundedOrders ?? 0} orders refunded`,
      icon: FiRotateCcw,
      color: 'bg-purple-500/10 text-purple-600'
    },
    {
      title: 'Active Customers',
      value: analytics?.counters?.totalUsers ?? 0,
      change: 'Registered customer database',
      icon: FiUsers,
      color: 'bg-emerald-500/10 text-emerald-600'
    },
    {
      title: 'Total Reviews',
      value: analytics?.counters?.totalReviews ?? 0,
      change: 'Submitted product reviews',
      icon: FiStar,
      color: 'bg-blue-500/10 text-blue-600'
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* 1. Header welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gold-200/50">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-primary m-0">
            Shambhavi Imitation Dashboard
          </h1>
          <p className="text-xs text-secondary/60 mt-0.5 font-sans">
            Real-time retail metrics, revenue performance, and pipeline analytics.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-gold-200/60 px-3 py-1.5 shadow-xs text-[11px] font-semibold uppercase tracking-wider text-gold-800 rounded-xs w-fit">
          <FiActivity className="animate-pulse text-gold-600" size={14} />
          <span>Live Operations</span>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-gold-200/50 p-3.5 shadow-xs flex items-center justify-between gap-2 rounded-xs hover:border-gold-300 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider mb-0.5 font-sans truncate">{card.title}</p>
                <h3 className="text-lg sm:text-xl font-bold text-primary font-serif tracking-tight leading-tight [overflow-wrap:anywhere]">{card.value}</h3>
                <span className="text-[9px] font-semibold text-emerald-700 block truncate mt-0.5 font-sans">{card.change}</span>
              </div>
              <div className={`p-2 sm:p-2.5 shrink-0 rounded-xs ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Unified Analytics Row (Revenue Trends + Order Operations Pipeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Revenue Analytics with Seamless Daily / Monthly View Toggle */}
        <div className="bg-white border border-gold-200/50 p-4 sm:p-5 shadow-xs lg:col-span-2 min-w-0 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gold-100/60 mb-4 gap-2">
            <div>
              <h3 className="font-serif text-sm font-bold text-primary tracking-wide">Revenue Analytics</h3>
              <p className="text-[10px] text-secondary/60 uppercase tracking-wider font-semibold">
                {revenueTab === 'daily' ? 'Last 7 Active Sales Days' : 'Fiscal Monthly Sales Comparison'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-[#FAF8F2] border border-gold-250 p-0.5 rounded-xs flex">
                <button
                  type="button"
                  onClick={() => setRevenueTab('daily')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer rounded-xs ${
                    revenueTab === 'daily' ? 'bg-gold-600 text-white shadow-xs' : 'text-secondary/70 hover:text-primary'
                  }`}
                >
                  Daily Trends
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueTab('monthly')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer rounded-xs ${
                    revenueTab === 'monthly' ? 'bg-gold-600 text-white shadow-xs' : 'text-secondary/70 hover:text-primary'
                  }`}
                >
                  Monthly View
                </button>
              </div>
              <Link to="/orders" className="text-[10px] font-bold text-gold-700 hover:text-primary uppercase tracking-wider flex items-center ml-1" title="View Orders">
                <FiArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full min-w-0 font-sans text-xs">
            {mounted && revenueTab === 'daily' && (
              chartDataRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartDataRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.25}/>
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

            {mounted && revenueTab === 'monthly' && (
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

        {/* Right: Order Operations Donut Chart & Pipeline Allocation */}
        <div className="bg-white border border-gold-200/50 p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div className="pb-3 border-b border-gold-100/60 mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-sm font-bold text-primary tracking-wide">Order Operations</h3>
              <p className="text-[10px] text-secondary/60 uppercase tracking-wider font-semibold">Pipeline Breakdown</p>
            </div>
            <Link to="/orders" className="text-[10px] font-bold text-gold-700 hover:underline uppercase tracking-wider">
              Manage
            </Link>
          </div>

          <div className="h-40 w-full relative flex items-center justify-center font-sans text-xs">
            {mounted && (
              pieDataToRender.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieDataToRender}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={66}
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
                  <FiShoppingBag size={20} className="mb-1 text-gold-300" />
                  <span className="text-[11px]">No active pipeline allocation.</span>
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary/80 pt-3 border-t border-gold-100">
            {allStatusList.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-2 py-1 bg-[#FAF8F2] border border-gold-100/70 rounded-xs">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate text-[9px]">{item.name}</span>
                </div>
                <span className="font-mono text-primary font-bold px-1 py-0.2 bg-white border border-gold-200 text-[10px] rounded-xs ml-1">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Critical Inventory Shortages (Compact Alert Banner) */}
      {analytics?.lowStockAlerts && analytics.lowStockAlerts.length > 0 && (
        <div className="bg-white border border-amber-200/80 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <FiAlertTriangle className="text-amber-600 animate-pulse" size={15} />
              <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider">
                Critical Inventory Limits (Stock Below 5 Units)
              </h4>
            </div>
            <Link to="/products" className="text-[10px] font-bold text-gold-700 hover:underline uppercase tracking-wider">
              Manage Inventory →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {analytics.lowStockAlerts.slice(0, 4).map((product) => (
              <div key={product._id} className="flex items-center justify-between p-2.5 bg-[#FAF8F2] border border-gold-200/60 rounded-xs text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-primary truncate text-[11px]">{product.name}</p>
                  <p className="text-[9px] font-mono text-secondary/60">SKU: {product.sku}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-red-50 text-red-700 font-bold text-[10px] rounded-xs border border-red-200">
                  {product.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent Orders */}
      <div className="bg-white border border-gold-200/40 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
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
            <table className="w-full min-w-[640px] text-left text-xs font-sans border-collapse [&_th]:whitespace-nowrap [&_th]:pr-4 [&_td]:pr-4">
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
                        order.orderStatus === 'Refunded' || order.isRefunded
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : order.isPaid 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {order.orderStatus === 'Refunded' || order.isRefunded ? 'REFUNDED' : (order.isPaid ? 'PAID' : 'PENDING')}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-primary">₹{order.totalPrice.toLocaleString()}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.orderStatus === 'Refunded' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
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
