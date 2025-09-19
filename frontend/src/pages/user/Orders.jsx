import React, { useEffect, useMemo, useState } from 'react';
import { ordersAPI, ratingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import RatingModal from '../../components/RatingModal';

import { 
  MdReceiptLong,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdLocalShipping,
  MdClose,
  MdRestaurant,
  MdFastfood,
  MdStar,
} from 'react-icons/md';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ q: '', status: 'all' });
  const [viewOrder, setViewOrder] = useState(null);
  
  const [ratingModal, setRatingModal] = useState({ isOpen: false, orderId: null, orderData: null });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratedOrders, setRatedOrders] = useState(new Set());
  const [ratingStatusLoading, setRatingStatusLoading] = useState({});

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getMyOrders();
      if (res.success) {
        setOrders(res.data || []);
        
        
        // Check rating status for delivered orders
        const deliveredOrders = res.data.filter(order => order.status === 'delivered');
        for (const order of deliveredOrders) {
          checkRatingStatus(order._id);
        }
      }
    } catch (e) {
      console.error('Failed to load orders', e);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh orders every 30 seconds for real-time updates
  useEffect(() => {
    loadOrders();
    
    const interval = setInterval(() => {
      loadOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (filter.status !== 'all') list = list.filter(o => o.status === filter.status);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(o =>
        (o.orderId || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter]);

  const canCancelOrder = (order) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await ordersAPI.cancelOrder(orderId);
      if (res.success) {
        toast.success('Order cancelled successfully');
        loadOrders(); // Refresh orders
      } else {
        toast.error(res.message || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      setRatingLoading(true);
      toast.success('Rating submitted successfully!');
      setRatingModal({ isOpen: false, orderId: null, orderData: null });
      // Add the order to rated orders set
      setRatedOrders(prev => new Set([...prev, ratingModal.orderId]));
      loadOrders(); // Refresh orders to update rating status
    } catch (error) {
      console.error('Rating submission error:', error);
      toast.error('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const openRatingModal = (orderData) => {
    setRatingModal({ isOpen: true, orderId: orderData._id, orderData });
  };

  const checkRatingStatus = async (orderId) => {
    try {
      setRatingStatusLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await ratingAPI.canRateOrder(orderId);
      if (response.success && response.data.hasRated) {
        setRatedOrders(prev => new Set([...prev, orderId]));
      }
    } catch (error) {
      console.error('Error checking rating status:', error);
    } finally {
      setRatingStatusLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const isOrderRated = (orderId) => {
    return ratedOrders.has(orderId);
  };





  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return { badge: 'bg-green-100 text-green-700', Icon: MdCheckCircle };
    if (s === 'cancelled') return { badge: 'bg-red-100 text-red-700', Icon: MdCancel };
    if (s === 'out_for_delivery') return { badge: 'bg-blue-100 text-blue-700', Icon: MdLocalShipping };
    return { badge: 'bg-yellow-100 text-yellow-700', Icon: MdPending };
  };

  if (loading) {
    return (
      <div className="min-h-screen backcolor pt-14 md:pt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 text-sm md:text-base">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen backcolor pt-14 md:pt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 lg:py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900">My Orders</h1>
            
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex gap-2 md:gap-3 w-full">
              <input className="border rounded-lg px-3 py-2 text-sm md:text-base flex-1" placeholder="Search by ID or name" value={filter.q} onChange={e=>setFilter(f=>({...f,q:e.target.value}))} />
              <select className="border rounded-lg px-3 py-2 text-sm md:text-base" value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">On the way</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-gray-600">No orders yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filtered.map(o => {
              const { badge, Icon } = getStatusStyle(o.status);
              const firstItem = o.items && o.items.length > 0 ? (o.items[0].name || (o.items[0].menuItem && o.items[0].menuItem.name)) : '';
              const extraCount = Math.max((o.items?.length || 0) - 1, 0);
              const restaurantName = o.restaurant?.name || 'From your store';
              return (
                <div key={o._id} className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow hover:shadow-md transition h-full min-h-[210px] flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-800">
                      <MdReceiptLong className="text-orange-600" size={20} />
                      <div>
                        <div className="text-xs text-gray-500">Order ID</div>
                        <div className="text-sm md:text-base font-semibold">{o.orderId}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] md:text-xs font-medium ${badge}`}>
                      <Icon size={12} /> {o.status?.replaceAll('_',' ')}
                    </span>
                  </div>
                  <div className="mt-3 md:mt-4 grid grid-cols-2 gap-3 text-sm md:text-base">
                    <div>
                      <div className="text-gray-500">Items</div>
                      <div className="font-medium text-gray-900">{o.items?.length || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500">Total</div>
                      <div className="font-semibold text-gray-900">₹{Number(o.total || 0).toFixed(2)}</div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-gray-700">
                      <MdRestaurant className="text-orange-600" />
                      <span className="text-sm md:text-base font-medium">{restaurantName}</span>
                    </div>
                    {firstItem && (
                      <div className="col-span-2 flex items-center gap-2 text-gray-600 text-sm md:text-base">
                        <MdFastfood className="text-red-500" />
                        <span>{firstItem}{extraCount > 0 ? ` +${extraCount} more` : ''}</span>
                      </div>
                    )}
                    <div className="col-span-2 text-[11px] md:text-xs text-gray-500">Placed on {new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button onClick={()=>setViewOrder(o)} className="flex-1 px-3 py-2 text-xs md:text-sm rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600">View</button>
                    {(['pending','confirmed'].includes(o.status)) && (
                      <button onClick={async()=>{ try { await ordersAPI.cancelMyOrder(o._id); toast.success('Order cancelled'); const res=await ordersAPI.getMyOrders(); if(res.success) setOrders(res.data||[]);} catch(e){ toast.error('Failed to cancel'); } }} className="flex-1 px-3 py-2 text-xs md:text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Cancel</button>
                    )}
                    {o.status === 'delivered' && !isOrderRated(o._id) && !ratingStatusLoading[o._id] && (
                      <button 
                        onClick={() => openRatingModal(o)}
                        className="flex-1 px-3 py-2 text-xs md:text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
                      >
                        <MdStar size={14} />
                        Rate Order
                      </button>
                    )}
                    {o.status === 'delivered' && isOrderRated(o._id) && (
                      <div className="flex-1 px-3 py-2 text-xs md:text-sm border border-green-300 text-green-600 rounded-lg bg-green-50 flex items-center justify-center gap-1">
                        <MdCheckCircle size={14} />
                        Rated
                      </div>
                    )}
                    {o.status === 'delivered' && ratingStatusLoading[o._id] && (
                      <div className="flex-1 px-3 py-2 text-xs md:text-sm border border-gray-300 text-gray-500 rounded-lg bg-gray-50 flex items-center justify-center gap-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        Checking...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdReceiptLong className="text-orange-600" size={20} />
                <div className="text-sm md:text-base font-semibold">Order {viewOrder.orderId}</div>
              </div>
              <button onClick={()=>setViewOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg"><MdClose size={20} className="text-gray-600" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base">
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium capitalize">{viewOrder.status?.replaceAll('_',' ')}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500">Total</div>
                <div className="font-semibold">₹{Number(viewOrder.total||0).toFixed(2)}</div>
              </div>
              <div className="col-span-2 flex items-center gap-2 text-gray-700">
                <MdRestaurant className="text-orange-600" />
                <span className="text-sm md:text-base font-medium">{viewOrder.restaurant?.name || 'From your store'}</span>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Delivery Address</div>
                <div className="text-gray-800 text-sm md:text-base">{`${viewOrder.deliveryAddress?.street || ''}, ${viewOrder.deliveryAddress?.city || ''}, ${viewOrder.deliveryAddress?.state || ''} ${viewOrder.deliveryAddress?.zipCode || ''}`}</div>
                {viewOrder.deliveryAddress?.instructions && (
                  <div className="text-xs md:text-sm text-gray-600 mt-1">Instructions: {viewOrder.deliveryAddress.instructions}</div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm md:text-base font-semibold text-gray-900 mb-2">Items</div>
              <div className="divide-y">
                {(viewOrder.items||[]).map(it => {
                  const m = it.menuItem || {};
                  const price = Number(it.totalPrice || 0);
                  return (
                    <div key={it._id} className="py-3 flex items-center gap-3">
                      {m.image ? <img src={m.image} className="w-10 h-10 md:w-12 md:h-12 rounded object-cover" /> : <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-gray-200" />}
                      <div className="flex-1">
                        <div className="text-sm md:text-base font-medium text-gray-900">{m.name}</div>
                        <div className="text-xs md:text-sm text-gray-600">Qty: {it.quantity}</div>
                      </div>
                      <div className="text-sm md:text-base font-semibold text-gray-900">₹{price.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
                         {/* Rating Section for Delivered Orders */}
             {viewOrder.status === 'delivered' && (
               <div className="mt-6 pt-4 border-t border-gray-200">
                 <div className="text-sm md:text-base font-semibold text-gray-900 mb-3">Rate Your Experience</div>
                 <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                   {!isOrderRated(viewOrder._id) ? (
                     <button
                       onClick={() => {
                         setViewOrder(null);
                         openRatingModal(viewOrder);
                       }}
                       className="flex-1 px-4 py-2 text-xs md:text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center justify-center gap-2"
                     >
                       <MdStar size={14} />
                       Rate Order
                     </button>
                   ) : (
                     <div className="flex-1 px-4 py-2 text-xs md:text-sm border border-green-300 text-green-600 rounded-lg bg-green-50 flex items-center justify-center gap-2">
                       <MdCheckCircle size={14} />
                       Already Rated
                     </div>
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

       <RatingModal
         isOpen={ratingModal.isOpen}
         onClose={() => setRatingModal({ isOpen: false, orderId: null, orderData: null })}
         orderId={ratingModal.orderId}
         orderData={ratingModal.orderData}
         onSubmit={handleRatingSubmit}
       />
     </div>
   );
 };

export default Orders;


