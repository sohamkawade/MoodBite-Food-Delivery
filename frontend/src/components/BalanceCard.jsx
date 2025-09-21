import React from 'react';
import { MdAccountBalance, MdTrendingUp, MdAccountBalanceWallet, MdEdit, MdDelete } from 'react-icons/md';

const BalanceCard = ({ balance, totalEarnings, hasBankDetails, bankDetails, onUpdateBankDetails, onDeleteBankDetails }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Balance & Earnings</h3>
        <MdAccountBalanceWallet className="text-2xl text-orange-500" />
      </div>

      <div className="space-y-4">
        {/* Current Balance */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-green-600">₹{balance?.toFixed(2) || '0.00'}</p>
            </div>
            <MdAccountBalance className="text-3xl text-green-500" />
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-xl font-semibold text-blue-600">₹{totalEarnings?.toFixed(2) || '0.00'}</p>
            </div>
            <MdTrendingUp className="text-2xl text-blue-500" />
          </div>
        </div>

        {/* Bank Details Status */}
        <div className={`rounded-lg p-4 ${hasBankDetails ? 'bg-green-50' : 'bg-yellow-50'}`}>
          {hasBankDetails && bankDetails ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Bank Details</p>
                <div className="flex space-x-2">
                  <button
                    onClick={onDeleteBankDetails}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete Bank Details"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Account Number</span>
                  <span className="text-sm font-medium text-gray-800 font-mono">
                    {bankDetails.accountNumber ? `****${bankDetails.accountNumber.slice(-4)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">IFSC Code</span>
                  <span className="text-sm font-medium text-gray-800 font-mono">{bankDetails.ifscCode}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bank Details</p>
                <p className="text-yellow-600 font-medium">⚠️ Not Configured</p>
              </div>
              {onUpdateBankDetails && (
                <button
                  onClick={onUpdateBankDetails}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
                >
                  Add Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
