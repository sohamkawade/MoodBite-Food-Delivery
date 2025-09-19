import React, { useEffect, useMemo, useState } from 'react';
import { MdLocationOn, MdPayment, MdHome, MdLocalShipping, MdSecurity, MdCreditCard } from 'react-icons/md';
import { cartAPI, ordersAPI, userAPI, paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'India', instructions: '',
    coordinates: { latitude: null, longitude: null }
  });
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'new'
  const [pm, setPm] = useState('cash');
  const [altPhone, setAltPhone] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); 
  const [loading, setLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);


  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const cartRes = await cartAPI.getUserCart();
        if (cartRes.success) {
          setCart(cartRes.data);
          setItems(cartRes.data.items || []);
        }
        const prof = await userAPI.getProfile();
        const profUser = prof?.data?.user || prof?.data; // accommodate controller response shape
        if (prof?.success && profUser?.addresses?.length) {
          const def = profUser.addresses.find(a => a.isDefault) || profUser.addresses[0];
          if (def?.address) {
            setAddress(prev => ({ ...prev, ...def.address }));
            setHasSavedAddress(true);
            setAddressMode('saved');
            const coords = def.address.coordinates;
            if (!coords || !coords.latitude || !coords.longitude) {

            }
          }
        } else {
          setAddressMode('new');
        }
      } catch (e) {
        console.error('Failed to load checkout data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax || 0;
  const amountForDelivery = subtotal + tax;
  const baseDeliveryFee = amountForDelivery < 200 ? 40 : amountForDelivery < 500 ? 20 : 0;

  const deliveryFee = baseDeliveryFee;
  const total = subtotal + tax + deliveryFee;

  const fieldsOk = !!(address.street && address.city && address.state);
  const coordsOk = !!(address.coordinates?.latitude && address.coordinates?.longitude);
  const paymentOk = pm === 'cash' || (pm === 'razorpay' && razorpayLoaded);
  const canPlaceOrder = items.length > 0 && fieldsOk && coordsOk && paymentOk;

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    try {
      // Create Razorpay order
      const orderResponse = await paymentAPI.createRazorpayOrder(total, `order_${Date.now()}`);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { id: order_id, amount, currency, key } = orderResponse.data;

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'MoodBite',
        description: 'Food Order Payment',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await paymentAPI.verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResponse.success) {
              // Place order with payment details
              await placeOrderWithPayment('razorpay', response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@moodbite.com',
          contact: '9999999999'
        },
        theme: {
          color: '#f97316'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast.error('Failed to initiate payment');
    }
  };




  const placeOrderWithPayment = async (paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {
      const selectedAddress = address;
      
      const payload = {
        orderType: 'delivery',
        paymentMethod: paymentMethod,
        deliveryAddress: selectedAddress,
        alternatePhone: altPhone || undefined,
        ...(paymentMethod === 'razorpay' && {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        })
      };

      const res = await ordersAPI.placeOrder(payload);
      if (res.success) {
        toast.success('Order placed successfully!');
        window.location.href = '/orders';
      } else {
        throw new Error(res.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Place order failed:', error);
      toast.error('Failed to place order');
    }
  };

  const placeOrder = async () => {
    try {
      if (items.length === 0) {
        toast('Your cart is empty', { style: { background: '#ca8a04', color: '#fff' } });
        return;
      }

      // Validate required address
      if (!address.street || !address.city || !address.state) {
        toast('Please enter delivery address (street, city, state)', { style: { background: '#ca8a04', color: '#fff' } });
        return;
      }

      if (pm === 'cash') {
        await placeOrderWithPayment('cash');
      } else if (pm === 'razorpay') {
        if (!razorpayLoaded) {
          toast.error('Payment system is loading, please wait...');
          return;
        }
        await handleRazorpayPayment();
      }
    } catch (e) {
      console.error('Place order failed', e);
      toast.error('Failed to place order');
    }
  };

  if (loading) {
    return (<div className="min-h-screen backcolor pt-16"><div className="max-w-5xl mx-auto px-4 py-8 md:py-12 text-sm md:text-base">Loading checkout...</div></div>);
  }

  // Render
  return (
    <div className="min-h-screen backcolor pt-14 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 lg:py-12">
        <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 lg:gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-5 md:space-y-8 lg:space-y-8">
            {/* Address */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-2">
                <MdLocationOn className="text-orange-600" size={20} />
                <h2 className="text-base md:text-lg font-bold text-gray-900">Delivery Address</h2>
              </div>
              <div className="p-4 md:p-6 space-y-4">

                {hasSavedAddress && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className={`flex-1 border rounded-lg p-4 cursor-pointer hover:border-orange-400 ${addressMode==='saved'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                      <div className="flex justify-between items-center gap-3">
                        <div className="text-sm md:text-[15px] text-gray-800">
                          <div className="font-semibold mb-1">Saved Address</div>
                          <div>{address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}</div>
                        </div>
                        <input type="radio" name="addr" checked={addressMode==='saved'} onChange={() => setAddressMode('saved')} />
                      </div>
                    </label>
                    <label className={`flex-1 border rounded-lg p-4 cursor-pointer hover:border-orange-400 ${addressMode==='new'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                      <div className="flex justify-between items-center gap-3">
                        <div className="text-sm md:text-[15px] text-gray-800">
                          <div className="font-semibold mb-1">New Address</div>
                          <div>Enter a new address</div>
                        </div>
                        <input type="radio" name="addr" checked={addressMode==='new'} onChange={() => setAddressMode('new')} />
                      </div>
                    </label>
                  </div>
                )}
                {(addressMode === 'new' || !hasSavedAddress) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <input className="border rounded-lg p-3 md:col-span-2 text-sm md:text-base" placeholder="House/Flat Number & Building/Apartment Name" value={address.street} onChange={e=>setAddress({...address, street:e.target.value})} />
                    <input className="border rounded-lg p-3 md:col-span-2 text-sm md:text-base" placeholder="Street / Locality / Landmark" value={address.landmark || ''} onChange={e=>setAddress({...address, landmark:e.target.value})} />
                    <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="City" value={address.city} onChange={e=>setAddress({...address, city:e.target.value})} />
                    <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="Pincode" value={address.zipCode} onChange={e=>setAddress({...address, zipCode:e.target.value})} />
                    <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="State (optional)" value={address.state} onChange={e=>setAddress({...address, state:e.target.value})} />
                    <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="Country" value={address.country} onChange={e=>setAddress({...address, country:e.target.value})} />

                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                  <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="Alternate Mobile Number (backup)" value={altPhone} onChange={e=>setAltPhone(e.target.value)} />
                  <input className="border rounded-lg p-3 md:col-span-1 text-sm md:text-base" placeholder="Delivery Instructions (e.g. 'Leave at door', 'Call on arrival')" value={address.instructions || ''} onChange={e=>setAddress({...address, instructions:e.target.value})} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-2">
                <MdPayment className="text-orange-600" size={20} />
                <h2 className="text-base md:text-lg font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">
                  <label className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:border-orange-400 ${pm==='cash'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                    <span className="text-gray-800 text-sm md:text-base flex items-center gap-2">
                      <MdLocalShipping className="text-green-600" size={20} /> 
                      Cash on Delivery
                    </span>
                    <input type="radio" name="pm" value="cash" checked={pm==='cash'} onChange={() => setPm('cash')} />
                  </label>
                  <label className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:border-orange-400 ${pm==='razorpay'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                    <span className="text-gray-800 text-sm md:text-base flex items-center gap-2">
                      <MdCreditCard className="text-blue-600" size={20} /> 
                      Online Payment (Razorpay)
                    </span>
                    <input type="radio" name="pm" value="razorpay" checked={pm==='razorpay'} onChange={() => setPm('razorpay')} />
                  </label>
                </div>
                
                {pm === 'cash' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <MdLocalShipping size={16} />
                      <span>Pay when your order arrives at your doorstep</span>
                    </div>
                  </div>
                )}
                
                {pm === 'razorpay' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <MdCreditCard size={16} />
                      <span>Secure online payment via Razorpay (Cards, UPI, Net Banking, Wallets)</span>
                    </div>
                    {!razorpayLoaded && (
                      <div className="mt-2 text-xs text-orange-600">
                        Loading payment system...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1 space-y-5 md:space-y-6 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Price Details</h2>
              </div>
              <div className="p-4 md:p-6 space-y-2 text-gray-700">
                <div className="flex justify-between text-sm md:text-base"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm md:text-base"><span>Tax</span><span>₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm md:text-base"><span>Delivery</span><span>₹{deliveryFee.toFixed(2)}</span></div>
                <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base md:text-lg"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                <button
                  onClick={placeOrder}
                  disabled={!canPlaceOrder}
                  className={`mt-5 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pm === 'cash' ? 'Place Order (Cash on Delivery)' : 'Pay & Place Order'} · ₹{total.toFixed(2)}
                </button>
                <div className="text-[10px] md:text-[11px] text-gray-500 text-center mt-1 flex items-center justify-center gap-1"><MdSecurity /> Safe & Secure Payments by MoodBite Pay</div>
                <button onClick={async ()=>{
                  try {
                    const prof = await userAPI.getProfile();
                    const user = prof?.data?.user || prof?.data;
                    const existing = Array.isArray(user?.addresses) ? user.addresses : [];

                    const normalize = (entry)=>{
                      const a = entry?.address || {};
                      return [
                        (a.street||'').trim().toLowerCase(),
                        (a.landmark||'').trim().toLowerCase(),
                        (a.city||'').trim().toLowerCase(),
                        (a.zipCode||'').trim(),
                        (a.state||'').trim().toLowerCase(),
                        (a.country||'').trim().toLowerCase()
                      ].join('|');
                    };

                    const targetKey = normalize({ address });
                    const matchIdx = existing.findIndex(a => normalize(a) === targetKey);

                    let newAddresses;
                    if (matchIdx >= 0) {
                      // Make the matching address default and update fields
                      newAddresses = existing.map((a, i) => i === matchIdx 
                        ? { ...a, address: { ...address }, isDefault: true }
                        : { ...a, isDefault: false }
                      );
                    } else if (existing.length > 0) {
                      // Replace current default if present, else append as new default
                      const defIdx = existing.findIndex(a => a.isDefault);
                      if (defIdx >= 0) {
                        newAddresses = existing.map((a,i) => i === defIdx 
                          ? { ...a, address: { ...address }, isDefault: true }
                          : { ...a, isDefault: false }
                        );
                      } else {
                        newAddresses = [
                          ...existing.map(a => ({ ...a, isDefault: false })),
                          { type: 'home', address: { ...address }, isDefault: true }
                        ];
                      }
                    } else {
                      // No addresses yet
                      newAddresses = [{ type: 'home', address: { ...address }, isDefault: true }];
                    }

                    await userAPI.updateProfile({ addresses: newAddresses });
                    setHasSavedAddress(true);
                    setAddressMode('saved');
                    toast.success('Address saved');
                  } catch(e){
                    toast.error('Failed to save address');
                  }
                }} className="mt-3 w-full bg-gray-100 text-gray-700 py-3 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-200">Save Address</button>
              </div>
            </div>

            {/* Items preview */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Items</h2>
              </div>
              <div className="divide-y">
                {items.map((it) => {
                  const m = it.menuItem || {};
                  const price = m.discountedPrice || m.price || 0;
                  return (
                    <div key={it._id} className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
                      {m.image ? <img src={m.image} className="w-12 h-12 md:w-14 md:h-14 rounded object-cover" /> : <div className="w-12 h-12 md:w-14 md:h-14 rounded bg-gray-200" />}
                      <div className="flex-1">
                        <div className="text-sm md:text-base font-semibold text-gray-900 truncate">{m.name}</div>
                        <div className="text-xs md:text-sm text-gray-600">Qty: {it.quantity}</div>
                      </div>
                      <div className="text-sm md:text-base font-semibold text-gray-900">₹{(price * (it.quantity||0)).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


