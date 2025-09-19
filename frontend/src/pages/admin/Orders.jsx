import React, { useEffect, useMemo, useState } from "react";
import {
  MdShoppingCart,
  MdSearch,
  MdFileDownload,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdClose,
} from "react-icons/md";
import { ordersAPI, restaurantAPI, deliveryBoysAPI } from "../../services/api";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [viewOrder, setViewOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [showBatchOrders, setShowBatchOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [originalEdit, setOriginalEdit] = useState(null);
  const [assignError, setAssignError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedPayment !== "all") params.paymentMethod = selectedPayment;
      if (searchTerm) params.q = searchTerm;
      const res = await ordersAPI.adminList(params);
      if (res.success) setOrders(res.data || []);
    } catch (e) {
      console.error("Failed to load orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [selectedStatus, selectedPayment]);

  const filteredOrders = useMemo(() => orders, [orders]);

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return "bg-green-100 text-green-800";
    if (s === "pending") return "bg-orange-100 text-orange-800";
    if (s === "confirmed") return "bg-blue-100 text-blue-800";
    if (s === "rejected") return "bg-red-100 text-red-800";
    if (s === "preparing") return "bg-yellow-100 text-yellow-800";
    if (s === "ready_for_pickup") return "bg-purple-100 text-purple-800";
    if (s === "out_for_delivery") return "bg-indigo-100 text-indigo-800";
    if (s === "cancelled") return "bg-red-100 text-red-800";
    if (s === "delivery_rejected") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const allStatuses = [
    "pending",
    "confirmed",
    "rejected",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "delivery_rejected",
  ];

  const exportOrders = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Order ID,Customer,Items,Total,Status,Payment,Date\n" +
      filteredOrders
        .map(
          (o) =>
            `${o.orderId},${o.customerName || ""},${(o.items || []).length},${
              parseFloat(o.total).toFixed(2)
            },${o.status},${o.paymentMethod},${new Date(
              o.createdAt
            ).toLocaleString()}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditOrder = (order) => {
    setAssignError("");

    const orderStatus = order.status || "pending";

    setEditOrder({
      _id: order._id,
      status: orderStatus,
      deliveryPartnerName:
        order.deliveryPartnerName || order.assignedDeliveryBoy?.name || "",
      deliveryPartnerPhone:
        order.deliveryPartnerPhone || order.assignedDeliveryBoy?.phone || "",
      kitchenNotes: order.kitchenNotes || "",
      deliveryBoyId:
        order.assignedDeliveryBoy?._id || order.deliveryBoyId || "",
      snapshot: {
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        restaurantName: order.restaurant?.name,
        address: `${order.deliveryAddress?.street || ""}, ${
          order.deliveryAddress?.city || ""
        }`,
        items: (order.items || [])
          .map((i) => i.menuItem?.name || i.name)
          .slice(0, 3),
        totalItems: (order.items || []).length,
        total: order.total || 0,
      },
      selectedRiderMeta: null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editOrder) return;
    try {
      const payload = {
        status: editOrder.status,
        deliveryPartnerName: editOrder.deliveryPartnerName,
        deliveryPartnerPhone: editOrder.deliveryPartnerPhone,
        kitchenNotes: editOrder.kitchenNotes,
        deliveryBoyId: editOrder.deliveryBoyId || undefined,
      };
      await ordersAPI.adminUpdate(editOrder._id, payload);
      setEditOrder(null);
      await load();
    } catch (e) {
      console.error("Failed to update order", e);
    }
  };

  const loadRiders = async (restaurantId) => {
    try {
      const res = await restaurantAPI.listDeliveryBoys(restaurantId);
      if (res.success) {
        setRiders(Array.isArray(res.data) ? res.data : []);
      } else {
        setRiders([]);
      }
    } catch (e) {
      setRiders([]);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    rejected: orders.filter((o) => o.status === "rejected").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready_for_pickup").length,
    out_for_delivery: orders.filter((o) => o.status === "out_for_delivery")
      .length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdShoppingCart size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Admin Order Management
              </h1>
              <p className="text-gray-600 text-sm">
                Monitor all restaurant orders, assign delivery partners, and
                track complete order lifecycle
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Need Action</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              {stats.pending + stats.ready}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Pending + Ready</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {stats.confirmed + stats.preparing + stats.out_for_delivery}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              Confirmed + Preparing + On Way
            </p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {stats.delivered}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Successfully Delivered</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 flex-1 w-full">
            <div className="relative flex-1 max-w-md w-full">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by ID / name / phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
                className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm">
              <option value="all">All Status</option>
              <option value="pending">Pending (Restaurant Decision)</option>
              <option value="confirmed">Confirmed (Restaurant Accepted)</option>
              <option value="rejected">Rejected (Restaurant Declined)</option>
              <option value="preparing">Preparing (Kitchen Working)</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="delivery_rejected">Delivery Rejected</option>
            </select>
            <select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)} className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm">
              <option value="all">All Payment</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <button onClick={exportOrders} className="w-full md:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm">
              <MdFileDownload size={20} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap"><span className="text-xs sm:text-sm font-medium text-gray-900">{o.orderId}</span></td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{o.customerName}</span>
                      <div className="text-[11px] sm:text-xs text-gray-500">{o.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap"><span className="text-xs sm:text-sm text-gray-900">{(o.items || []).length} items</span></td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap"><span className="text-xs sm:text-sm font-bold text-gray-900">₹{parseFloat(o.total).toFixed(2)}</span></td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <span className="text-[11px] sm:text-xs text-gray-700 capitalize">{o.paymentMethod?.replaceAll("_", " ")}</span>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 capitalize">{o.paymentStatus}</div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(o.status)}`}>{o.status?.replaceAll("_", " ")}</span>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900">
                      <div>{new Date(o.createdAt).toLocaleTimeString()}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => setViewOrder(o)} className="px-2 sm:px-3 py-1 border border-green-500 text-green-500 rounded hover:bg-green-50 transition-colors flex items-center space-x-1">
                        <MdVisibility size={14} />
                        <span>View</span>
                      </button>
                      {!["cancelled", "delivered"].includes(o.status) && (
                        <button onClick={() => handleEditOrder(o)} className="px-2 sm:px-3 py-1 border border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition-colors flex items-center space-x-1">
                          <MdEdit size={14} />
                          <span>Monitor</span>
                        </button>
                      )}
                      {(o.status === "ready_for_pickup" || o.status === "delivery_rejected") && !o.assignedDeliveryBoy && (
                        <button onClick={() => handleEditOrder(o)} className="px-2 sm:px-3 py-1 border border-green-500 text-green-500 rounded hover:bg-green-50 transition-colors flex items-center space-x-1">
                          <MdEdit size={14} />
                          <span>Quick Assign</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Loading…</div>}
          {!loading && filteredOrders.length === 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">No orders found</div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-0 sm:mx-4 mb-2 sm:mb-0 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="p-3 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-bold text-gray-900">Order Details - {viewOrder.orderId}</h3>
                <button onClick={() => setViewOrder(null)} className="p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MdClose size={22} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <p className="text-sm text-gray-900">{viewOrder.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{viewOrder.customerPhone}{" "}{viewOrder.alternatePhone ? ` / ${viewOrder.alternatePhone}` : ""}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                  <p className="text-sm text-gray-900 capitalize">{viewOrder.paymentMethod?.replaceAll("_", " ")} ({viewOrder.paymentStatus})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(viewOrder.status)}`}>{viewOrder.status?.replaceAll("_", " ")}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <p className="text-sm text-gray-900 break-words">{`${viewOrder.deliveryAddress?.street || ""}, ${viewOrder.deliveryAddress?.city || ""}, ${viewOrder.deliveryAddress?.state || ""} ${viewOrder.deliveryAddress?.zipCode || ""}`}</p>
                {viewOrder.deliveryAddress?.instructions && (
                  <p className="text-xs text-gray-600 mt-1 break-words">Instructions: {viewOrder.deliveryAddress.instructions}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
                <div className="divide-y">
                  {(viewOrder.items || []).map((it) => {
                    const m = it.menuItem || {};
                    return (
                      <div key={it._id} className="py-3 flex items-center gap-3">
                        {m.image ? (
                          <img src={m.image} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-600">Qty: {it.quantity}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">₹{parseFloat(it.totalPrice).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Partner</label>
                  <p className="text-sm text-gray-900">{viewOrder.deliveryPartnerName || "—"}{" "}{viewOrder.deliveryPartnerPhone ? `(${viewOrder.deliveryPartnerPhone})` : ""}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <p className="text-lg font-bold text-orange-500">₹{parseFloat(viewOrder.total).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Monitor Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-[95%] sm:max-w-xl md:max-w-2xl mx-0 sm:mx-4 mb-2 sm:mb-0 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="p-3 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-bold text-gray-900">Order Monitor - #{editOrder.orderId || editOrder._id.slice(-8)}</h3>
                <button onClick={() => setEditOrder(null)} className="p-2 -m-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MdClose size={22} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-6 space-y-5">
              {assignError && (
                <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm">{assignError}</div>
              )}

              {editOrder?.status === "pending" && (
                <div className="p-3 rounded-lg border border-orange-300 bg-orange-50 text-orange-800 text-sm">
                  <strong>Status: Pending</strong> - Restaurant is deciding whether to accept this order. You can assign delivery boy early, but they'll only pick up when food is ready.
                </div>
              )}

              {editOrder?.status === "preparing" && (
                <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm">
                  <strong>Status: Preparing</strong> - Restaurant is cooking the food. You can assign delivery boy now - they'll be notified when food is ready for pickup.
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Customer</div>
                    <div className="text-gray-900">{editOrder?.snapshot?.customerName}</div>
                    <div className="text-gray-600">{editOrder?.snapshot?.customerPhone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Restaurant</div>
                    <div className="text-gray-900">{editOrder?.snapshot?.restaurantName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Order Value</div>
                    <div className="text-gray-900">₹{parseFloat(editOrder?.snapshot?.total || 0).toFixed(2)}</div>
                    <div className="text-gray-600">{editOrder?.snapshot?.totalItems || 0} items</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 font-medium">Delivery Address</div>
                  <div className="text-sm text-gray-800 break-words">{editOrder?.snapshot?.address}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(editOrder.status).includes("green") ? "bg-green-500" : getStatusColor(editOrder.status).includes("red") ? "bg-red-500" : "bg-blue-500"}`}></div>
                    <span className="text-sm font-medium text-gray-700">Current Status: {editOrder.status?.replaceAll("_", " ")}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(editOrder.status)}`}>{editOrder.status?.replaceAll("_", " ")}</span>
                </div>

                {!["cancelled", "delivered"].includes(editOrder?.status) ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={() => { if (confirm("Are you sure you want to cancel this order? This action cannot be undone.")) { handleSaveEdit({ ...editOrder, status: "cancelled" }); } }} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center justify-center">Cancel Order</button>
                      <button onClick={async () => { try { setAssignError(""); const res = await ordersAPI.adminAutoAssign(editOrder._id); if (res.success && res.data && res.data.deliveryBoy) { const rb = res.data.deliveryBoy; setEditOrder((prev) => ({ ...prev, deliveryPartnerName: rb.name || "", deliveryPartnerPhone: rb.phone || "", deliveryBoyId: rb._id, })); } } catch (e) { setAssignError(e?.message || "No online delivery boys available in this area"); } }} disabled={!["preparing", "ready_for_pickup", "delivery_rejected"].includes(editOrder?.status)} className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm flex items-center justify-center transition-colors ${["preparing", "ready_for_pickup", "delivery_rejected"].includes(editOrder?.status) ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>Auto Assign</button>
                    </div>

                    {!["preparing", "ready_for_pickup", "delivery_rejected"].includes(editOrder?.status) && (
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <strong>⏳ Waiting:</strong> Auto-assign will be available after restaurant accepts and starts preparing the order.
                      </div>
                    )}

                    {["preparing", "ready_for_pickup", "delivery_rejected"].includes(editOrder?.status) && (
                      <div className="text-xs text-gray-500 bg-green-50 p-2 rounded-lg border border-green-200">
                        <strong>✅ Ready:</strong> Auto-assign will automatically find the best available delivery boy for this order.
                      </div>
                    )}

                    {assignError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200"><strong>❌ Error:</strong> {assignError}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg text-center">
                    <strong>🚫 Order Completed</strong>
                    <br />
                    <span className="text-xs">This order has already been {editOrder?.status}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 sm:pt-4">
                <button onClick={() => setEditOrder(null)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
