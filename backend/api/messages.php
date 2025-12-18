<?php
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

$pdo = getDBConnection();

$pdo->exec("CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sender ENUM('user','admin') NOT NULL,
  title VARCHAR(255) NULL,
  message TEXT NOT NULL,
  reply_to INT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$ensureColumns = function(PDO $pdo) {
  $cols = [];
  try {
    $q = $pdo->query('SHOW COLUMNS FROM messages');
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) { $cols[strtolower($r['Field'])] = true; }
  } catch (Exception $e) { return; }
  $add = function($name, $def) use ($pdo, $cols) {
    if (!isset($cols[strtolower($name)])) {
      $pdo->exec("ALTER TABLE messages ADD COLUMN `{$name}` {$def}");
    }
  };
  $add('user_id', 'INT NOT NULL');
  $add('sender', "ENUM('user','admin') NOT NULL DEFAULT 'user'");
  $add('title', 'VARCHAR(255) NULL');
  $add('message', 'TEXT NOT NULL');
  $add('reply_to', 'INT NULL');
  $add('is_read', 'TINYINT(1) DEFAULT 0');
  $add('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  $add('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
};

$ensureColumns($pdo);

function tableHasColumn(PDO $pdo, string $table, string $column): bool {
  try {
    $q = $pdo->prepare('SHOW COLUMNS FROM `' . $table . '` LIKE :col');
    $q->execute([':col' => $column]);
    return (bool)$q->fetch(PDO::FETCH_ASSOC);
  } catch (Throwable $e) { return false; }
}

function ensureConversationsTable(PDO $pdo): void {
  try {
    $pdo->query('SELECT 1 FROM conversations LIMIT 1');
  } catch (Throwable $e) {
    $pdo->exec('CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversations_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
  }
}

ensureConversationsTable($pdo);
$hasConversationId = tableHasColumn($pdo, 'messages', 'conversation_id');
$hasConversationUserId = tableHasColumn($pdo, 'conversations', 'user_id');
if (!$hasConversationUserId) {
  try { $pdo->exec('ALTER TABLE conversations ADD COLUMN user_id INT NULL'); $hasConversationUserId = true; } catch (Throwable $e) { /* ignore */ }
}

function getToken() {
  $headers = getallheaders();
  if (isset($headers['Authorization'])) {
    $h = $headers['Authorization'];
    if (strpos($h, 'Bearer ') === 0) return substr($h, 7);
  }
  return null;
}

function getUserIdByToken(PDO $pdo, $token) {
  if (!$token) return null;
  $stmt = $pdo->prepare("SELECT u.id FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.token = ? AND s.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
  $stmt->execute([$token]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  return $row ? (int)$row['id'] : null;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $token = getToken();
  $mine = isset($_GET['my']) ? $_GET['my'] : '1';
  $userId = null;
  if ($mine === '1') {
    $userId = getUserIdByToken($pdo, $token);
    if (!$userId) jsonResponse(['ok' => false, 'error' => 'Unauthorized'], 401);
  } else {
    if (isset($_GET['user_id'])) $userId = (int)$_GET['user_id'];
  }

  $where = [];
  $params = [];
  if ($userId) { $where[] = 'user_id = :uid'; $params[':uid'] = $userId; }
  if (isset($_GET['id'])) { $where[] = 'id = :id'; $params[':id'] = (int)$_GET['id']; }
  $sql = 'SELECT id, user_id, sender, title, message, reply_to, is_read, created_at, updated_at FROM messages';
  if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
  $sql .= ' ORDER BY id DESC';
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  jsonResponse(['ok' => true, 'data' => $rows]);
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  if (!$input) $input = $_POST;
  $req = ['message'];
  $missing = validateRequired($input, $req);
  if ($missing) jsonResponse(['ok' => false, 'error' => 'Missing fields', 'fields' => $missing], 422);

  $token = getToken();
  $userId = getUserIdByToken($pdo, $token);
  if (!$userId) {
    if (isset($input['user_id']) && is_numeric($input['user_id'])) {
      $userId = (int)$input['user_id'];
    } else {
      jsonResponse(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
  }

  $sender = isset($input['sender']) && in_array($input['sender'], ['user','admin'], true) ? $input['sender'] : 'user';
  $title = isset($input['title']) ? sanitizeInput($input['title']) : null;
  $msg = sanitizeInput($input['message']);
  $replyTo = isset($input['replyTo']) && is_numeric($input['replyTo']) ? (int)$input['replyTo'] : null;

  $conversationId = null;
  if ($hasConversationId) {
    if (isset($input['conversation_id']) && is_numeric($input['conversation_id'])) {
      $cid = (int)$input['conversation_id'];
      $chk = $pdo->prepare('SELECT id FROM conversations WHERE id = :cid LIMIT 1');
      $chk->execute([':cid' => $cid]);
      if ($chk->fetch(PDO::FETCH_ASSOC)) {
        $conversationId = $cid;
      }
    }
    if (!$conversationId) {
      if ($hasConversationUserId) {
        $find = $pdo->prepare('SELECT id FROM conversations WHERE user_id = :uid ORDER BY id DESC LIMIT 1');
        $find->execute([':uid' => $userId]);
        $row = $find->fetch(PDO::FETCH_ASSOC);
        if ($row) {
          $conversationId = (int)$row['id'];
        } else {
          $mk = $pdo->prepare('INSERT INTO conversations (user_id) VALUES (:uid)');
          $mk->execute([':uid' => $userId]);
          $conversationId = (int)$pdo->lastInsertId();
        }
      } else {
        // Fallback: create conversation without user_id
        $pdo->exec('INSERT INTO conversations () VALUES ()');
        $conversationId = (int)$pdo->lastInsertId();
      }
    }
  }

  if ($hasConversationId && $conversationId) {
    $stmt = $pdo->prepare('INSERT INTO messages (user_id, conversation_id, sender, title, message, reply_to) VALUES (:uid, :cid, :sender, :title, :message, :reply_to)');
    $stmt->execute([
      ':uid' => $userId,
      ':cid' => $conversationId,
      ':sender' => $sender,
      ':title' => $title,
      ':message' => $msg,
      ':reply_to' => $replyTo,
    ]);
  } else {
    $stmt = $pdo->prepare('INSERT INTO messages (user_id, sender, title, message, reply_to) VALUES (:uid, :sender, :title, :message, :reply_to)');
    $stmt->execute([
      ':uid' => $userId,
      ':sender' => $sender,
      ':title' => $title,
      ':message' => $msg,
      ':reply_to' => $replyTo,
    ]);
  }
  $id = (int)$pdo->lastInsertId();
  jsonResponse(['ok' => true, 'id' => $id]);
}

if ($method === 'PUT' || $method === 'PATCH') {
  $raw = file_get_contents('php://input');
  $input = json_decode($raw, true);
  if (!$input) { parse_str($raw, $input); if (!$input) $input = $_POST; }
  if (!isset($input['id']) || !is_numeric($input['id'])) jsonResponse(['ok' => false, 'error' => 'Missing id'], 422);
  $id = (int)$input['id'];
  $fields = [];
  $params = [':id' => $id];
  if (isset($input['is_read'])) { $fields[] = 'is_read = :is_read'; $params[':is_read'] = (int)!!$input['is_read']; }
  if (isset($input['message'])) { $fields[] = 'message = :message'; $params[':message'] = sanitizeInput($input['message']); }
  if (!$fields) jsonResponse(['ok' => false, 'error' => 'No fields'], 422);
  $sql = 'UPDATE messages SET ' . implode(', ', $fields) . ' WHERE id = :id';
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  jsonResponse(['ok' => true, 'id' => $id]);
}

if ($method === 'DELETE') {
  $id = null;
  if (isset($_GET['id'])) $id = (int)$_GET['id'];
  if (!$id) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (isset($input['id'])) $id = (int)$input['id'];
  }
  if (!$id) jsonResponse(['ok' => false, 'error' => 'Missing id'], 422);
  $stmt = $pdo->prepare('DELETE FROM messages WHERE id = :id');
  $stmt->execute([':id' => $id]);
  jsonResponse(['ok' => true, 'deleted' => $stmt->rowCount() > 0]);
}

jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
?>
