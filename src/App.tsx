import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AppProvider } from './context/AppContext';
import { FileProvider } from './context/FileContext';
import { UserProvider } from './context/UserContext';
import './index.css';

function App() {
  return (
    <Router>
      <UserProvider>
        <AppProvider>
          <FileProvider>
            <AppRoutes />
          </FileProvider>
        </AppProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
