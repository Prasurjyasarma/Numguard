import React, { useState, useEffect } from 'react';
import { useUserContext } from '../../userContext';
import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
  // Get phone number from context and navigation hook
  const { userPhoneNumber, logout } = useUserContext();
  const navigate = useNavigate();

  // Product data
  const products = [
    {
      id: 1,
      name: 'Minimal Chair',
      price: 199,
      image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80'
    },
    {
      id: 2,
      name: 'Simple Lamp',
      price: 89,
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 3,
      name: 'Clean Table',
      price: 299,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 4,
      name: 'Modern Sofa',
      price: 599,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 5,
      name: 'Elegant Desk',
      price: 349,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 6,
      name: 'Minimal Bookshelf',
      price: 249,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
  ];

  // State
  const [cart, setCart] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  // Maximum number of messages to send
  const MAX_MESSAGES = 10;

  // Add to cart
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? {...item, quantity: item.quantity + 1} : item
        );
      }
      return [...prev, {...product, quantity: 1}];
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Message sending function
  const sendPromotionalMessage = async () => {
    if (!userPhoneNumber) return;
    
    try {
      const message = '🛍️ New minimalist collection just arrived! Shop now for exclusive deals!';
      const url = new URL('http://localhost:8000/api/receive-message/');
      url.searchParams.append('virtual_number', userPhoneNumber);
      url.searchParams.append('sender_name', 'shopeasy');
      url.searchParams.append('message', message);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to send message');
      
      setMessageCount(prev => prev + 1);
      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Send messages with interval
  useEffect(() => {
    let intervalId;
    
    if (userPhoneNumber && messageCount < MAX_MESSAGES) {
      // Send first message immediately
      sendPromotionalMessage();
      
      // Then set up interval for subsequent messages
      intervalId = setInterval(async () => {
        if (messageCount < MAX_MESSAGES - 1) { // -1 because we already sent the first one
          await sendPromotionalMessage();
        } else {
          clearInterval(intervalId);
        }
      }, 5000); // 5 second delay
    }

    // Cleanup interval on unmount or when conditions change
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userPhoneNumber]); // Only depend on userPhoneNumber

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className="app">
      {/* Header */}
      <header>
        <div className="container">
          <h1>minimal.</h1>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
            <div className="cart-icon" onClick={() => setShowModal(true)}>
              🛒 {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h2>Minimal Design, Maximum Quality</h2>
          <p>Discover our curated collection of minimalist products</p>
          <button 
            className="btn" 
            onClick={sendPromotionalMessage} 
            disabled={!userPhoneNumber || messageCount >= MAX_MESSAGES}
          >
            {!userPhoneNumber 
              ? 'No Verified Number' 
              : messageCount >= MAX_MESSAGES 
                ? 'Max Messages Sent' 
                : 'Get Promo Message'}
          </button>
          {messageCount > 0 && (
            <p className="message-sent">Messages sent: {messageCount}/{MAX_MESSAGES}</p>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="products">
        <div className="container">
          <h2>Our Collection</h2>
          <div className="product-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="price">${product.price}</p>
                  <button 
                    className="btn" 
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button 
              className="close-btn" 
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <p>${item.price} × {item.quantity}</p>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <h3>Total: ${cartTotal}</h3>
                  <button className="btn checkout-btn">Checkout</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;