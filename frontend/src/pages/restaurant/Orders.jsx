import React, { useEffect, useMemo, useState } from 'react';
import { MdShoppingCart, MdSearch, MdUpdate, MdKitchen, MdRestaurant } from 'react-icons/md';
import { ordersAPI } from '../../services/api';


const statusColors = {
	pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',    // New order received
	preparing: 'bg-orange-100 text-orange-800 border-orange-200', // Food being cooked
	ready_for_pickup: 'bg-green-100 text-green-800 border-green-200',        // Ready for pickup
	cancelled: 'bg-red-100 text-red-800 border-red-200'           // Order rejected/cancelled
};

const Orders = () => {
	const [orders, setOrders] = useState([]);
	const [filtered, setFiltered] = useState([]);
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState('all');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	const loadOrders = async () => {
		setIsLoading(true);
		setError('');
		try {
			const res = await ordersAPI.getRestaurantOrders();
			if (res.success) {
				setOrders(res.data || []);
			} else {
				setError(res.message || 'Failed to load orders');
			}
		} catch (e) {
			setError(e.message || 'Failed to load orders');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => { loadOrders(); }, []);

	useEffect(() => {
		let list = [...orders];
		if (status !== 'all') list = list.filter(o => o.status === status);
		if (query.trim()) {
			const q = query.trim().toLowerCase();
			list = list.filter(o =>
				(o.orderId || '').toLowerCase().includes(q) ||
				(o.customerName || '').toLowerCase().includes(q) ||
				(o.customerPhone || '').toLowerCase().includes(q)
			);
		}
		setFiltered(list);
	}, [orders, query, status]);

	const counts = useMemo(() => {
		const c = { all: orders.length };
		// Restaurant only manages kitchen workflow, not delivery
		['pending', 'preparing', 'ready_for_pickup', 'cancelled'].forEach(s => {
			c[s] = orders.filter(o => o.status === s).length;
		});
		return c;
	}, [orders]);

	const updateStatus = async (orderId, next) => {
		setMessage('');
		setError('');
		try {
			const res = await ordersAPI.updateOrderStatus(orderId, { status: next });
			if (res.success) {
				setMessage('Order status updated');
				await loadOrders();
			} else {
				setError(res.message || 'Failed to update status');
			}
		} catch (e) {
			setError(e.message || 'Failed to update status');
		}
	};

	return (
		<div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center space-x-3 sm:space-x-4">
						<div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
							<MdKitchen size={24} className="text-orange-600 sm:w-7 sm:h-7" />
						</div>
						<div>
							<h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kitchen Orders</h1>
							<p className="text-gray-600 text-sm">Manage your restaurant's incoming orders and kitchen workflow</p>
						</div>
					</div>
				</div>
			</div>

			{message && (
				<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{message}</div>
			)}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
			)}

			{/* Filters */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
				<div className="flex flex-col md:flex-row gap-3 sm:gap-4">
					<div className="flex-1">
						<div className="relative">
							<MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
							<input
								type="text"
								placeholder="Search by Order ID, customer, phone"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
							/>
						</div>
					</div>
					<div className="flex gap-3 sm:gap-4">
						<select 
							value={status} 
							onChange={(e) => setStatus(e.target.value)} 
							className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
						>
							<option value="all">All Status</option>
							{['pending','preparing','ready_for_pickup','cancelled'].map(s => (
								<option key={s} value={s}>{s === 'ready_for_pickup' ? 'Ready' : s[0].toUpperCase() + s.slice(1)}</option>
							))}
						</select>
					</div>
				</div>
				
				{/* Kitchen Status Summary */}
				<div className="mt-4 pt-4 border-t border-gray-200">
					<div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
						<span className="text-gray-600 font-medium">Kitchen Status:</span>
						<div className="flex flex-wrap gap-2 sm:gap-4">
							<span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
								New {counts.pending}
							</span>
							<span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
								Preparing {counts.preparing}
							</span>
							<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
								Ready {counts.ready_for_pickup}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* List */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
				<div className="divide-y">
					{isLoading ? (
						<div className="p-6 text-center text-gray-600">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
							<span className="text-sm">Loading orders...</span>
						</div>
					) : filtered.length === 0 ? (
						<div className="p-6 text-center text-gray-600">
							<MdShoppingCart size={40} className="mx-auto mb-3 text-gray-300" />
							<p className="text-sm">No orders found</p>
						</div>
					) : (
						filtered.map(order => (
							<div key={order._id} className="p-4 sm:p-6">
								<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
									<div className="space-y-2 flex-1">
										<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
											<span className="text-gray-900 font-semibold text-sm sm:text-base">{order.orderId}</span>
											<span className={`px-2 py-1 rounded-lg text-xs border w-fit ${statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
												{order.status === 'ready_for_pickup' ? 'Ready' : order.status[0].toUpperCase() + order.status.slice(1)}
											</span>
										</div>
										<div className="text-xs sm:text-sm text-gray-600">
											<span className="font-medium">{order.customerName}</span> • {order.customerPhone}
										</div>
										<div className="text-xs sm:text-sm text-gray-600">
											Items: {order.items?.length || 0} • Total: ₹{order.total}
										</div>
									</div>
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:ml-4">
										{/* Restaurant Kitchen Workflow - Only manage food preparation */}
										{order.status === 'pending' && (
											<>
											<button 
												onClick={() => updateStatus(order._id, 'preparing')} 
												className="px-3 sm:px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 flex items-center justify-center space-x-2 text-xs sm:text-sm min-h-[36px] touch-manipulation transition-colors"
											>
												<MdUpdate size={14} className="sm:w-4 sm:h-4" />
												<span className="hidden sm:inline">Accept & Start Cooking</span>
												<span className="sm:hidden">Accept</span>
											</button>
											<button 
												onClick={() => updateStatus(order._id, 'cancelled')} 
												className="px-3 sm:px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 flex items-center justify-center space-x-2 text-xs sm:text-sm min-h-[36px] touch-manipulation transition-colors"
											>
												<MdUpdate size={14} className="sm:w-4 sm:h-4" />
												<span>Reject</span>
											</button>
											</>
										)}
										{order.status === 'preparing' && (
											<button 
												onClick={() => updateStatus(order._id, 'ready_for_pickup')} 
												className="px-3 sm:px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 flex items-center justify-center space-x-2 text-xs sm:text-sm min-h-[36px] touch-manipulation transition-colors"
											>
												<MdUpdate size={14} className="sm:w-4 sm:h-4" />
												<span>Mark Ready</span>
											</button>
										)}
										{order.status === 'ready_for_pickup' && (
											<div className="text-xs sm:text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg text-center">
												Ready for Pickup
												<div className="text-xs text-gray-500 mt-1">Admin will assign delivery</div>
											</div>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default Orders;


