import React, { createContext, useState, useEffect, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Load from session storage on initial mount
  useEffect(() => {
    const storedPhone = sessionStorage.getItem('userPhoneNumber');
    const storedVerification = sessionStorage.getItem('isVerified') === 'true';
    
    if (storedPhone) setUserPhoneNumber(storedPhone);
    if (storedVerification) setIsVerified(storedVerification);
  }, []);

  // Update session storage when values change
  useEffect(() => {
    if (userPhoneNumber) {
      sessionStorage.setItem('userPhoneNumber', userPhoneNumber);
    }
    sessionStorage.setItem('isVerified', isVerified.toString());
  }, [userPhoneNumber, isVerified]);

  return (
    <UserContext.Provider value={{ 
      userPhoneNumber, 
      setUserPhoneNumber,
      isVerified,
      setIsVerified
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);