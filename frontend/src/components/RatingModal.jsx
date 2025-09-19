import React, { useState, useEffect } from 'react';
import { 
  MdStar, 
  MdStarBorder, 
  MdClose, 
  MdThumbDown,
  MdRestaurant,
  MdRateReview,
  MdEmojiEmotions,
  MdFavorite,
} from 'react-icons/md';
import { ratingAPI } from '../services/api';
import toast from 'react-hot-toast';

const RatingModal = ({ isOpen, onClose, orderId, orderData, onSubmit }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [quickFeedback, setQuickFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderData();
    }
  }, [isOpen, orderId]);

  const loadOrderData = async () => {
    try {
      if (orderData) {
        setOrder(orderData);
      } 
    } catch (error) {
      console.error('Error loading order data:', error);
      toast.error('Failed to load order details');
    }
  };

  const handleStarClick = (rating) => {
    setOverallRating(rating);
  };

  const handleQuickFeedback = (feedback) => {
    setQuickFeedback(feedback);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (overallRating === 0) {
        toast.error('Please rate your experience');
        return;
      }

      // Create simple rating data with overall rating
      const ratingData = {
        itemRatings: (order?.items || []).map(item => ({
          menuItem: item.menuItem?._id || item.menuItem,
          rating: overallRating // Use overall rating for all items
        })),
        overallReview: quickFeedback || undefined
      };

      const response = await ratingAPI.submitRating(orderId, ratingData);
      
      if (response.success) {
        toast.success('Thank you for your feedback! 🎉');
        onSubmit && onSubmit(response.data);
        onClose();
      } else {
        toast.error(response.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className="text-3xl sm:text-4xl text-yellow-400 hover:text-yellow-500 transition-all duration-200 transform hover:scale-125 active:scale-95"
          >
            {star <= overallRating ? <MdStar /> : <MdStarBorder />}
          </button>
        ))}
      </div>
    );
  };

  const getRatingEmoji = () => {
    switch(overallRating) {
      case 5: return '😍';
      case 4: return '😊';
      case 3: return '🙂';
      case 2: return '😕';
      case 1: return '😞';
      default: return '⭐';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md md:max-w-lg shadow-2xl transform transition-all duration-300 scale-100 mx-auto overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="relative p-6 pb-4 sm:p-8 sm:pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <MdRateReview className="text-orange-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Rate Your Experience</h2>
                <p className="text-xs text-gray-600">
                  {order?.restaurant?.name || 'Restaurant'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MdClose size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Order Info */}
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <MdRestaurant className="text-orange-600" size={16} />
            <span className="text-xs font-medium text-gray-700">
              Order #{order?.orderId} • {order?.items?.length || 0} items
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 overflow-y-auto">
          {/* Star Rating */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MdEmojiEmotions className="text-orange-500" size={20} />
              <p className="text-sm md:text-base font-medium text-gray-700">
                How was your experience?
              </p>
            </div>
            {renderStars()}
            {overallRating > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-2xl">{getRatingEmoji()}</span>
                <span className="text-sm md:text-base font-medium text-gray-700">
                  {overallRating === 5 ? 'Excellent!' :
                   overallRating === 4 ? 'Very Good!' :
                   overallRating === 3 ? 'Good!' :
                   overallRating === 2 ? 'Fair' : 'Poor'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Feedback */}
          <div className="mb-6">
            <p className="text-xs md:text-sm font-medium text-gray-700 mb-3 text-center">
              Quick feedback (optional)
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleQuickFeedback('Great food!')}
                className={`flex items-center gap-1 px-3 py-2 md:px-4 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
                  quickFeedback === 'Great food!' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:shadow-md'
                }`}
              >
                <MdFavorite className={quickFeedback === 'Great food!' ? 'text-white' : 'text-green-500'} size={14} />
                Great!
              </button>
              <button
                onClick={() => handleQuickFeedback('Could be better')}
                className={`flex items-center gap-1 px-3 py-2 md:px-4 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
                  quickFeedback === 'Could be better' 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:shadow-md'
                }`}
              >
                <MdThumbDown className={quickFeedback === 'Could be better' ? 'text-white' : 'text-red-500'} size={14} />
                Meh
              </button>
            </div>
          </div>

          {/* Custom Review */}
          <div className="mb-6">
            <textarea
              value={quickFeedback}
              onChange={(e) => setQuickFeedback(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm md:text-base min-h-[64px] md:min-h-[84px]"
              rows={2}
              maxLength={150}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {quickFeedback.length}/150
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || overallRating === 0}
              className="flex-1 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
