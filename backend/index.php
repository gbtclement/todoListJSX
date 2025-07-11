<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = $_ENV['DB_HOST'] ?? 'mysql';
$dbname = $_ENV['DB_NAME'] ?? 'todolist';
$username = $_ENV['DB_USER'] ?? 'todouser';
$password = $_ENV['DB_PASSWORD'] ?? 'todopassword';

// Attendre que la base de données soit prête
$max_retries = 30;
$retry_count = 0;
$pdo = null;

while ($retry_count < $max_retries) {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        break;
    } catch (PDOException $e) {
        $retry_count++;
        if ($retry_count >= $max_retries) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
        sleep(2);
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

switch ($method) {
    case 'GET':
        if ($path === '/tasks' || $path === '/') {
            try {
                $stmt = $pdo->query("SELECT * FROM tasks ORDER BY created_at DESC");
                $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Convertir completed en boolean pour le frontend
                foreach ($tasks as &$task) {
                    $task['completed'] = $task['completed'] == 1 || $task['completed'] === true;
                }
                
                echo json_encode($tasks);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } elseif (preg_match('/\/tasks\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            try {
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($task) {
                    $task['completed'] = $task['completed'] == 1 || $task['completed'] === true;
                    echo json_encode($task);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Task not found']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;

    case 'POST':
        if ($path === '/tasks' || $path === '/') {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                break;
            }
            
            if (!isset($data['title']) || empty(trim($data['title']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                break;
            }
            
            try {
                // Convertir completed en entier pour MySQL
                $completed = 0;
                if (isset($data['completed'])) {
                    $completed = $data['completed'] === true || $data['completed'] === 'true' || $data['completed'] === 1 || $data['completed'] === '1' ? 1 : 0;
                }
                
                $stmt = $pdo->prepare("INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)");
                $stmt->execute([
                    trim($data['title']),
                    $data['description'] ?? '',
                    $completed
                ]);
                
                $id = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($task) {
                    $task['completed'] = $task['completed'] == 1 || $task['completed'] === true;
                    http_response_code(201);
                    echo json_encode($task);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to create task']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;

    case 'PUT':
        if (preg_match('/\/tasks\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                break;
            }
            
            try {
                // Vérifier si la tâche existe
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $existingTask = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existingTask) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Task not found']);
                    break;
                }
                
                // Utiliser les valeurs existantes si pas fournies
                $title = isset($data['title']) ? trim($data['title']) : $existingTask['title'];
                $description = isset($data['description']) ? $data['description'] : $existingTask['description'];
                
                if (empty($title)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Title is required']);
                    break;
                }
                
                // Convertir completed en entier pour MySQL
                $completed = 0;
                if (isset($data['completed'])) {
                    $completed = $data['completed'] === true || $data['completed'] === 'true' || $data['completed'] === 1 || $data['completed'] === '1' ? 1 : 0;
                } else {
                    $completed = $existingTask['completed'] ? 1 : 0;
                }
                
                $stmt = $pdo->prepare("UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?");
                $stmt->execute([$title, $description, $completed, $id]);
                
                // Récupérer la tâche mise à jour
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($task) {
                    $task['completed'] = $task['completed'] == 1 || $task['completed'] === true;
                    echo json_encode($task);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to update task']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;

    case 'DELETE':
        if (preg_match('/\/tasks\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            try {
                $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['message' => 'Task deleted successfully']);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Task not found']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>