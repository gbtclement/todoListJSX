import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TaskService } from './services/TaskService';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import './App.css';

function App() {
  // Utiliser l'URL de l'API depuis les variables d'environnement
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const taskService = new TaskService(apiUrl);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<TaskList taskService={taskService} />} />
          <Route path="/add" element={<TaskForm taskService={taskService} />} />
          <Route path="/edit/:id" element={<TaskForm taskService={taskService} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;