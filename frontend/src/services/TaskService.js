export class TaskService {
  constructor(apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080') {
    this.apiUrl = apiUrl;
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, options);
      
      // Vérifier si la réponse contient du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Le serveur a retourné une réponse invalide');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Impossible de contacter le serveur. Vérifiez que l\'API est en cours d\'exécution.');
      }
      throw error;
    }
  }

  async getAllTasks() {
    return this.makeRequest(`${this.apiUrl}/tasks`);
  }

  async getTaskById(id) {
    return this.makeRequest(`${this.apiUrl}/tasks/${id}`);
  }

  async createTask(task) {
    return this.makeRequest(`${this.apiUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
  }

  async updateTask(id, task) {
    return this.makeRequest(`${this.apiUrl}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id) {
    return this.makeRequest(`${this.apiUrl}/tasks/${id}`, {
      method: 'DELETE',
    });
  }
}