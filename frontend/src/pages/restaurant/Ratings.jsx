import React, { useState, useEffect } from 'react';
import { useRestaurantAuth } from '../../context/RestaurantAuthContext';
import { ratingAPI } from '../../services/api';
import { MdStar, MdStarBorder, MdFilterList } from 'react-icons/md';
import toast from 'react-hot-toast';

const Ratings = () => {
  const { restaurantUser } = useRestaurantAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    hasNext: false,
    hasPrev: false
  });
  const [filter, setFilter] = useState({
    sort: '-createdAt',
    page: 1
  });

  useEffect(() => {
    if (restaurantUser?.restaurant?._id) {
      loadRatings();
    }
  }, [restaurantUser, filter]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await ratingAPI.getRestaurantRatings(restaurantUser.restaurant._id, filter);
      
      if (response.success) {
        setRatings(response.data.ratings);
        setStats(response.data.restaurantStats);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'Failed to load ratings');
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= rating ? <MdStar size={14} className="sm:w-4 sm:h-4" /> : <MdStarBorder size={14} className="sm:w-4 sm:h-4" />}
          </span>
        ))}
        <span className="ml-1 text-xs sm:text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (page) => {
    setFilter(prev => ({ ...prev, page }));
  };

  const handleSortChange = (sort) => {
    setFilter(prev => ({ ...prev, sort, page: 1 }));
  };

  if (loading && ratings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdStar size={24} className="text-orange-600 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
              <p className="text-gray-600 text-sm">See what your customers are saying about your restaurant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="flex items-center">
              <MdStar className="text-yellow-400 sm:w-8 sm:h-8" size={24} />
            </div>
          </div>
          <div className="mt-2">
            {renderStars(stats.averageRating)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.totalRatings}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
              <MdStar className="text-orange-600 sm:w-6 sm:h-6" size={20} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Customer reviews received
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-600 sm:w-5 sm:h-5" size={18} />
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
          </div>
          <select
            value={filter.sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          >
            <option value="-createdAt">Latest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-overallRating">Highest Rating</option>
            <option value="overallRating">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-sm border border-gray-200">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <MdStar className="text-gray-300 sm:w-12 sm:h-12" size={40} />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            No ratings yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            When customers rate your orders, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {ratings.map((rating) => (
            <div key={rating._id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm sm:text-base">
                      {rating.user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {rating.user?.firstName} {rating.user?.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatDate(rating.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-start sm:justify-end">
                  {renderStars(rating.overallRating)}
                </div>
              </div>

              {/* Item Ratings */}
              {rating.itemRatings && rating.itemRatings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Item Ratings:</h4>
                  <div className="space-y-2">
                    {rating.itemRatings.map((itemRating, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-900 truncate pr-2">
                          {itemRating.menuItem?.name || `Item ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-yellow-400">
                              {star <= itemRating.rating ? <MdStar size={12} className="sm:w-3.5 sm:h-3.5" /> : <MdStarBorder size={12} className="sm:w-3.5 sm:h-3.5" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Review */}
              {rating.overallReview && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{rating.overallReview}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-center mt-6 sm:mt-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[36px] touch-manipulation transition-colors"
            >
              Previous
            </button>
            
            <span className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700">
              Page {pagination.current} of {pagination.total}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={!pagination.hasNext}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[36px] touch-manipulation transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ratings;
