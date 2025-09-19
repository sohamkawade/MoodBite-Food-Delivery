// Utility functions for handling image URLs

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://moodbite-food-delivery.onrender.com';
  }
  return 'http://localhost:5000';
};

// Process image URL to ensure it's absolute and correct for the environment
const processImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path, make it absolute
  if (imageUrl.startsWith('/')) {
    return `${getBaseUrl()}${imageUrl}`;
  }
  
  // If it's just a filename or path, prepend the base URL
  return `${getBaseUrl()}/${imageUrl}`;
};

// Process multiple image URLs
const processImageUrls = (imageUrls) => {
  if (Array.isArray(imageUrls)) {
    return imageUrls.map(processImageUrl);
  }
  return processImageUrl(imageUrls);
};

module.exports = {
  getBaseUrl,
  processImageUrl,
  processImageUrls
};
