import React, { useState } from 'react';
import { MdSave, MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';

const BankDetailsForm = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [formData, setFormData] = useState({
    accountNumber: initialData.accountNumber || '',
    ifscCode: initialData.ifscCode || ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.accountNumber || !formData.ifscCode) {
      toast.error('Account number and IFSC code are required');
      return;
    }

    // Validate account number (basic validation)
    if (formData.accountNumber.length < 9 || formData.accountNumber.length > 18) {
      toast.error('Account number should be between 9-18 digits');
      return;
    }

    // Validate IFSC code (basic validation)
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      toast.error('Invalid IFSC code format');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      toast.success('Bank details updated successfully');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update bank details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code *
            </label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter IFSC code (e.g., SBIN0001234)"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">⚠️ Important:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Bank details are required to receive payments</li>
              <li>Ensure all details are correct</li>
              <li>Payments will be transferred to this account</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <MdSave className="mr-2" size={16} />
                  Save Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsForm;
