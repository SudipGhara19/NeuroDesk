"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import loginBG1 from "../../public/common/loginBG1.png";
import logo from "../../public/common/logo.png";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import CheckUserForm from '@/components/auth/CheckUserForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

const AuthContent = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'login';
  
  const { scrollY } = useScroll();
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // 1024px is the 'lg' breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50 && isAtTop) {
      setIsAtTop(false);
    } else if (latest <= 50 && !isAtTop) {
      setIsAtTop(true);
    }
  });

  const renderForm = () => {
    switch (tab) {
      case 'signup':
        return <SignUpForm />;
      case 'checkuser':
        return <CheckUserForm />;
      case 'resetPassword':
        return <ResetPasswordForm />;
      case 'login':
      default:
        return <SignInForm />;
    }
  };

  return (
    <div className='relative w-full flex flex-col lg:flex-row font-sans overflow-x-hidden'>
      {/* ------------- Cinematic Branding (Full screen on mobile, 50/50 on large) --------- */}
      <motion.div 
        animate={(isAtTop && isMobile) ? { y: [0, -12, 0] } : { y: 0 }}
        transition={(isAtTop && isMobile) ? { 
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

      {/* --------------- Form Section (Full screen on mobile, 50/50 on large) --------------- */}
      <div className='w-full lg:flex-1 h-screen flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 bg-white relative overflow-hidden'>
        <AnimatePresence mode="wait">
          <motion.div 
            key={tab}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full flex justify-center"
          >
            {renderForm()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const AuthPage = () => {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
