import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/login/login';
import Home from './pages/home/home';
import { UserProvider } from './userContext';

function App() {
  return (
    <UserProvider>
  
        <Routes>
          <Route path='/' element={<Login />}/>
          <Route path='/home' element={<Home/>}/>
        </Routes>

    </UserProvider>
  );
}

export default App