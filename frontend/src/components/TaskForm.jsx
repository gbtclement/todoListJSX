import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function TaskForm({ taskService }) {
  const [task, setTask] = useState({
    title: '',
    description: '',
    completed: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTaskById(id);
      setTask(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!task.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    try {
      setLoading(true);
      setError(null); // Reset error

      let response;
      if (isEdit) {
        response = await taskService.updateTask(id, task);
      } else {
        response = await taskService.createTask(task);
      }

      console.log('Réponse:', response);
      navigate('/');
    } catch (err) {
      console.error('Erreur complète:', err);

      // Gestion d'erreur améliorée
      if (err.message.includes('JSON')) {
        setError('Erreur de communication avec le serveur. Vérifiez que l\'API fonctionne correctement.');
      } else if (err.message.includes('fetch')) {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTask(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading && isEdit) return <div>Chargement...</div>;

  return (
    <div class="task-form">
      <h1>{isEdit ? 'Modifier la tâche' : 'Ajouter une tâche'}</h1>

      {error && (
        <div style={{
          color: 'red',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ff0000',
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div class="task-form-title">
          <label>
            Titre:
            </label>
            <input
              type="text"
              name="title"
              value={task.title}
              onChange={handleChange}
              required
            />
          
        </div>

        <div class="task-form-description">
          <label>
            Description:
            </label>
            <textarea
              name="description"
              value={task.description}
              onChange={handleChange}
            />
          
        </div>

        {isEdit && (
          <div>
            <label>
              <input
                type="checkbox"
                name="completed"
                checked={task.completed}
                onChange={handleChange}
              />
              Terminée
            </label>
          </div>
        )}

        <div class="task-form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Chargement...' : (isEdit ? 'Modifier' : 'Ajouter')}
          </button>

          <button type="button" onClick={() => navigate('/')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}