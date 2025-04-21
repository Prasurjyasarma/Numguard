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
      price: 1299,
      image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80'
    },
    {
      id: 2,
      name: 'Simple Lamp',
      price: 799,
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 3,
      name: 'Clean Table',
      price: 4999,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 4,
      name: 'Modern Sofa',
      price: 14599,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 5,
      name: 'Elegant Desk',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      id: 6,
      name: 'Minimal Bookshelf',
      price: 11149,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
  ];

  // State
  const [cart, setCart] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  
  // Three specific messages to send
  const messages = [
    {
      text: "Welcome to our store!",
      sender: "shopEasy"
    },
    {
      text: "🎁 You've earned a special reward! Use code **WELCOME10** to get 10% off your next purchase.",
      sender: "shopEasy"
    },
    {
      text: "💥 Don't forget to check out our new summer collection with 20% off for a limited time!",
      sender: "shopEasy"
    }
  ];

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

  // Send a specific message
  const sendMessage = async (message) => {
    if (!userPhoneNumber) return;
    
    try {
      // Format the phone number to ensure it's in the correct format
      const formattedNumber = userPhoneNumber.replace(/\D/g, '');
      
      // Create URL with properly encoded parameters
      const url = new URL('http://localhost:8000/api/receive-message/');
      url.searchParams.append('virtual_number', formattedNumber);
      url.searchParams.append('sender_name', message.sender);
      url.searchParams.append('message', message.text);
      
      // Use GET method as required by the API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error details:', errorData);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }
      
      setMessageCount(prev => prev + 1);
      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Handle checkout button click
  const handleCheckout = async () => {
    try {
      // Send order confirmation message
      await sendMessage({
        text: "Your order has been placed and will be delivered in 2-4 business days. Thank you for shopping with us!",
        sender: "shopEasy"
      });
      
      // Clear cart and close modal
      setCart([]);
      setShowModal(false);
      
      // Show success popup instead of alert
      setPopupMessage("Order placed successfully! Check your messages for confirmation.");
      setShowPopup(true);
      
      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
    } catch (error) {
      console.error('Error during checkout:', error);
      setPopupMessage("There was an error processing your order. Please try again.");
      setShowPopup(true);
      
      // Hide error popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
    }
  };

  // Automatically send all messages when component mounts
  useEffect(() => {
    const sendAllMessages = async () => {
      if (!userPhoneNumber || messageCount >= 3) return;
      
      try {
        // Send first message
        await sendMessage(messages[0]);
        
        // Send second message after a 7-second delay
        setTimeout(async () => {
          await sendMessage(messages[1]);
          
          // Send third message after another 7-second delay
          setTimeout(async () => {
            await sendMessage(messages[2]);
          }, 7000);
        }, 7000);
      } catch (error) {
        console.error('Error sending messages:', error);
      }
    };

    sendAllMessages();
  }, [userPhoneNumber]); // Only run when userPhoneNumber changes

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
          <h1>shopEasy.</h1>
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
          {messageCount > 0 && (
            <p className="message-sent">Messages sent: {messageCount}/3</p>
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
                  <p className="price">₹{product.price}</p>
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
                        <p>₹{item.price} × {item.quantity}</p>
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
                  <h3>Total: ₹{cartTotal}</h3>
                  <button 
                    className="btn checkout-btn" 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    Buy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Popup */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <div className="popup-icon">✓</div>
            <p className="popup-message">{popupMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;