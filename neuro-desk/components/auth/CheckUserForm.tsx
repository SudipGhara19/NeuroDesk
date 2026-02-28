import { useState } from 'react';
import Image from 'next/image';
import logo from "../../public/common/logo.png";
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { AxiosError } from 'axios';

const CheckUserForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSwitch = (tab: string) => {
    router.push(`/auth?tab=${tab}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Reset link sent! Please check your email. Link is valid for 30 minutes.');
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'There is no user with that email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-[420px]'>
      <div className='mb-12 text-center lg:text-left flex flex-col items-center lg:items-start'>
        <div className="mb-8">
          <Image src={logo} alt="Neuro Desk Logo" width={96} height={96} />
        </div>
        <h2 className='text-3xl font-bold tracking-tight text-[#171717] mb-2'>Reset Password</h2>
        <p className='text-gray-500'>Enter your email to verify your account and receive a reset link.</p>
      </div>

      <form className='space-y-6' onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 text-green-600 text-sm rounded-xl font-medium border border-green-100 animate-in fade-in slide-in-from-top-1">
            {success}
          </div>
        )}

        {/* Email Field */}
        <div className='space-y-2'>
          <label htmlFor="check-email" className='text-sm font-semibold text-gray-700 ml-1'>
            Email Address
          </label>
          <input 
            id="check-email"
            type="email" 
            placeholder="hello@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 focus:border-gray-800 focus:shadow-sm transition-all duration-300 placeholder:text-gray-400 text-gray-800'
            required
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className='space-y-4 pt-4'>
          <button 
            type="submit" 
            disabled={loading}
            className='w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : "Check User & Send Mail"}
          </button>
        </div>
      </form>

      <p className='mt-10 text-center text-gray-600 font-medium'>
        Remember your password? 
        <button 
          onClick={() => handleSwitch('login')}
          className='ml-2 text-black font-bold border-b-2 border-black/10 hover:border-black transition-all'
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

export default CheckUserForm;
