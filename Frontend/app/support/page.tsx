// app/components/SubmitComplaintPage.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import { AlertCircle, CheckCircle, User, Store, ShoppingCart, Loader2, FileText, AlertTriangle, HelpCircle, MessageSquare, Package } from 'lucide-react';
import api from '@/app/libs/api';

interface ComplaintFormData {
  title: string;
  description: string;
  complaintType: string;
  priority: string;
  complainantType: 'CUSTOMER' | 'SELLER';
  complainantId?: number;
  complainantName: string;
  complainantEmail: string;
  complainantPhone: string;
  accusedType: 'CUSTOMER' | 'SELLER';
  accusedId?: number;
  accusedName: string;
  accusedEmail: string;
  orderId?: string;
  isRegisteredUser: boolean;
}

interface UserSearchResult {
  id: number;
  name?: string;
  businessName?: string;
  email: string;
  type: 'CUSTOMER' | 'SELLER';
}

export default function SubmitComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [showAccusedResults, setShowAccusedResults] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ComplaintFormData>({
    title: '',
    description: '',
    complaintType: 'ORDER_ISSUE',
    priority: 'MEDIUM',
    complainantType: 'CUSTOMER',
    complainantId: undefined,
    complainantName: '',
    complainantEmail: '',
    complainantPhone: '',
    accusedType: 'SELLER',
    accusedId: undefined,
    accusedName: '',
    accusedEmail: '',
    orderId: '',
    isRegisteredUser: false,
  });

  // Check if user is logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (storedToken && (userRole === 'customer' || userRole === 'seller')) {
      setToken(storedToken);
      fetchCurrentUserDetails(userRole, storedToken);
    }
  }, []);

  const fetchCurrentUserDetails = async (role: string, token: string) => {
    try {
      if (role === 'customer') {
        const res = await api.get('/api/customer/getcustomerprofile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.customerD) {
          setFormData(prev => ({
            ...prev,
            isRegisteredUser: true,
            complainantType: 'CUSTOMER',
            complainantId: res.data.customerD.id,
            complainantName: res.data.customerD.name,
            complainantEmail: res.data.customerD.email,
            complainantPhone: res.data.customerD.mobileNumber || '',
          }));
        }
      } else if (role === 'seller') {
        const res = await api.get('/api/seller/get-my-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.seller) {
          setFormData(prev => ({
            ...prev,
            isRegisteredUser: true,
            complainantType: 'SELLER',
            complainantId: res.data.seller.seller_id,
            complainantName: res.data.seller.businessName,
            complainantEmail: res.data.seller.businessEmail,
            complainantPhone: res.data.seller.phoneNum || '',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    }
  };

  // Search for user by email/name
  const searchUser = async (query: string, type: 'CUSTOMER' | 'SELLER', isAccused: boolean = false) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Try to search in customers
      if (type === 'CUSTOMER') {
        try {
          const res = await api.get(`/api/user/search-customers?q=${query}`);
          const results = res.data.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            type: 'CUSTOMER' as const,
          }));
          
          if (isAccused) {
            setSearchResults(results);
            setShowAccusedResults(true);
          }
          return results;
        } catch (err) {
          console.log('Customer search failed, trying seller search');
        }
      }

      // Try to search in sellers
      if (type === 'SELLER') {
        try {
          const res = await api.get(`/api/seller/search?q=${query}`);
          const results = res.data.map((seller: any) => ({
            id: seller.seller_id,
            businessName: seller.businessName,
            email: seller.businessEmail,
            type: 'SELLER' as const,
          }));
          
          if (isAccused) {
            setSearchResults(results);
            setShowAccusedResults(true);
          }
          return results;
        } catch (err) {
          console.log('Seller search failed');
        }
      }
      
      setSearchResults([]);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>, isAccused: boolean = false) => {
    const value = e.target.value;
    const type = isAccused ? formData.accusedType : formData.complainantType;
    
    if (isAccused) {
      setFormData(prev => ({ ...prev, accusedName: value }));
    } else {
      setFormData(prev => ({ ...prev, complainantName: value }));
    }
    
    if (value.length >= 2) {
      await searchUser(value, type, isAccused);
    } else {
      setSearchResults([]);
      setShowAccusedResults(false);
    }
  };

  const selectUser = (user: UserSearchResult, isAccused: boolean = false) => {
    if (isAccused) {
      setFormData(prev => ({
        ...prev,
        accusedId: user.id,
        accusedName: user.name || user.businessName || '',
        accusedEmail: user.email,
        accusedType: user.type,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        complainantId: user.id,
        complainantName: user.name || user.businessName || '',
        complainantEmail: user.email,
        complainantType: user.type,
      }));
    }
    setSearchResults([]);
    setShowAccusedResults(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare complaint data
      const complaintData: any = {
        title: formData.title,
        description: formData.description,
        complaintType: formData.complaintType,
        priority: formData.priority,
        complainantType: formData.complainantType,
        accusedType: formData.accusedType,
      };

      // Add complainant ID if registered, else use name/email
      if (formData.complainantId && formData.isRegisteredUser) {
        complaintData.complainantId = formData.complainantId;
      } else {
        complaintData.complainantName = formData.complainantName;
        complaintData.complainantEmail = formData.complainantEmail;
        complaintData.complainantPhone = formData.complainantPhone;
      }

      // Add accused ID if found, else use name/email
      if (formData.accusedId) {
        complaintData.accusedId = formData.accusedId;
      } else {
        complaintData.accusedName = formData.accusedName;
        complaintData.accusedEmail = formData.accusedEmail;
      }

      // Add order ID if provided
      if (formData.orderId) {
        complaintData.orderId = parseInt(formData.orderId);
      }

      // Send complaint
      const res = await api.post('/api/complaints', complaintData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setSuccess('Complaint submitted successfully! Our team will review it shortly.');
      
      // Reset form after successful submission
      setTimeout(() => {
        if (formData.isRegisteredUser) {
          // Keep user info but reset other fields
          setFormData(prev => ({
            ...prev,
            title: '',
            description: '',
            complaintType: 'ORDER_ISSUE',
            priority: 'MEDIUM',
            accusedType: 'SELLER',
            accusedId: undefined,
            accusedName: '',
            accusedEmail: '',
            orderId: '',
          }));
        } else {
          // Reset entire form for non-registered users
          setFormData({
            title: '',
            description: '',
            complaintType: 'ORDER_ISSUE',
            priority: 'MEDIUM',
            complainantType: 'CUSTOMER',
            complainantId: undefined,
            complainantName: '',
            complainantEmail: '',
            complainantPhone: '',
            accusedType: 'SELLER',
            accusedId: undefined,
            accusedName: '',
            accusedEmail: '',
            orderId: '',
            isRegisteredUser: false,
          });
        }
        
        // Redirect to success page or show success message
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }, 2000);

    } catch (err: any) {
      console.error('Complaint submission error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to submit complaint. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const complaintTypes = [
    { value: 'ORDER_ISSUE', label: 'Order Issue', icon: <ShoppingCart className="w-4 h-4" /> },
    { value: 'DELIVERY_PROBLEM', label: 'Delivery Problem', icon: <Package className="w-4 h-4" /> },
    { value: 'QUALITY_ISSUE', label: 'Quality Issue', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'REFUND_REQUEST', label: 'Refund Request', icon: <FileText className="w-4 h-4" /> },
    { value: 'SELLER_BEHAVIOR', label: 'Seller Behavior Issue', icon: <Store className="w-4 h-4" /> },
    { value: 'CUSTOMER_BEHAVIOR', label: 'Customer Behavior Issue', icon: <User className="w-4 h-4" /> },
    { value: 'PAYMENT_ISSUE', label: 'Payment Issue', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'ACCOUNT_ISSUE', label: 'Account Issue', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'PRODUCT_ISSUE', label: 'Product Issue', icon: <Package className="w-4 h-4" /> },
    { value: 'OTHER', label: 'Other', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar2 />
      
      <main className="max-w-4xl mx-auto px-4 py-8 text-black">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Complaint</h1>
          <p className="text-gray-600">
            {formData.isRegisteredUser 
              ? 'Logged in as registered user. We\'ll use your account information.'
              : 'You can submit complaints as a registered user or anonymously.'
            }
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Complaint Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Complaint Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief summary of your complaint"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about your complaint..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complaint Type *
                  </label>
                  <select
                    title='Complaints'
                    required
                    value={formData.complaintType}
                    onChange={(e) => setFormData({ ...formData, complaintType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {complaintTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    title='Priority'
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Your Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Your Information</h2>
              
              {formData.isRegisteredUser ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Logged in as Registered User</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{formData.complainantName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{formData.complainantEmail}</span>
                    </div>
                    {formData.complainantPhone && (
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{formData.complainantPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium capitalize">{formData.complainantType.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.complainantName}
                        onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.complainantEmail}
                        onChange={(e) => setFormData({ ...formData, complainantEmail: e.target.value })}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.complainantPhone}
                        onChange={(e) => setFormData({ ...formData, complainantPhone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        You are a *
                      </label>
                      <select
                        title=' Complainant Type'
                        value={formData.complainantType}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          complainantType: e.target.value as 'CUSTOMER' | 'SELLER',
                          complainantName: '',
                          complainantEmail: '',
                          complainantPhone: '',
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="SELLER">Seller</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      id="registered"
                      checked={formData.isRegisteredUser}
                      onChange={(e) => {
                        if (e.target.checked) {
                          router.push('/login?redirect=/complaint');
                        } else {
                          setFormData({ ...formData, isRegisteredUser: false });
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="registered">
                      I have an account. {' '}
                      <button
                        type="button"
                        onClick={() => router.push('/login?redirect=/complaint')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Login to submit as registered user
                      </button>
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Person/Business You're Complaining About */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Who are you complaining about?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    They are a *
                  </label>
                  <select
                  title='type'
                    value={formData.accusedType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      accusedType: e.target.value as 'CUSTOMER' | 'SELLER',
                      accusedName: '',
                      accusedEmail: '',
                      accusedId: undefined,
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SELLER">Seller/Business</option>
                    <option value="CUSTOMER">Customer</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search for {formData.accusedType === 'SELLER' ? 'Seller' : 'Customer'} *
                    <span className="text-gray-500 text-xs ml-2">
                      (Enter name, email, or business name)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.accusedName}
                      onChange={(e) => handleSearchChange(e, true)}
                      placeholder={
                        formData.accusedType === 'SELLER' 
                          ? "Search sellers by name, business name, or email..." 
                          : "Search customers by name or email..."
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searching && (
                      <div className="absolute right-3 top-2.5">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {showAccusedResults && searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-10">
                      {searchResults.map((user) => (
                        <button
                          key={`${user.type}-${user.id}`}
                          type="button"
                          onClick={() => selectUser(user, true)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center"
                        >
                          <div className="flex-shrink-0 mr-3">
                            {user.type === 'CUSTOMER' ? (
                              <User className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Store className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {user.name || user.businessName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {user.type === 'CUSTOMER' ? 'Customer' : 'Seller'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.accusedId && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">
                            Selected: {formData.accusedName}
                          </p>
                          <p className="text-sm text-green-600">{formData.accusedEmail}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            accusedId: undefined,
                            accusedName: '',
                            accusedEmail: ''
                          }))}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!formData.accusedId && (
                  <>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Can't find the {formData.accusedType.toLowerCase()}? Enter their details manually:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={formData.accusedName}
                          onChange={(e) => setFormData({ ...formData, accusedName: e.target.value })}
                          placeholder="Enter their name or business name"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          value={formData.accusedEmail}
                          onChange={(e) => setFormData({ ...formData, accusedEmail: e.target.value })}
                          placeholder="Enter their email address"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Order Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  placeholder="Enter order number if applicable"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 mr-2"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I confirm that the information provided is accurate and truthful. 
                  I understand that false complaints may result in account suspension or legal action.
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By submitting this complaint, you agree to our Terms of Service and Privacy Policy. 
                Our team typically responds within 24-48 hours.
              </p>
            </div>
          </form>
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="font-semibold text-gray-800">What happens next?</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Your complaint will be reviewed by our team</li>
              <li>• We may contact you for additional information</li>
              <li>• The accused party will be notified</li>
              <li>• Resolution typically takes 3-5 business days</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="font-semibold text-gray-800">Why register?</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Faster complaint processing</li>
              <li>• Track complaint status online</li>
              <li>• Receive email updates</li>
              <li>• Access to resolution history</li>
              <li>• Verified identity for credibility</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <HelpCircle className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="font-semibold text-gray-800">Need help?</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>For urgent matters, contact our support team:</p>
              <p className="font-medium">📧 support@example.com</p>
              <p className="font-medium">📞 +1 (555) 123-4567</p>
              <p className="text-xs text-gray-500 mt-2">Available Mon-Fri, 9AM-6PM EST</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}