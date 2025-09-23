import React from 'react';

const isProduction = process.env.NODE_ENV === 'production';

export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      if (existingScript.readyState === 'complete' || existingScript.readyState === 'loaded') {
        let attempts = 0;
        const maxAttempts = 10;
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
            loadRazorpayAlternative()
              .then(resolve)
              .catch(() => {
                loadRazorpayFinalFallback().then(resolve).catch(reject);
              });
          } else {
            setTimeout(checkRazorpay, 500);
          }
        };
        checkRazorpay();
        return;
      }

      existingScript.onload = () => {
        let attempts = 0;
        const maxAttempts = 10;
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
            loadRazorpayAlternative()
              .then(resolve)
              .catch(() => {
                loadRazorpayFinalFallback().then(resolve).catch(reject);
              });
          } else {
            setTimeout(checkRazorpay, 500);
          }
        };
        checkRazorpay();
      };

      existingScript.onerror = () => {
        loadRazorpayAlternative()
          .then(resolve)
          .catch(() => {
            loadRazorpayFinalFallback().then(resolve).catch(reject);
          });
      };

      setTimeout(() => {
        if (!window.Razorpay) {
          const newScript = document.createElement('script');
          newScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
          newScript.type = 'text/javascript';
          newScript.async = true;
          newScript.crossOrigin = 'anonymous';

          newScript.onload = () => {
            let attempts = 0;
            const maxAttempts = 10;
            const checkRazorpay = () => {
              attempts++;
              if (window.Razorpay) {
                resolve(true);
              } else if (attempts >= maxAttempts) {
                loadRazorpayAlternative()
                  .then(resolve)
                  .catch(() => {
                    loadRazorpayFinalFallback().then(resolve).catch(reject);
                  });
              } else {
                setTimeout(checkRazorpay, 500);
              }
            };
            checkRazorpay();
          };

          newScript.onerror = () => {
            loadRazorpayAlternative()
              .then(resolve)
              .catch(() => {
                loadRazorpayFinalFallback().then(resolve).catch(reject);
              });
          };

          document.head.appendChild(newScript);
        }
      }, 8000);

      return;
    }

    const existingDynamicScripts = document.querySelectorAll('script[src*="checkout.razorpay.com"]:not([data-razorpay-html])');
    existingDynamicScripts.forEach(script => script.remove());

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.type = 'text/javascript';

    script.onload = () => {
      setTimeout(() => {
        if (window.Razorpay) {
          resolve(true);
        } else {
          loadRazorpayAlternative().then(resolve).catch(reject);
        }
      }, 2000);
    };

    script.onerror = () => {
      loadRazorpayAlternative().then(resolve).catch(reject);
    };

    if (document.head) {
      document.head.appendChild(script);
    } else {
      document.body.appendChild(script);
    }

    setTimeout(() => {
      if (!window.Razorpay) {
        loadRazorpayAlternative().then(resolve).catch(reject);
      }
    }, 15000);
  });
};

const loadRazorpayAlternative = () => {
  return new Promise((resolve, reject) => {
    const htmlScript = document.querySelector('script[data-razorpay-html]');
    if (htmlScript) {
      htmlScript.remove();
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.type = 'text/javascript';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.defer = true;

    script.onload = () => {
      let attempts = 0;
      const maxAttempts = 10;
      const checkRazorpay = () => {
        attempts++;
        if (window.Razorpay) {
          resolve(true);
        } else if (attempts >= maxAttempts) {
          reject(new Error('Razorpay failed to load after timeout'));
        } else {
          setTimeout(checkRazorpay, 500);
        }
      };
      checkRazorpay();
    };

    script.onerror = () => {
      reject(new Error('Razorpay script failed to load'));
    };

    if (document.head) {
      document.head.appendChild(script);
    } else {
      document.body.appendChild(script);
    }
  });
};

const loadRazorpayFinalFallback = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.type = 'text/javascript';
    script.async = false;
    script.crossOrigin = 'anonymous';

    document.head.appendChild(script);

    let attempts = 0;
    const maxAttempts = 20;
    const checkRazorpay = () => {
      attempts++;
      if (window.Razorpay) {
        resolve(true);
      } else if (attempts >= maxAttempts) {
        reject(new Error('All Razorpay loading methods failed'));
      } else {
        setTimeout(checkRazorpay, 500);
      }
    };
    checkRazorpay();

    script.onload = () => {
      checkRazorpay();
    };

    script.onerror = () => {
      reject(new Error('Final fallback script failed to load'));
    };
  });
};

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
        setError(err.message);
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
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
