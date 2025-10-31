<?php
declare(strict_types=1);

// Front controller e roteador simples

// Erros mais visíveis em dev
ini_set('display_errors', '1');
error_reporting(E_ALL);

session_start();

// Caminho base do projeto
define('BASE_PATH', dirname(__DIR__));

// Config e autoload (composer)
require BASE_PATH . '/config/config.php';
require BASE_PATH . '/config/database.php';
require BASE_PATH . '/vendor/autoload.php';

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\CalculoController;

// Obtém rota (?route=...)
$route = isset($_GET['route']) ? (string) $_GET['route'] : '';

// Rota padrão: se logado -> dashboard, senão -> login
if ($route === '') {
    $route = isset($_SESSION['user_id']) ? 'dashboard' : 'login';
}

// Normaliza método
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Instâncias de controllers conforme necessário
$auth = new AuthController();
$dash = new DashboardController();
$calc = new CalculoController();

// Despacho de rotas
switch ($route) {
    // Autenticação
    case 'login':
        if ($method === 'POST') { $auth->login(); break; }
        $auth->showLogin();
        break;

    case 'register':
        if ($method === 'POST') { $auth->register(); break; }
        $auth->showRegister();
        break;

    case 'logout':
        $auth->logout();
        break;

    // Área logada
    case 'dashboard':
        $dash->index();
        break;

    case 'gerar-calculo':
        if ($method === 'POST') { $calc->processForm(); break; }
        $calc->showForm();
        break;

    case 'meus-calculos':
        $calc->list();
        break;

    case 'download-pdf':
        $calc->download();
        break;

    default:
        http_response_code(404);
        echo 'Rota não encontrada.';
}

