export const testRazorpayLoading = async () => {
  console.log('Testing Razorpay loading...');
  
  try {
    if (window.Razorpay) {
      return true;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    return new Promise((resolve) => {
      script.onload = () => {
        setTimeout(() => {
          if (window.Razorpay) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 1000);
      };
      
      script.onerror = () => {
        resolve(false);
      };

      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ Error testing Razorpay:', error);
    return false;
  }
};

if (typeof window !== 'undefined') {
  window.testRazorpay = testRazorpayLoading;
}
