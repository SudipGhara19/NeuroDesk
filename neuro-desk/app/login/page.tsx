"use client";

import { useState } from 'react';
import Image from 'next/image'
import loginBG1 from "../../public/common/loginBG1.png"
import logo from "../../public/common/logo.png"
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { scrollY } = useScroll();
  const [isAtTop, setIsAtTop] = useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Stop bouncing if user scrolls down more than 50px
    if (latest > 50 && isAtTop) {
      setIsAtTop(false);
    } else if (latest <= 50 && !isAtTop) {
      setIsAtTop(true);
    }
  });

  return (
    <div className='relative w-full flex flex-col lg:flex-row font-sans'>
      {/* ------------- Cinematic Branding (Full screen on mobile, 50/50 on large) --------- */}
      <motion.div 
        animate={isAtTop ? { y: [0, -12, 0] } : { y: 0 }}
        transition={isAtTop ? { 
          duration: 2.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } : { duration: 0.3 }}
        className='flex w-full lg:flex-1 relative h-screen overflow-hidden'
      >
        <Image 
          src={loginBG1} 
          alt="Login Background" 
          fill
          priority
          className="object-cover brightness-[0.8]"
        />
        {/* Overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        
        {/* Branding on top of image */}
        <div className="absolute bottom-12 left-12 text-white">
          <div className="mb-6">
            <Image src={logo} alt="Neuro Desk Logo" width={120} height={120} className="brightness-0 invert" />
          </div>
          <h1 className="text-5xl font-black tracking-tight">Neuro Desk.</h1>
          <p className="mt-4 text-xl font-light text-white/80 max-w-md">
            Unlock the next level of cognitive intelligence and workspace management.
          </p>
        </div>
      </motion.div>

      {/* --------------- Login Form (Full screen on mobile, 50/50 on large) --------------- */}
      <div className='w-full lg:flex-1 h-screen flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 bg-white overflow-y-auto'>
        <div className='w-full max-w-[420px]'>
          <div className='mb-12 text-center lg:text-left flex flex-col items-center lg:items-start'>
            <div className="mb-8">
              <Image src={logo} alt="Neuro Desk Logo" width={96} height={96} />
            </div>
            <h2 className='text-3xl font-bold tracking-tight text-[#171717] mb-2'>Sign In</h2>
            <p className='text-gray-500'>Welcome back! Please enter your details.</p>
          </div>

          <form className='space-y-6'>
            {/* Email Field */}
            <div className='space-y-2'>
              <label htmlFor="email" className='text-sm font-semibold text-gray-700 ml-1'>
                Email Address
              </label>
              <input 
                id="email"
                type="email" 
                placeholder="hello@example.com"
                className='w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 focus:border-gray-800 focus:shadow-sm transition-all duration-300 placeholder:text-gray-400 text-gray-800'
                required
              />
            </div>

            {/* Password Field */}
            <div className='space-y-2'>
              <div className='flex justify-between items-center ml-1'>
                <label htmlFor="password" title="Password" className='text-sm font-semibold text-gray-700'>
                  Password
                </label>
                <a href="#" className='text-xs font-bold text-black border-b border-black/20 hover:border-black transition-all'>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className='w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 focus:border-gray-800 focus:shadow-sm transition-all duration-300 placeholder:text-gray-400 text-gray-800'
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                >
                  {showPassword ? <BsEyeSlash size={24} /> : <BsEye size={24} />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-4 pt-4'>
              <button 
                type="submit" 
                className='w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-black/10'
              >
                Sign In
              </button>
            </div>
          </form>

          <p className='mt-10 text-center text-gray-600 font-medium'>
            Don&apos;t have an account? 
            <a href="#" className='ml-2 text-black font-bold border-b-2 border-black/10 hover:border-black transition-all'>Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

