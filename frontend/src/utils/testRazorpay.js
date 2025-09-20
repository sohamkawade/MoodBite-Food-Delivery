// Test utility to verify Razorpay loading
export const testRazorpayLoading = async () => {
  console.log('Testing Razorpay loading...');
  
  try {
    // Check if already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay already loaded');
      return true;
    }

    // Try to load
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    return new Promise((resolve) => {
      script.onload = () => {
        setTimeout(() => {
          if (window.Razorpay) {
            console.log('✅ Razorpay loaded successfully');
            resolve(true);
          } else {
            console.log('❌ Razorpay script loaded but not available');
            resolve(false);
          }
        }, 1000);
      };
      
      script.onerror = () => {
        console.log('❌ Failed to load Razorpay script');
        resolve(false);
      };

      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ Error testing Razorpay:', error);
    return false;
  }
};

// Run test in console
if (typeof window !== 'undefined') {
  window.testRazorpay = testRazorpayLoading;
}
