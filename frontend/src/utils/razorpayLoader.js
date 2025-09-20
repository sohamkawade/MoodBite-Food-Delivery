import React from 'react';

// Utility function to load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      resolve(true);
      return;
    }

    console.log('Loading Razorpay script...');

    // Remove any existing Razorpay scripts to avoid conflicts
    const existingScripts = document.querySelectorAll('script[src*="checkout.razorpay.com"]');
    existingScripts.forEach(script => script.remove());

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      // Wait a bit for Razorpay to initialize
      setTimeout(() => {
        if (window.Razorpay) {
          console.log('Razorpay is now available');
          resolve(true);
        } else {
          console.error('Razorpay script loaded but window.Razorpay not available');
          // Try alternative loading method
          loadRazorpayAlternative().then(resolve).catch(reject);
        }
      }, 1000);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      // Try alternative loading method
      loadRazorpayAlternative().then(resolve).catch(reject);
    };

    document.head.appendChild(script);

    // Fallback timeout
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error('Razorpay failed to load within timeout');
        loadRazorpayAlternative().then(resolve).catch(reject);
      }
    }, 10000);
  });
};

const loadRazorpayAlternative = () => {
  return new Promise((resolve, reject) => {
    console.log('Trying alternative Razorpay loading method...');
    
    // Try loading with different attributes
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setTimeout(() => {
        if (window.Razorpay) {
          console.log('Razorpay loaded via alternative method');
          resolve(true);
        } else {
          console.error('Alternative loading also failed');
          reject(new Error('Razorpay failed to load'));
        }
      }, 2000);
    };
    
    script.onerror = () => {
      console.error('Alternative loading failed');
      reject(new Error('Razorpay failed to load'));
    };

    document.body.appendChild(script);
  });
};

// Hook to use Razorpay loading in React components
export const useRazorpayLoader = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadScript = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadRazorpayScript();
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load Razorpay:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadScript();
  }, []);

  return { isLoaded, isLoading, error };
};
