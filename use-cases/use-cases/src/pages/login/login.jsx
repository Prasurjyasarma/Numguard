import React, { useState, useEffect, useRef } from 'react';
import { 
  BsBag, 
  BsTelephone, 
  BsKey, 
  BsCheck, 
  BsArrowRight,
  BsCheckCircle,
  BsExclamationCircle
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../userContext';
import './LoginPage.css';

const LoginPage = () => {
  // Get context values
  const { userPhoneNumber, setUserPhoneNumber, setIsVerified } = useUserContext();
  
  // State variables
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [currentScreen, setCurrentScreen] = useState('phone');
  const [phoneMessage, setPhoneMessage] = useState({ text: '', isError: false, show: false });
  const [otpMessage, setOtpMessage] = useState({ text: '', isError: false, show: false });
  const [loading, setLoading] = useState(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState(60);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [navigating, setNavigating] = useState(false);
  
  // Refs
  const otp1Ref = useRef(null);
  const otp2Ref = useRef(null);
  const otp3Ref = useRef(null);
  const otp4Ref = useRef(null);
  const otpResendTimerRef = useRef(null);
  
  // Navigation
  const navigate = useNavigate();

  // Check session storage on component mount
  useEffect(() => {
    const storedOtp = sessionStorage.getItem('generatedOtp');
    const storedPhone = sessionStorage.getItem('userPhoneNumber');
    const storedScreen = sessionStorage.getItem('currentScreen');
    
    if (storedOtp && storedPhone) {
      setGeneratedOtp(storedOtp);
      setUserPhoneNumber(storedPhone);
      
      if (storedScreen === 'otp') {
        setCurrentScreen('otp');
      }
    }
    
    // Clear timer on unmount
    return () => {
      if (otpResendTimerRef.current) {
        clearInterval(otpResendTimerRef.current);
      }
    };
  }, [setUserPhoneNumber]);

  // Handle OTP resend countdown
  useEffect(() => {
    if (currentScreen === 'otp' && otpResendCountdown > 0) {
      otpResendTimerRef.current = setInterval(() => {
        setOtpResendCountdown(prev => prev - 1);
      }, 1000);
    } else if (otpResendCountdown === 0 && otpResendTimerRef.current) {
      clearInterval(otpResendTimerRef.current);
    }
    
    return () => {
      if (otpResendTimerRef.current) {
        clearInterval(otpResendTimerRef.current);
      }
    };
  }, [currentScreen, otpResendCountdown]);

  // Effect for navigation to home
  useEffect(() => {
    if (navigating) {
      const redirectTimer = setTimeout(() => {
        navigate('/home');
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [navigating, navigate]);

  // Generate random OTP
  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Show message
  const showMessage = (setter, text, isError = false) => {
    setter({ text, isError, show: true });
    
    if (!isError) {
      setTimeout(() => {
        setter(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setOtpResendCountdown(60);
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    
    if (value && index < 3) {
      switch(index) {
        case 0: otp2Ref.current.focus(); break;
        case 1: otp3Ref.current.focus(); break;
        case 2: otp4Ref.current.focus(); break;
        default: break;
      }
    }
  };

  // Handle backspace in OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      switch(index) {
        case 1: otp1Ref.current.focus(); break;
        case 2: otp2Ref.current.focus(); break;
        case 3: otp3Ref.current.focus(); break;
        default: break;
      }
    }
  };

  // Handle paste in OTP inputs
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (pastedData.length === 4 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otp4Ref.current.focus();
    }
  };

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    setPhoneMessage(prev => ({ ...prev, show: false }));
    
    if (!userPhoneNumber.trim()) {
      showMessage(setPhoneMessage, 'Please enter your phone number', true);
      return;
    }

    if (!/^\d{10}$/.test(userPhoneNumber)) {
      showMessage(setPhoneMessage, 'Please enter a valid 10-digit phone number', true);
      return;
    }

    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    console.log("Generated OTP for testing:", newOtp);
    
    sessionStorage.setItem('generatedOtp', newOtp);
    sessionStorage.setItem('userPhoneNumber', userPhoneNumber);
    
    setLoading(true);
    
    if (fallbackMode) {
      setTimeout(() => {
        setLoading(false);
        setCurrentScreen('otp');
        sessionStorage.setItem('currentScreen', 'otp');
      }, 1000);
      return;
    }
    
    try {
      const apiUrl = new URL('http://localhost:8000/api/receive-message/');
      apiUrl.searchParams.append('virtual_number', userPhoneNumber);
      apiUrl.searchParams.append('sender_name', 'shopeasy');
      apiUrl.searchParams.append('message', 'Your ShopEasy verification code is ' + newOtp);
      
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      setLoading(false);
      
      if (response.ok) {
        setCurrentScreen('otp');
        sessionStorage.setItem('currentScreen', 'otp');
      } else {
        if (response.status === 400) {
          showMessage(setPhoneMessage, 'Invalid phone number. This number is not registered in our system.', true);
        } else {
          handleApiError();
        }
      }
    } catch (error) {
      setLoading(false);
      
      if (error.name === 'AbortError') {
        showMessage(setPhoneMessage, 'Request timed out. Please try again.', true);
      } else {
        handleApiError();
      }
    }
  };

  // Handle API errors
  const handleApiError = () => {
    setFallbackMode(true);
    showMessage(setPhoneMessage, 'API connection failed. Using local OTP mode.', true);
    setTimeout(() => {
      setCurrentScreen('otp');
      sessionStorage.setItem('currentScreen', 'otp');
    }, 1000);
  };

  // Resend OTP
  const handleResendOtp = async (e) => {
    e.preventDefault();
    
    setOtpMessage(prev => ({ ...prev, show: false }));
    
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    console.log("Resent OTP for testing:", newOtp);
    
    sessionStorage.setItem('generatedOtp', newOtp);
    
    setLoading(true);
    
    if (fallbackMode) {
      setTimeout(() => {
        setLoading(false);
        showMessage(setOtpMessage, 'OTP has been resent');
        startResendTimer();
      }, 1000);
      return;
    }
    
    try {
      const apiUrl = new URL('http://localhost:8000/api/receive-message/');
      apiUrl.searchParams.append('virtual_number', userPhoneNumber);
      apiUrl.searchParams.append('sender_name', 'shopeasy');
      apiUrl.searchParams.append('message', 'Your ShopEasy verification code is ' + newOtp);
      
      const response = await fetch(apiUrl.toString());
      
      setLoading(false);
      
      if (response.ok) {
        showMessage(setOtpMessage, 'OTP has been resent');
        startResendTimer();
      } else {
        if (response.status === 400) {
          showMessage(setOtpMessage, 'Invalid phone number. This number is not registered in our system.', true);
        } else {
          showMessage(setOtpMessage, 'Failed to resend OTP. Using previous code.', true);
        }
      }
    } catch (error) {
      setLoading(false);
      
      if (error.name === 'AbortError') {
        showMessage(setOtpMessage, 'Request timed out. Please try again.', true);
      } else {
        showMessage(setOtpMessage, 'Network error. Using previous code.', true);
      }
    }
  };

  // Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    
    setOtpMessage(prev => ({ ...prev, show: false }));
    
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length !== 4) {
      showMessage(setOtpMessage, 'Please enter the complete OTP', true);
      return;
    }

    if (enteredOtp === generatedOtp) {
      setLoading(true);
      showMessage(setOtpMessage, 'OTP verified successfully');
      
      // Update context verification status
      setIsVerified(true);
      sessionStorage.setItem('isVerified', 'true');
      
      setTimeout(() => {
        setLoading(false);
        setCurrentScreen('success');
        sessionStorage.setItem('currentScreen', 'success');
        setNavigating(true);
      }, 1000);
    } else {
      showMessage(setOtpMessage, 'Incorrect OTP. Please try again.', true);
      setOtp(['', '', '', '']);
      otp1Ref.current.focus();
    }
  };

  // Handle phone number change
  const handlePhoneChange = (e) => {
    setUserPhoneNumber(e.target.value);
    if (phoneMessage.show) {
      setPhoneMessage(prev => ({ ...prev, show: false }));
    }
  };

  // Handle phone input key press
  const handlePhoneKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendOtp(e);
    }
  };

  // Calculate progress bar width
  const getProgressWidth = () => {
    switch(currentScreen) {
      case 'phone': return '33%';
      case 'otp': return '66%';
      case 'success': return '100%';
      default: return '33%';
    }
  };

  return (
    <div className="container">
      {/* Progress Indicator */}
      <div className="steps">
        <div className={`step ${currentScreen === 'phone' ? 'active' : ''} ${currentScreen === 'otp' || currentScreen === 'success' ? 'completed' : ''}`}>
          <div className="step-icon"><BsTelephone /></div>
          <div className="step-label">Phone</div>
        </div>
        <div className={`step ${currentScreen === 'otp' ? 'active' : ''} ${currentScreen === 'success' ? 'completed' : ''}`}>
          <div className="step-icon"><BsKey /></div>
          <div className="step-label">Verify</div>
        </div>
        <div className={`step ${currentScreen === 'success' ? 'active' : ''}`}>
          <div className="step-icon"><BsCheck /></div>
          <div className="step-label">Done</div>
        </div>
      </div>
      
      <div className="progress-bar">
        <div className="progress" style={{ width: getProgressWidth() }}></div>
      </div>
      
      {/* Logo */}
      <div className="logo">
        <BsBag />
      </div>
      
      {/* Phone Number Screen */}
      <div id="phoneScreen" className={`screen ${currentScreen === 'phone' ? 'active' : ''}`}>
        <h1>Welcome to ShopEasy</h1>
        <p>Enter your phone number to continue shopping</p>
        
        {phoneMessage.show && (
          <div className={`message ${phoneMessage.isError ? 'error' : 'success'} visible`}>
            <div className="message-content">
              {phoneMessage.isError && <BsExclamationCircle className="message-icon" />}
              {!phoneMessage.isError && <BsCheckCircle className="message-icon" />}
              <span>{phoneMessage.text}</span>
            </div>
            {phoneMessage.isError && (
              <button 
                className="message-close" 
                onClick={() => setPhoneMessage(prev => ({ ...prev, show: false }))}
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div className="input-group">
          <BsTelephone />
          <input 
            type="tel" 
            placeholder="Your phone number" 
            required
            value={userPhoneNumber}
            onChange={handlePhoneChange}
            onKeyPress={handlePhoneKeyPress}
            className={phoneMessage.isError && phoneMessage.show ? 'input-error' : ''}
          />
        </div>
        <button id="sendOtpBtn" onClick={handleSendOtp}>
          Continue <BsArrowRight />
        </button>
      </div>

      {/* OTP Verification Screen */}
      <div id="otpScreen" className={`screen ${currentScreen === 'otp' ? 'active' : ''}`}>
        <h1>Verify Your Number</h1>
        <p>We've sent an OTP to <span style={{ fontWeight: '600' }}>{userPhoneNumber}</span></p>
        
        {otpMessage.show && (
          <div className={`message ${otpMessage.isError ? 'error' : 'success'} visible`}>
            <div className="message-content">
              {otpMessage.isError && <BsExclamationCircle className="message-icon" />}
              {!otpMessage.isError && <BsCheckCircle className="message-icon" />}
              <span>{otpMessage.text}</span>
            </div>
            {otpMessage.isError && (
              <button 
                className="message-close" 
                onClick={() => setOtpMessage(prev => ({ ...prev, show: false }))}
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div className="otp-inputs">
          <input 
            type="text" 
            maxLength="1" 
            className={`otp-input ${otpMessage.isError && otpMessage.show ? 'input-error' : ''}`} 
            ref={otp1Ref}
            value={otp[0]}
            onChange={(e) => handleOtpChange(0, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(0, e)}
            onPaste={handleOtpPaste}
            autoFocus
          />
          <input 
            type="text" 
            maxLength="1" 
            className={`otp-input ${otpMessage.isError && otpMessage.show ? 'input-error' : ''}`} 
            ref={otp2Ref}
            value={otp[1]}
            onChange={(e) => handleOtpChange(1, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(1, e)}
          />
          <input 
            type="text" 
            maxLength="1" 
            className={`otp-input ${otpMessage.isError && otpMessage.show ? 'input-error' : ''}`} 
            ref={otp3Ref}
            value={otp[2]}
            onChange={(e) => handleOtpChange(2, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(2, e)}
          />
          <input 
            type="text" 
            maxLength="1" 
            className={`otp-input ${otpMessage.isError && otpMessage.show ? 'input-error' : ''}`} 
            ref={otp4Ref}
            value={otp[3]}
            onChange={(e) => handleOtpChange(3, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(3, e)}
          />
        </div>
        
        <button 
          id="verifyOtpBtn" 
          onClick={handleVerifyOtp}
          disabled={otp.join('').length !== 4}
        >
          Verify OTP
        </button>
        
        {otpResendCountdown > 0 ? (
          <div className="timer">
            Resend OTP in <span>{otpResendCountdown}</span>s
          </div>
        ) : null}
        
        <button 
          id="resendOtpBtn" 
          className="resend" 
          onClick={handleResendOtp}
          disabled={otpResendCountdown > 0}
        >
          Resend OTP
        </button>
      </div>

      {/* Success Screen */}
      <div id="successScreen" className={`screen ${currentScreen === 'success' ? 'active' : ''}`}>
        <h1>Verification Successful</h1>
        <BsCheckCircle style={{ fontSize: '60px', color: 'var(--success)', margin: '20px 0' }} />
        <p>Your phone number has been verified successfully!</p>
        <p>Redirecting to home page...</p>
        <div className="loader" style={{ display: 'block' }}></div>
      </div>

      {/* Loader */}
      {loading && <div className="loader"></div>}
    </div>
  );
};

export default LoginPage;