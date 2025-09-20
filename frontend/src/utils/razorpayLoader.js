import React from 'react';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Utility function to load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      resolve(true);
      return;
    }

    console.log('Loading Razorpay script!');

    // Check if script is already in HTML (from index.html)
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      console.log('Razorpay script found in HTML, checking if already loaded...');
      
      // First check if it's already loaded
      if (window.Razorpay) {
        console.log('Razorpay already loaded from HTML script');
        resolve(true);
        return;
      }
      
      // Check if the script has finished loading
      if (existingScript.readyState === 'complete' || existingScript.readyState === 'loaded') {
        console.log('HTML script finished loading, checking Razorpay availability...');
        let attempts = 0;
        const maxAttempts = 10; // 5 seconds max
        
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            console.log('Razorpay loaded from HTML script');
            resolve(true);
          } else if (attempts >= maxAttempts) {
            console.log('HTML script loaded but Razorpay not available, trying dynamic loading...');
            loadRazorpayAlternative()
              .then(resolve)
              .catch(() => {
                console.log('Dynamic loading failed, trying final fallback...');
                loadRazorpayFinalFallback().then(resolve).catch(reject);
              });
          } else {
            setTimeout(checkRazorpay, 500);
          }
        };
        checkRazorpay();
        return;
      }
      
      // Script is still loading, wait for it
      console.log('HTML script still loading, waiting...');
      existingScript.onload = () => {
        console.log('HTML script loaded, checking Razorpay availability...');
        let attempts = 0;
        const maxAttempts = 10; // 5 seconds max
        
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            console.log('Razorpay loaded from HTML script');
            resolve(true);
          } else if (attempts >= maxAttempts) {
            console.log('HTML script loaded but Razorpay not available, trying dynamic loading...');
            loadRazorpayAlternative()
              .then(resolve)
              .catch(() => {
                console.log('Dynamic loading failed, trying final fallback...');
                loadRazorpayFinalFallback().then(resolve).catch(reject);
              });
          } else {
            setTimeout(checkRazorpay, 500);
          }
        };
        checkRazorpay();
      };
      
      existingScript.onerror = () => {
        console.log('HTML script failed to load, trying dynamic loading...');
        loadRazorpayAlternative()
          .then(resolve)
          .catch(() => {
            console.log('Dynamic loading failed, trying final fallback...');
            loadRazorpayFinalFallback().then(resolve).catch(reject);
          });
      };
      
      // Fallback timeout
      setTimeout(() => {
        if (!window.Razorpay) {
          console.log('HTML script timeout, trying dynamic loading...');
          loadRazorpayAlternative()
            .then(resolve)
            .catch(() => {
              console.log('Dynamic loading failed, trying final fallback...');
              loadRazorpayFinalFallback().then(resolve).catch(reject);
            });
        }
      }, 10000);
      
      return;
    }

    // Remove any existing dynamically loaded Razorpay scripts to avoid conflicts
    const existingDynamicScripts = document.querySelectorAll('script[src*="checkout.razorpay.com"]:not([data-razorpay-html])');
    existingDynamicScripts.forEach(script => script.remove());

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.type = 'text/javascript';
    
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
      }, 2000);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      // Try alternative loading method
      loadRazorpayAlternative().then(resolve).catch(reject);
    };

    // Try to append to head first, fallback to body
    if (document.head) {
      document.head.appendChild(script);
    } else {
      document.body.appendChild(script);
    }

    // Fallback timeout
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error('Razorpay failed to load within timeout');
        loadRazorpayAlternative().then(resolve).catch(reject);
      }
    }, 15000);
  });
};

const loadRazorpayAlternative = () => {
  return new Promise((resolve, reject) => {
    console.log('Trying alternative Razorpay loading method...');
    
    // Remove the slow HTML script first
    const htmlScript = document.querySelector('script[data-razorpay-html]');
    if (htmlScript) {
      htmlScript.remove();
      console.log('Removed slow HTML script');
    }
    
    // Try loading with different attributes
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.type = 'text/javascript';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.defer = true;
    
    script.onload = () => {
      console.log('Alternative script loaded, checking Razorpay availability...');
      let attempts = 0;
      const maxAttempts = 10; // 5 seconds max
      
      const checkRazorpay = () => {
        attempts++;
        if (window.Razorpay) {
          console.log('Razorpay loaded via alternative method');
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.error('Alternative loading timeout - Razorpay not available');
          reject(new Error('Razorpay failed to load after timeout'));
        } else {
          setTimeout(checkRazorpay, 500);
        }
      };
      checkRazorpay();
    };
    
    script.onerror = (error) => {
      console.error('Alternative loading failed:', error);
      reject(new Error('Razorpay script failed to load'));
    };

    // Add to head for faster loading
    if (document.head) {
      document.head.appendChild(script);
    } else {
      document.body.appendChild(script);
    }
  });
};

const loadRazorpayFinalFallback = () => {
  return new Promise((resolve, reject) => {
    console.log('Trying final fallback method...');
    
    // Try a completely different approach - use fetch to load the script
    fetch('https://checkout.razorpay.com/v1/checkout.js')
      .then(response => response.text())
      .then(scriptText => {
        console.log('Fetched Razorpay script, evaluating...');
        try {
          // Create a new script element and set its content
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.text = scriptText;
          document.head.appendChild(script);
          
          // Wait for Razorpay to be available
          let attempts = 0;
          const maxAttempts = 20; // 10 seconds max
          
          const checkRazorpay = () => {
            attempts++;
            if (window.Razorpay) {
              console.log('Razorpay loaded via final fallback method');
              resolve(true);
            } else if (attempts >= maxAttempts) {
              console.error('Final fallback also failed');
              reject(new Error('All Razorpay loading methods failed'));
            } else {
              setTimeout(checkRazorpay, 500);
            }
          };
          checkRazorpay();
        } catch (error) {
          console.error('Error evaluating Razorpay script:', error);
          reject(error);
        }
      })
      .catch(error => {
        console.error('Failed to fetch Razorpay script:', error);
        reject(error);
      });
  });
};

// Hook to use Razorpay loading in React components
export const useRazorpayLoader = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    const loadScript = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadRazorpayScript();
        setIsLoaded(true);
        setRetryCount(0);
      } catch (err) {
        console.error('Failed to load Razorpay:', err);
        setError(err.message);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            loadScript();
          }, delay);
        } else {
          setIsLoading(false);
        }
      } finally {
        if (retryCount >= 3) {
          setIsLoading(false);
        }
      }
    };

    loadScript();
  }, [retryCount]);

  return { isLoaded, isLoading, error, retryCount };
};
