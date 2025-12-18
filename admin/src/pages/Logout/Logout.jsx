import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem('adminUser');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}

export default Logout;
