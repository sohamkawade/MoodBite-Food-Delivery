import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  MdArrowBack,
  MdAccountBalance,
  MdReceiptLong,
  MdPayment,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all' });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    hasNext: false,
    hasPrev: false
  });
  const [totalEarnings, setTotalEarnings] = useState(0);

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await userAPI.getTransactionHistory(page, 10, filter.type);
      
      if (response.success) {
        setTransactions(response.data.transactions || []);
        setTotalEarnings(response.data.totalEarnings || 0);
        setPagination(response.data.pagination || {
          current: 1,
          total: 1,
          hasNext: false,
          hasPrev: false
        });
      } else {
        toast.error(response.message || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filter.type]);

  const handlePageChange = (newPage) => {
    loadTransactions(newPage);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return <MdPayment className="text-red-500" size={20} />;
      case 'refund':
        return <MdRefresh className="text-green-500" size={20} />;
      case 'cashback':
        return <MdAccountBalance className="text-blue-500" size={20} />;
      case 'discount':
        return <MdReceiptLong className="text-purple-500" size={20} />;
      default:
        return <MdReceiptLong className="text-gray-500" size={20} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'payment':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'refund':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cashback':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'discount':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen backcolor pt-14 md:pt-16">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 text-sm">View all your payment transactions</p>
          </div>
        </div>

        {/* Total Spent and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdReceiptLong className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
          
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm min-w-[150px]"
          >
            <option value="all">All Transactions</option>
            <option value="payment">Payments</option>
            <option value="refund">Refunds</option>
            <option value="cashback">Cashback</option>
            <option value="discount">Discounts</option>
          </select>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <MdReceiptLong className="text-gray-300 mx-auto mb-4" size={48} />
              <p className="text-gray-600 mb-2">No transactions found</p>
              <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.order?.orderId && `Order #${transaction.order.orderId}`}
                          {transaction.order?.restaurant?.name && ` • ${transaction.order.restaurant.name}`}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTransactionColor(transaction.type)}`}>
                        {transaction.type}
                      </div>
                      <p className={`text-lg font-bold mt-1 ${
                        transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {transaction.paymentMethod} • {transaction.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {pagination.current} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <MdChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refund Policy Section */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <MdRefresh className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Refund Policy</h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Automatic Refunds:</strong> If your order is cancelled or payment fails, refund will be processed automatically within 2-3 business days.</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Refund Methods:</strong> Refunds will be credited back to your original payment method (UPI/Card) or bank account.</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Processing Time:</strong> UPI refunds: 2-3 hours | Card refunds: 3-5 business days | Bank transfers: 1-2 business days.</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Track Refunds:</strong> Check your transaction history above to see refund status and details.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
