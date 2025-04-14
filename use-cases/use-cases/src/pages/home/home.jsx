import React, { useState, useEffect } from 'react';
import './home.css';

const Home = () => {
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
    }
  ];

  // State
  const [cart, setCart] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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

  // Message API functions
  const sendPromotionalMessage = async () => {
    if (isSending || messageCount >= MAX_MESSAGES) return;
    
    setIsSending(true);
    try {
      const virtualNumber = await getVirtualNumber();
      await sendMessage(virtualNumber);
      console.log('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getVirtualNumber = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/virtual-numbers/?category=e-commerce');
      if (!response.ok) throw new Error('Failed to get virtual number');
      const data = await response.json();
      return data[0].numbers;
    } catch (error) {
      console.error('Error getting virtual number:', error);
      throw error;
    }
  };

  const sendMessage = async (virtualNumber) => {
    const message = '🛍️ New minimalist collection just arrived! Shop now for exclusive deals!';
    try {
      const url = new URL('http://localhost:8000/api/receive-message/');
      url.searchParams.append('virtual_number', virtualNumber);
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

  // Send messages with 5-second interval, up to MAX_MESSAGES
  useEffect(() => {
    const sendWithInterval = async () => {
      if (messageCount < MAX_MESSAGES) {
        await sendPromotionalMessage();
        
        // If we haven't reached MAX_MESSAGES, schedule the next message
        if (messageCount < MAX_MESSAGES - 1) {
          setTimeout(sendWithInterval, 10000); // 5 seconds interval
        }
      }
    };
    
    sendWithInterval();
    
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header>
        <div className="container">
          <h1>minimal.</h1>
          <div className="cart-icon" onClick={() => setShowModal(true)}>
            🛒 {cart.length > 0 && <span>{cart.length}</span>}
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
            disabled={isSending || messageCount >= MAX_MESSAGES}
          >
            {isSending ? 'Sending...' : messageCount >= MAX_MESSAGES ? 'Max Messages Sent' : 'Get Promo Message'}
          </button>
          {messageCount > 0 && <p className="message-sent">Messages sent: {messageCount}/10</p>}
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
                <h3>{product.name}</h3>
                <p>${product.price}</p>
                <button className="btn" onClick={() => addToCart(product)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <h3>{item.name}</h3>
                        <p>${item.price} × {item.quantity}</p>
                        <button onClick={() => removeFromCart(item.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <h3>Total: ${cartTotal}</h3>
                  <button className="btn">Checkout</button>
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