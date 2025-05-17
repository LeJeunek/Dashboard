import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default Callback;
