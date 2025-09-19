import React, { useEffect, useMemo, useState } from 'react';
import { MdLocationOn, MdPayment, MdDiscount, MdHome, MdCreditCard, MdQrCode2, MdLocalShipping, MdSecurity } from 'react-icons/md';
import { cartAPI, ordersAPI, userAPI } from '../../services/api';
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
  const [pm, setPm] = useState('upi');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [savedCards, setSavedCards] = useState(() => {
    try {
      const raw = localStorage.getItem('savedCards');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [useNewCard, setUseNewCard] = useState(true);
  const [selectedSavedCard, setSelectedSavedCard] = useState(-1);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [altPhone, setAltPhone] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); 
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount, freeShipping }


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

  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax || 0;
  const amountForDelivery = subtotal + tax;
  const baseDeliveryFee = amountForDelivery < 200 ? 40 : amountForDelivery < 500 ? 20 : 0;

  const evaluateCoupon = (code, currSubtotal, currDeliveryFee) => {
    if (!code) return { discount: 0, freeShipping: false };
    const normalized = String(code).trim().toUpperCase();
    if (normalized === 'SAVE10') return { discount: Math.round(currSubtotal * 0.10), freeShipping: false };
    if (normalized === 'FREESHIP') return { discount: 0, freeShipping: true };
    if (normalized === 'FLAT50' && currSubtotal >= 299) return { discount: 50, freeShipping: false };
    return { discount: 0, freeShipping: false };
  };

  const effectiveCoupon = appliedCoupon || { discount: 0, freeShipping: false };
  const deliveryFee = effectiveCoupon.freeShipping ? 0 : baseDeliveryFee;
  const discountAmount = effectiveCoupon.discount || 0;
  const total = Math.max(0, subtotal + tax + deliveryFee - discountAmount);

  const fieldsOk = !!(address.street && address.city && address.state);
  const coordsOk = !!(address.coordinates?.latitude && address.coordinates?.longitude);
  const paymentOk = (() => {
    if (pm === 'card') {
      if (!useNewCard) return selectedSavedCard >= 0;
      const numberOk = (card.number || '').replace(/\s+/g,'').length >= 12;
      const nameOk = !!card.name;
      const expiryOk = /\d{2}\/\d{2}/.test(card.expiry || '');
      const cvvOk = (card.cvv || '').length >= 3;
      return numberOk && nameOk && expiryOk && cvvOk;
    }
    return true;
  })();
  const canPlaceOrder = items.length > 0 && fieldsOk && coordsOk && paymentOk;

  const validateCard = () => {
    if (pm !== 'upi' && pm !== 'card') return true;
    if (pm === 'upi') return true; // demo
    const ok = card.number.replace(/\s+/g,'').length >= 12 && card.name && /\d{2}\/\d{2}/.test(card.expiry) && card.cvv.length >= 3;
    if (!ok) toast('Please enter valid card details', { style: { background: '#ca8a04', color: '#fff' } });
    return ok;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



  const applyCoupon = () => {
    if (!couponCode) {
      setAppliedCoupon(null);
      toast('Enter a coupon code', { style: { background: '#ca8a04', color: '#fff' } });
      return;
    }
    const res = evaluateCoupon(couponCode, subtotal, baseDeliveryFee);
    if (res.discount > 0 || res.freeShipping) {
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), ...res });
      toast.success('Coupon applied');
    } else {
      setAppliedCoupon(null);
      toast('Invalid coupon', { style: { background: '#ca8a04', color: '#fff' } });
    }
  };

  const placeOrder = async () => {
    try {
      if (items.length === 0) {
        toast('Your cart is empty', { style: { background: '#ca8a04', color: '#fff' } });
        return;
      }
      if (pm !== 'cod' && !validateCard()) return;

      // Pick address to send
      const selectedAddress = address; // both modes keep address state in sync

      // Validate required address
      if (!selectedAddress.street || !selectedAddress.city || !selectedAddress.state) {
        toast('Please enter delivery address (street, city, state)', { style: { background: '#ca8a04', color: '#fff' } });
        return;
      }



      const payload = {
        orderType: 'delivery',
        paymentMethod: pm,
        deliveryAddress: selectedAddress,
        alternatePhone: altPhone || undefined,
        couponCode: appliedCoupon?.code || undefined,
        // no scheduling
      };

      // Save masked card for future if chosen
      if (pm === 'card' && useNewCard && saveNewCard) {
        const last4 = (card.number || '').replace(/\s+/g,'').slice(-4);
        const toSave = { last4, expiry: card.expiry, name: card.name };
        const updated = [...savedCards, toSave];
        setSavedCards(updated);
        try { localStorage.setItem('savedCards', JSON.stringify(updated)); } catch {}
      }
      if (pm === 'cod') {
        const res = await ordersAPI.placeOrder(payload);
        if (res.success) {
          toast.success('Order placed');
          window.location.href = '/orders';
        }
        return;
      }

      // For online payments, show demo payment modal 3s then place order
      setShowPaymentModal(true);
      setPaymentStatus('processing');
      await delay(5000);
      try {
        const res = await ordersAPI.placeOrder(payload);
        if (res.success) {
          setPaymentStatus('success');
          await delay(1000);
          toast.success('Order placed');
          window.location.href = '/orders';
          return;
        }
        setPaymentStatus('failed');
      } catch (err) {
        setPaymentStatus('failed');
        toast.error('Payment failed');
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
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg p-8 text-center">
            {paymentStatus === 'processing' && (
              <>
                <div className="mx-auto mb-6 w-20 h-20 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                <div className="text-lg font-semibold text-gray-900">Processing payment…</div>
                <div className="text-sm text-gray-600 mt-1">Please approve in your payment app</div>
              </>
            )}
            {paymentStatus === 'success' && (
              <>
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">✓</div>
                <div className="text-lg font-semibold text-gray-900">Payment successful</div>
                <div className="text-sm text-gray-600 mt-1">Placing your order…</div>
              </>
            )}
            {paymentStatus === 'failed' && (
              <>
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl">!</div>
                <div className="text-lg font-semibold text-gray-900">Payment failed</div>
                <div className="text-sm text-gray-600 mt-1">Please try again</div>
                <button onClick={() => { setShowPaymentModal(false); setPaymentStatus('idle'); }} className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Close</button>
              </>
            )}
          </div>
        </div>
      )}
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
                <h2 className="text-base md:text-lg font-bold text-gray-900">Payment</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">
                  <label className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:border-orange-400 ${pm==='upi'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                    <span className="text-gray-800 text-sm md:text-base flex items-center gap-2"><MdQrCode2 /> UPI</span>
                    <input type="radio" name="pm" value="upi" checked={pm==='upi'} onChange={() => setPm('upi')} />
                  </label>
                  <label className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:border-orange-400 ${pm==='card'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                    <span className="text-gray-800 text-sm md:text-base flex items-center gap-2"><MdCreditCard /> Card</span>
                    <input type="radio" name="pm" value="card" checked={pm==='card'} onChange={() => setPm('card')} />
                  </label>
                  <label className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:border-orange-400 ${pm==='cod'?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
                    <span className="text-gray-800 text-sm md:text-base flex items-center gap-2"><MdLocalShipping /> Cash on Delivery</span>
                    <input type="radio" name="pm" value="cod" checked={pm==='cod'} onChange={() => setPm('cod')} />
                  </label>
                </div>
                {pm === 'card' && (
                  <div className="mt-4 space-y-4">
                    {savedCards.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm md:text-base font-medium text-gray-800">Saved Cards</div>
                        {savedCards.map((c, idx) => (
                          <label key={idx} className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer ${!useNewCard && selectedSavedCard===idx ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                            <div className="text-sm md:text-base text-gray-700">•••• •••• •••• {c.last4} · Exp {c.expiry} · {c.name}</div>
                            <input type="radio" name="cardsel" checked={!useNewCard && selectedSavedCard===idx} onChange={()=>{setUseNewCard(false); setSelectedSavedCard(idx);}} />
                          </label>
                        ))}
                        <label className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer ${useNewCard ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                          <div className="text-sm md:text-base text-gray-700">Use new card</div>
                          <input type="radio" name="cardsel" checked={useNewCard} onChange={()=>{setUseNewCard(true); setSelectedSavedCard(-1);}} />
                        </label>
                      </div>
                    )}
                    {useNewCard && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <input className="border rounded-lg p-3 md:col-span-2 text-sm md:text-base" placeholder="Card Number" value={card.number} onChange={e=>setCard({...card, number:e.target.value})} />
                        <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="Name on Card" value={card.name} onChange={e=>setCard({...card, name:e.target.value})} />
                        <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="MM/YY" value={card.expiry} onChange={e=>setCard({...card, expiry:e.target.value})} />
                        <input className="border rounded-lg p-3 text-sm md:text-base" placeholder="CVV" value={card.cvv} onChange={e=>setCard({...card, cvv:e.target.value})} />
                        <label className="md:col-span-2 flex items-center gap-2 text-sm md:text-base text-gray-700">
                          <input type="checkbox" checked={saveNewCard} onChange={(e)=>setSaveNewCard(e.target.checked)} />
                          <span>Save this card for future</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
                {pm === 'upi' && (
                  <div className="mt-3 text-sm md:text-base text-gray-700">Enter UPI ID at demo gateway (skipped in demo).</div>
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
                {/* Coupon */}
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input className="flex-1 border rounded-lg p-2 text-sm md:text-base" placeholder="Coupon code" value={couponCode} onChange={(e)=>setCouponCode(e.target.value)} />
                  <button onClick={applyCoupon} className="px-3 py-2 bg-gray-900 text-white rounded-lg flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"><MdDiscount /> Apply</button>
                </div>
                {appliedCoupon && (
                  <div className="text-xs md:text-sm text-green-600">Applied {appliedCoupon.code}: {appliedCoupon.freeShipping ? 'Free Shipping' : `₹${appliedCoupon.discount} off`}</div>
                )}
                <div className="flex justify-between text-sm md:text-base"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm md:text-base"><span>Tax</span><span>₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm md:text-base"><span>Delivery</span><span>₹{deliveryFee.toFixed(2)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 text-sm md:text-base"><span>Discount</span><span>-₹{discountAmount.toFixed(2)}</span></div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base md:text-lg"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                <button
                  onClick={placeOrder}
                  disabled={!(address.street && address.city && address.state)}
                  className={`mt-5 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:from-orange-600 hover:to-red-600 disabled:opacity-50`}
                >
                  Place Order · ₹{total.toFixed(2)}
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


