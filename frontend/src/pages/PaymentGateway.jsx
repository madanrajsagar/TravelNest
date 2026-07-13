import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, QrCode, Building2, Smartphone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

export const PaymentGateway = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('orderId');
  const listingId = searchParams.get('listingId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');

  const [activeMethod, setActiveMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'qr'
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);

  // Form Fields
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // QR Timer Countdown (5 Minutes)
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (activeMethod === 'qr') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeMethod]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      setCardExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
    } else {
      setCardExpiry(val);
    }
  };

  // Processing animations step-by-step
  const processingSteps = [
    'Connecting to Secure Payment Bank Gateway...',
    'Verifying Security Authentications...',
    'Decrypting Transaction Logs...',
    'Confirming Simulated Account Reserves...'
  ];

  useEffect(() => {
    if (processing) {
      const stepTimer = setInterval(() => {
        setProcessStep((prev) => {
          if (prev < processingSteps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(stepTimer);
            // Redirect to developer simulator page
            const methodLabel = activeMethod.toUpperCase();
            navigate(
              `/bookings/payment-simulator?orderId=${orderId}&listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}&totalPrice=${totalPrice}&method=${methodLabel}`
            );
            return prev;
          }
        });
      }, 950);
      return () => clearInterval(stepTimer);
    }
  }, [processing]);

  const handlePay = (e) => {
    e.preventDefault();

    if (activeMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g., user@upi).');
        return;
      }
    } else if (activeMethod === 'card') {
      if (cardNumber.length < 19) {
        toast.error('Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        toast.error('Please enter expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter a valid CVV.');
        return;
      }
      if (!cardName.trim()) {
        toast.error('Please enter the cardholder name.');
        return;
      }
    } else if (activeMethod === 'netbanking') {
      if (!selectedBank) {
        toast.error('Please select your preferred net banking provider.');
        return;
      }
    }

    setProcessing(true);
    setProcessStep(0);
  };

  const getCardType = () => {
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    return 'Card';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 relative min-h-[60vh] animate-in fade-in duration-300">
      
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
        <span>1. Summary</span>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <span className="text-brand-rose">2. Checkout</span>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <span>3. Confirmation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Selector */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col sm:flex-row">
          
          {/* Sidebar Menu */}
          <div className="w-full sm:w-1/3 bg-slate-50 border-r border-slate-100 p-2 flex flex-col gap-1">
            <div className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Methods
            </div>
            
            <button
              onClick={() => setActiveMethod('upi')}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-bold text-left cursor-pointer transition-all ${
                activeMethod === 'upi'
                  ? 'bg-white text-brand-rose shadow-sm border border-slate-100'
                  : 'text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>UPI / App pay</span>
            </button>

            <button
              onClick={() => setActiveMethod('qr')}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-bold text-left cursor-pointer transition-all ${
                activeMethod === 'qr'
                  ? 'bg-white text-brand-rose shadow-sm border border-slate-100'
                  : 'text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR Code</span>
            </button>

            <button
              onClick={() => setActiveMethod('card')}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-bold text-left cursor-pointer transition-all ${
                activeMethod === 'card'
                  ? 'bg-white text-brand-rose shadow-sm border border-slate-100'
                  : 'text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Credit / Debit Card</span>
            </button>

            <button
              onClick={() => setActiveMethod('netbanking')}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-bold text-left cursor-pointer transition-all ${
                activeMethod === 'netbanking'
                  ? 'bg-white text-brand-rose shadow-sm border border-slate-100'
                  : 'text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Net Banking</span>
            </button>
          </div>

          {/* Form Content area */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <form onSubmit={handlePay} className="flex-1 flex flex-col justify-between">
              
              {/* Method Render Panels */}
              {activeMethod === 'upi' && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-extrabold text-slate-800 text-sm">Pay using Virtual Payment Address (UPI)</h4>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label htmlFor="upi" className="text-[10px] font-bold text-slate-400 uppercase pl-0.5">UPI ID</label>
                    <input
                      type="text"
                      id="upi"
                      placeholder="username@okaxis"
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed pl-0.5">
                    A verification transaction request will be simulated on your linked UPI application.
                  </p>
                </div>
              )}

              {activeMethod === 'qr' && (
                <div className="flex flex-col items-center text-center gap-4 py-2">
                  <h4 className="font-extrabold text-slate-800 text-sm leading-none">Scan QR using GPay / PhonePe / BHIM</h4>
                  
                  {/* QR Image Simulation */}
                  <div className="relative border border-slate-100 p-3 bg-white rounded-2xl shadow-sm mt-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=travelnest@paytm%26pn=TravelNest%26am=${totalPrice}`}
                      className="h-32 w-32 object-contain"
                      alt="TravelNest QR Scan code"
                    />
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-2xs rounded-2xl flex items-center justify-center pointer-events-none" />
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">QR Expiration Timer</span>
                    <span className="text-sm font-extrabold text-brand-rose font-mono">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              )}

              {activeMethod === 'card' && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-extrabold text-slate-800 text-sm">Pay using Credit / Debit Card</h4>
                  
                  <div className="flex flex-col gap-3.5 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase pl-0.5">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
                        value={cardNumber}
                        maxLength="19"
                        onChange={handleCardNumberChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase pl-0.5">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
                          value={cardExpiry}
                          maxLength="5"
                          onChange={handleExpiryChange}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase pl-0.5">CVV Code</label>
                        <input
                          type="password"
                          placeholder="***"
                          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
                          value={cardCvv}
                          maxLength="3"
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase pl-0.5">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeMethod === 'netbanking' && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-extrabold text-slate-800 text-sm">Select Bank Provider Account</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    {[
                      { id: 'sbi', name: 'State Bank of India' },
                      { id: 'hdfc', name: 'HDFC Bank' },
                      { id: 'icici', name: 'ICICI Bank' },
                      { id: 'axis', name: 'Axis Bank' },
                      { id: 'kotak', name: 'Kotak Mahindra' },
                      { id: 'pnb', name: 'Punjab National' }
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedBank === bank.id
                            ? 'border-brand-rose bg-rose-50/10 text-brand-rose font-bold'
                            : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-semibold">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Secure simulated validation trigger button */}
              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-slate-800 hover:shadow-md active:scale-98 mt-8 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>Simulate Pay &#8377;{totalPrice?.toLocaleString('en-IN')}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Mini Bill details */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col gap-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-2">Receipt Details</h4>
            
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <span className="text-slate-800 font-mono">{orderId?.substring(0, 15)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="text-slate-800 font-bold uppercase">{activeMethod}</span>
              </div>
              <hr className="border-slate-50" />
              <div className="flex justify-between text-sm font-extrabold text-slate-900">
                <span>Amount:</span>
                <span>&#8377;{totalPrice?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-start text-[10px] text-slate-400 font-semibold pl-1 leading-relaxed">
            <AlertCircle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <span>
              This is a secure mock payment simulator. Do not enter actual credit card credentials or banking password keys.
            </span>
          </div>
        </div>

      </div>

      {/* Full-Screen Glassmorphic Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="rounded-2xl bg-white p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-6 border border-slate-100">
            {/* Spinning Loader */}
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
            
            <div className="flex flex-col gap-2">
              <h4 className="font-extrabold text-slate-900 text-base">Processing Transaction...</h4>
              <p className="text-xs font-semibold text-slate-400 min-h-[32px] max-w-xs leading-relaxed px-2">
                {processingSteps[processStep]}
              </p>
            </div>
            
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              TravelNest Simulator
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
export default PaymentGateway;
