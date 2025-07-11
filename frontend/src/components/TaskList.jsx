import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function TaskList({ taskService }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await taskService.deleteTask(id);
        await loadTasks();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleComplete = async (task) => {
    try {
      await taskService.updateTask(task.id, {
        ...task,
        completed: !task.completed
      });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div class="task-list-container">
      <h1>Liste des tâches</h1>
      <Link to="/add">
        <button>Ajouter une tâche</button>
      </Link>

      {tasks.length === 0 ? (
        <p>Aucune tâche trouvée.</p>
      ) : (
        <ul class="task-list">
          {tasks.map(task => (
            <li key={task.id}>
              <div class="task-item">
                <p className={`task-status ${task.completed ? 'end' : 'progress'}`}>
                  Statut: {task.completed ? 'Terminée' : 'En cours'}
                </p>
                <div class="task-infos">


                  <h3>
                    {task.title}
                  </h3>
                  <p>{task.description}</p>

                </div>
                <div class="task-inputs">
                  <button onClick={() => toggleComplete(task)}>
                    {task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                  </button>

                  <Link to={`/edit/${task.id}`}>
                    <button>Modifier</button>
                  </Link>

                  <button onClick={() => handleDelete(task.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}