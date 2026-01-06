import React, { useState, useEffect, useRef } from 'react';

// Letter types
const LETTER_TYPES = {
  BANK_DISPUTE: {
    name: 'Bank/Card Dispute',
    description: 'Dispute a charge with your credit card company or bank',
    icon: '🏦'
  },
  MERCHANT_REFUND: {
    name: 'Merchant Refund Request',
    description: 'Request a refund directly from a merchant or company',
    icon: '🏪'
  }
};

// Dispute reasons for bank disputes
const DISPUTE_REASONS = {
  UNAUTHORIZED: {
    name: 'Unauthorized/Fraudulent Charge',
    description: 'A charge you did not make or authorize',
    tips: ['Report immediately if card was lost/stolen', 'Federal law limits liability to $50 for credit cards', 'Check for other suspicious activity']
  },
  NOT_RECEIVED: {
    name: 'Item/Service Not Received',
    description: 'You paid but never received the product or service',
    tips: ['Document expected vs actual delivery date', 'Include any tracking information', 'Note attempts to contact the merchant']
  },
  NOT_AS_DESCRIBED: {
    name: 'Not As Described/Defective',
    description: 'Product or service differs significantly from what was advertised',
    tips: ['Take photos of the item received', 'Save the original listing/description', 'Document the specific differences']
  },
  DUPLICATE_CHARGE: {
    name: 'Duplicate/Incorrect Amount',
    description: 'Charged twice or charged the wrong amount',
    tips: ['Note both charge dates and amounts', 'Include the correct amount if overcharged', 'Check if one charge is pending vs posted']
  },
  CANCELLED_RECURRING: {
    name: 'Cancelled Subscription Still Charged',
    description: 'Charged for a subscription you already cancelled',
    tips: ['Include cancellation confirmation if available', 'Note the date you cancelled', 'Reference any confirmation numbers']
  },
  REFUND_NOT_PROCESSED: {
    name: 'Refund Not Received',
    description: 'Merchant agreed to refund but it was never processed',
    tips: ['Include refund confirmation/promise', 'Note how long you have waited', 'Document merchant communications']
  }
};

// Refund reasons for merchant requests
const REFUND_REASONS = {
  DEFECTIVE: {
    name: 'Defective/Damaged Product',
    description: 'Item arrived broken, damaged, or does not work',
    tips: ['Take photos before and after opening', 'Keep all original packaging', 'Note if damage was visible on delivery']
  },
  NOT_AS_DESCRIBED: {
    name: 'Not As Described',
    description: 'Product differs from the listing or advertisement',
    tips: ['Screenshot the original listing', 'Document specific differences', 'Compare advertised vs received specs']
  },
  NOT_DELIVERED: {
    name: 'Never Received',
    description: 'Order was never delivered',
    tips: ['Check tracking status', 'Verify delivery address was correct', 'Note expected delivery date']
  },
  SERVICE_NOT_RENDERED: {
    name: 'Service Not Provided',
    description: 'Paid for a service that was not delivered',
    tips: ['Document the agreed service terms', 'Note any missed appointments', 'Include contract or agreement details']
  },
  SUBSCRIPTION_ISSUE: {
    name: 'Subscription/Billing Issue',
    description: 'Unwanted renewal, trial conversion, or billing error',
    tips: ['Note when you expected billing to stop', 'Include any cancellation attempts', 'Reference terms of service']
  },
  DISSATISFACTION: {
    name: 'General Dissatisfaction',
    description: 'Product or service did not meet expectations',
    tips: ['Check the return policy first', 'Be specific about the issue', 'Propose a reasonable resolution']
  }
};

// Templates
const TEMPLATES = {
  BANK_DISPUTE: (data) => `${data.fullName}
${data.address || '[Your Address]'}
${data.email}
${data.phone || ''}

${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${data.bankName || '[Card Issuer Name]'}
Billing Inquiries Department
${data.bankAddress || '[Card Issuer Address]'}

RE: Notice of Disputed Charge - Account ending in ${data.accountLast4 || 'XXXX'}

Dear Billing Inquiries Division,

I am writing to dispute a charge on my ${data.cardType || 'credit card'} account as permitted under the Fair Credit Billing Act.

Disputed Transaction Details:
- Merchant Name: ${data.merchantName}
- Transaction Date: ${data.transactionDate ? new Date(data.transactionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Date]'}
- Transaction Amount: $${data.transactionAmount || '[Amount]'}
- Account Number (last 4 digits): ${data.accountLast4 || 'XXXX'}

Reason for Dispute:
${data.disputeReason || '[Reason]'}

${data.additionalDetails ? `Additional Details:\n${data.additionalDetails}\n` : ''}I am requesting that this charge be investigated and removed from my account. I am also requesting that any finance charges or fees related to this disputed amount be credited to my account.

${data.supportingDocs ? `I have enclosed copies of the following supporting documents:\n${data.supportingDocs}\n` : ''}Please investigate this dispute and provide written confirmation of the resolution. As required by law, please acknowledge receipt of this dispute within 30 days and resolve this matter within two billing cycles (not to exceed 90 days).

I understand that I am not required to pay the disputed amount or related charges while this investigation is pending.

Please send all correspondence to the address above or email me at ${data.email}.

Sincerely,

${data.fullName}

Enclosures: ${data.supportingDocs || '[List of enclosed documents]'}`,

  MERCHANT_REFUND: (data) => `${data.fullName}
${data.email}
${data.phone || ''}

${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${data.merchantName}
Customer Service Department

RE: Refund Request - Order #${data.orderNumber || '[Order Number]'}

Dear ${data.merchantName} Customer Service,

I am writing to request a refund for a recent purchase.

Order Details:
- Order Number: ${data.orderNumber || '[Order Number]'}
- Purchase Date: ${data.transactionDate ? new Date(data.transactionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Date]'}
- Amount Paid: $${data.transactionAmount || '[Amount]'}
- Product/Service: ${data.productDescription || '[Description]'}

Reason for Refund Request:
${data.refundReason || '[Reason]'}

${data.additionalDetails ? `Additional Details:\n${data.additionalDetails}\n` : ''}I am requesting a full refund of $${data.transactionAmount || '[Amount]'} to my original payment method.

${data.previousContact ? `I have previously attempted to resolve this issue:\n${data.previousContact}\n` : ''}Please process this refund within 10 business days. If you require any additional information or documentation, please contact me at ${data.email}${data.phone ? ` or ${data.phone}` : ''}.

If I do not receive a response or refund within a reasonable timeframe, I may need to dispute this charge with my credit card company or pursue other remedies available to me.

Thank you for your prompt attention to this matter.

Sincerely,

${data.fullName}`
};

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5 inline" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-50 w-56 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg">
          {text}
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, name, value, onChange, placeholder, type = "text", required = false, multiline = false, tooltip, maxLength, showCount = false, prefix }) => {
  const baseClasses = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 text-sm placeholder:text-slate-400 shadow-sm";
  
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-bold text-slate-500 px-0.5 uppercase tracking-wide flex items-center">
        {label} {required && <span className="text-rose-500 ml-1">*</span>}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      {multiline ? (
        <>
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={3}
            maxLength={maxLength}
            className={baseClasses}
          />
          {showCount && maxLength && (
            <div className="text-[10px] text-slate-400 text-right">
              {value.length} / {maxLength}
            </div>
          )}
        </>
      ) : prefix ? (
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg">
            {prefix}
          </span>
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${baseClasses} rounded-l-none`}
          />
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
};

const App = () => {
  const [letterType, setLetterType] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showTips, setShowTips] = useState(true);
  
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [transactionDetails, setTransactionDetails] = useState({
    merchantName: '',
    transactionDate: '',
    transactionAmount: '',
    orderNumber: '',
    productDescription: '',
    accountLast4: '',
    cardType: 'credit card',
    bankName: '',
    bankAddress: ''
  });
  
  const [additionalInfo, setAdditionalInfo] = useState({
    additionalDetails: '',
    supportingDocs: '',
    previousContact: ''
  });
  
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const textareaRef = useRef(null);
  const letterOutputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [generatedLetter]);

  // Communicate height to parent iframe
  useEffect(() => {
    const sendHeight = () => {
      requestAnimationFrame(() => {
        const height = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        window.parent.postMessage({ type: "objectHeight", height }, "*");
      });
    };

    sendHeight();
    const t1 = setTimeout(sendHeight, 100);
    const t2 = setTimeout(sendHeight, 300);
    const t3 = setTimeout(sendHeight, 600);
    const t4 = setTimeout(sendHeight, 1000);

    window.addEventListener("resize", sendHeight);

    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true 
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", sendHeight);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const sendHeight = () => {
      requestAnimationFrame(() => {
        const height = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        window.parent.postMessage({ type: "objectHeight", height }, "*");
      });
    };
    sendHeight();
    const t = setTimeout(sendHeight, 100);
    return () => clearTimeout(t);
  }, [generatedLetter, letterType, disputeReason, refundReason, showAdvanced, showTips]);

  const handleUserChange = (e) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const handleTransactionChange = (e) => {
    setTransactionDetails({ ...transactionDetails, [e.target.name]: e.target.value });
  };

  const handleAdditionalChange = (e) => {
    setAdditionalInfo({ ...additionalInfo, [e.target.name]: e.target.value });
  };

  const getReasonText = () => {
    if (letterType === 'BANK_DISPUTE' && disputeReason) {
      const reason = DISPUTE_REASONS[disputeReason];
      return `${reason.name}: ${reason.description}`;
    }
    if (letterType === 'MERCHANT_REFUND' && refundReason) {
      const reason = REFUND_REASONS[refundReason];
      return `${reason.name}: ${reason.description}`;
    }
    return '';
  };

  const handleSubmit = () => {
    if (!letterType || !userDetails.fullName || !userDetails.email || !transactionDetails.merchantName) {
      alert('Please fill in all required fields');
      return;
    }

    if (letterType === 'BANK_DISPUTE' && !disputeReason) {
      alert('Please select a dispute reason');
      return;
    }

    if (letterType === 'MERCHANT_REFUND' && !refundReason) {
      alert('Please select a refund reason');
      return;
    }

    const template = TEMPLATES[letterType];
    if (template) {
      const reasonText = getReasonText();
      const letter = template({
        ...userDetails,
        ...transactionDetails,
        ...additionalInfo,
        disputeReason: letterType === 'BANK_DISPUTE' ? reasonText : '',
        refundReason: letterType === 'MERCHANT_REFUND' ? reasonText : ''
      });
      setGeneratedLetter(letter);
      
      setTimeout(() => {
        letterOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = generatedLetter;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letterType === 'BANK_DISPUTE' ? 'dispute' : 'refund'}-letter-${transactionDetails.merchantName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentTips = letterType === 'BANK_DISPUTE' && disputeReason 
    ? DISPUTE_REASONS[disputeReason]?.tips 
    : letterType === 'MERCHANT_REFUND' && refundReason 
    ? REFUND_REASONS[refundReason]?.tips 
    : null;

  return (
    <div className="lg:flex lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Sidebar Form */}
      <aside className="w-full lg:w-[420px] xl:w-[460px] lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shadow-xl">
        <div className="p-5 space-y-5">
          {/* Letter Type Selection */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Letter Type
            </h2>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LETTER_TYPES).map(([key, data]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setLetterType(key);
                    setDisputeReason('');
                    setRefundReason('');
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    letterType === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="text-lg mb-1">{data.icon}</div>
                  <div className="text-xs font-bold text-slate-700">{data.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{data.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Reason Selection */}
          {letterType && (
            <section className="space-y-3 pb-4 border-b border-slate-100">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {letterType === 'BANK_DISPUTE' ? 'Dispute Reason' : 'Refund Reason'}
              </h2>
              
              <select
                value={letterType === 'BANK_DISPUTE' ? disputeReason : refundReason}
                onChange={(e) => {
                  if (letterType === 'BANK_DISPUTE') {
                    setDisputeReason(e.target.value);
                  } else {
                    setRefundReason(e.target.value);
                  }
                  setShowTips(true);
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 text-sm shadow-sm"
              >
                <option value="">Select a reason...</option>
                {Object.entries(letterType === 'BANK_DISPUTE' ? DISPUTE_REASONS : REFUND_REASONS).map(([key, data]) => (
                  <option key={key} value={key}>{data.name}</option>
                ))}
              </select>

              {/* Tips Panel */}
              {currentTips && showTips && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Tips for this dispute type</span>
                    <button 
                      onClick={() => setShowTips(false)}
                      className="text-blue-400 hover:text-blue-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <ul className="text-[11px] text-blue-800 space-y-1">
                    {currentTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Transaction Details */}
          {letterType && (
            <section className="space-y-3 pb-4 border-b border-slate-100">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Transaction Details
              </h2>
              <div className="space-y-4">
                <InputGroup 
                  label="Merchant/Company Name" 
                  name="merchantName" 
                  value={transactionDetails.merchantName} 
                  onChange={handleTransactionChange} 
                  placeholder="e.g. Amazon, Netflix" 
                  required
                  tooltip="The business that charged you"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputGroup 
                    label="Transaction Date" 
                    name="transactionDate" 
                    type="date"
                    value={transactionDetails.transactionDate} 
                    onChange={handleTransactionChange} 
                    required
                    tooltip="Date the charge appeared"
                  />
                  <InputGroup 
                    label="Amount" 
                    name="transactionAmount" 
                    value={transactionDetails.transactionAmount} 
                    onChange={handleTransactionChange} 
                    placeholder="0.00"
                    prefix="$"
                    required
                    tooltip="The disputed amount"
                  />
                </div>
                {letterType === 'MERCHANT_REFUND' && (
                  <InputGroup 
                    label="Order/Reference Number" 
                    name="orderNumber" 
                    value={transactionDetails.orderNumber} 
                    onChange={handleTransactionChange} 
                    placeholder="e.g. ORD-123456"
                    tooltip="If available from your receipt or confirmation"
                  />
                )}
                {letterType === 'BANK_DISPUTE' && (
                  <InputGroup 
                    label="Card Last 4 Digits" 
                    name="accountLast4" 
                    value={transactionDetails.accountLast4} 
                    onChange={handleTransactionChange} 
                    placeholder="1234"
                    tooltip="Last 4 digits of your card number"
                  />
                )}
              </div>
            </section>
          )}

          {/* Your Information */}
          <section className="space-y-3 pb-4 border-b border-slate-100">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Information
            </h2>
            <div className="space-y-4">
              <InputGroup 
                label="Full Name" 
                name="fullName" 
                value={userDetails.fullName} 
                onChange={handleUserChange} 
                placeholder="John Doe" 
                required
                tooltip="Your full legal name"
              />
              <InputGroup 
                label="Email" 
                name="email" 
                type="email"
                value={userDetails.email} 
                onChange={handleUserChange} 
                placeholder="john@example.com" 
                required
                tooltip="Email for correspondence"
              />
            </div>
          </section>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            type="button"
            className="w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAdvanced ? 'Hide' : 'Show'} Additional Fields
          </button>

          {showAdvanced && (
            <section className="space-y-4 pb-4 border-b border-slate-200 animate-fadeIn">
              <InputGroup 
                label="Phone" 
                name="phone" 
                value={userDetails.phone} 
                onChange={handleUserChange} 
                placeholder="(555) 123-4567"
                tooltip="Optional contact number"
              />
              <InputGroup 
                label="Mailing Address" 
                name="address" 
                value={userDetails.address} 
                onChange={handleUserChange} 
                placeholder="123 Street, City, State ZIP" 
                multiline
                tooltip="Required for bank disputes"
              />
              {letterType === 'MERCHANT_REFUND' && (
                <InputGroup 
                  label="Product/Service Description" 
                  name="productDescription" 
                  value={transactionDetails.productDescription} 
                  onChange={handleTransactionChange} 
                  placeholder="Brief description of what you purchased"
                  tooltip="Help identify the transaction"
                />
              )}
              {letterType === 'BANK_DISPUTE' && (
                <>
                  <InputGroup 
                    label="Bank/Card Issuer Name" 
                    name="bankName" 
                    value={transactionDetails.bankName} 
                    onChange={handleTransactionChange} 
                    placeholder="e.g. Chase, Bank of America"
                    tooltip="Your credit card company or bank"
                  />
                  <InputGroup 
                    label="Supporting Documents" 
                    name="supportingDocs" 
                    value={additionalInfo.supportingDocs} 
                    onChange={handleAdditionalChange} 
                    placeholder="e.g. Receipt, screenshots, tracking info"
                    multiline
                    tooltip="List documents you'll include"
                  />
                </>
              )}
              <InputGroup 
                label="Additional Details" 
                name="additionalDetails" 
                value={additionalInfo.additionalDetails} 
                onChange={handleAdditionalChange} 
                placeholder="Any other relevant information..." 
                multiline
                maxLength={500}
                showCount={true}
                tooltip="Additional context for your dispute"
              />
              {letterType === 'MERCHANT_REFUND' && (
                <InputGroup 
                  label="Previous Contact Attempts" 
                  name="previousContact" 
                  value={additionalInfo.previousContact} 
                  onChange={handleAdditionalChange} 
                  placeholder="e.g. Called on Jan 5, emailed support..." 
                  multiline
                  tooltip="Document previous attempts to resolve"
                />
              )}
            </section>
          )}

          <button
            onClick={handleSubmit}
            type="button"
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate Letter</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Letter Preview */}
      <main 
        ref={letterOutputRef}
        className="w-full lg:flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-10 xl:p-14"
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview & Edit</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={downloadTxt}
                disabled={!generatedLetter}
                type="button"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!generatedLetter}
                type="button"
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg border font-bold text-xs transition-all shadow-sm ${
                  copySuccess 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {copySuccess ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  )}
                </svg>
                <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden lg:min-h-[400px]">
            {!generatedLetter ? (
              <div className="flex flex-col items-center justify-center text-center p-12 lg:p-20">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-100 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <h3 className="text-slate-700 font-bold text-lg">Your letter will appear here</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-sm">Select a letter type, fill out the details, and click Generate</p>
              </div>
            ) : (
              <div className="p-8 sm:p-10 lg:p-14">
                <textarea
                  ref={textareaRef}
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="w-full resize-none border-none outline-none text-base text-slate-800 leading-relaxed bg-transparent focus:ring-0 overflow-hidden"
                  style={{ fontFamily: "'SF Mono', 'Fira Code', 'Monaco', monospace", fontSize: '13px', lineHeight: '1.7' }}
                  spellCheck={false}
                />
                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                  <span>{letterType === 'BANK_DISPUTE' ? 'Dispute Letter' : 'Refund Request'} Generated</span>
                  <span>Review before sending</span>
                </div>
              </div>
            )}
          </div>

          {/* Info boxes */}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 rounded-xl">
              <div className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Important: 60-Day Deadline
              </div>
              <div className="text-[11px] text-blue-800 leading-relaxed">
                For credit card disputes, you must notify your card issuer in writing within 60 days of the statement date showing the charge. Send your letter to the billing inquiries address (not payment address) via certified mail for proof of delivery.
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Tips for Success
              </div>
              <ul className="text-[11px] text-amber-800 leading-relaxed space-y-1">
                <li>• Try contacting the merchant first — many issues resolve faster this way</li>
                <li>• Keep copies of all correspondence and supporting documents</li>
                <li>• Don't pay the disputed amount while the investigation is pending</li>
                <li>• Your card issuer must respond within 30 days and resolve within 90 days</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
