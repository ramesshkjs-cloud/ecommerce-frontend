import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('USER');
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({ name: '', description: '', price: '', quantity: '' });
  const [editId, setEditId] = useState(null);



  const register = async () => {
    try {
      console.log('Registering user:', username);
      const response = await axios.post(`${API_URL}/auth/register`, { username, password, role: selectedRole });
      console.log('Registration response:', response.data);
      const newToken = response.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUsername('');
      setPassword('');
      setSelectedRole('USER');
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const login = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      const newToken = response.data.token;
      const role = response.data.role;
      setToken(newToken);
      setUserRole(role);
      localStorage.setItem('token', newToken);
      localStorage.setItem('userRole', role);
      // Clear form fields after successful login
      setUsername('');
      setPassword('');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
    }
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setProducts([]);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      alert('Failed to fetch products');
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchProducts();
  }, [token, fetchProducts]);

  const createProduct = async () => {
    try {
      await axios.post(`${API_URL}/products`, product, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProduct({ name: '', description: '', price: '', quantity: '' });
      fetchProducts();
    } catch (error) {
      alert('Failed to create product');
    }
  };

  const updateProduct = async () => {
    try {
      await axios.put(`${API_URL}/products/${editId}`, product, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProduct({ name: '', description: '', price: '', quantity: '' });
      setEditId(null);
      fetchProducts();
    } catch (error) {
      alert('Failed to update product');
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const editProduct = (p) => {
    setProduct({ name: p.name, description: p.description, price: p.price, quantity: p.quantity });
    setEditId(p.id);
  };

  if (!token) {
    return (
      <div className="container">
        <h1>Ecommerce App</h1>
        <div className="auth-form">
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button onClick={login}>Login</button>
          <button onClick={register}>Register</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Product Management</h1>
      <button onClick={logout}>Logout</button>
      
      <div className="product-form">
        <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
        <input placeholder="Name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
        <input placeholder="Description" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
        <input placeholder="Price" type="number" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} />
        <input placeholder="Quantity" type="number" value={product.quantity} onChange={(e) => setProduct({ ...product, quantity: e.target.value })} />
        <button onClick={editId ? updateProduct : createProduct}>{editId ? 'Update' : 'Create'}</button>
        {editId && <button onClick={() => { setEditId(null); setProduct({ name: '', description: '', price: '', quantity: '' }); }}>Cancel</button>}
      </div>

      <div className="product-list">
        <h2>Products</h2>
        {products.map(p => (
          <div key={p.id} className="product-item">
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p>Price: ${p.price} | Quantity: {p.quantity}</p>
            {userRole === 'ADMIN' && (
              <>
                <button onClick={() => editProduct(p)}>Edit</button>
                <button onClick={() => deleteProduct(p.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
