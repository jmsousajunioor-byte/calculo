<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;

class AuthController extends BaseController
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function showLogin(): void
    {
        if ($this->isAuthenticated()) {
            redirect('dashboard');
        }

        $this->render('auth/login');
    }

    public function showRegister(): void
    {
        if ($this->isAuthenticated()) {
            redirect('dashboard');
        }

        $this->render('auth/register');
    }

    public function login(): void
    {
        $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) {
            $this->setFlash('danger', 'Informe e-mail e senha válidos.');
            redirect('login');
        }

        $user = $this->userModel->findByEmail($email);
        if (!$user || !password_verify($password, $user['password'])) {
            $this->setFlash('danger', 'Credenciais inválidas.');
            redirect('login');
        }

        $_SESSION['user_id'] = (int) $user['id'];
        $this->setFlash('success', 'Bem-vindo de volta!');
        redirect('dashboard');
    }

    public function register(): void
    {
        $name = trim((string) filter_input(INPUT_POST, 'name'));
        $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';
        $passwordConfirmation = $_POST['password_confirmation'] ?? '';

        if (empty($name) || !$email || strlen($password) < 6 || $password !== $passwordConfirmation) {
            $this->setFlash('danger', 'Preencha os campos corretamente. A senha deve conter ao menos 6 caracteres.');
            redirect('register');
        }

        try {
            if ($this->userModel->findByEmail($email)) {
                $this->setFlash('warning', 'Este e-mail já está cadastrado.');
                redirect('register');
            }
        } catch (\Throwable $e) {
            $this->setFlash('danger', 'Erro de conexão com o banco de dados: ' . $e->getMessage());
            redirect('register');
        }

        try {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $this->userModel->create($name, $email, $hashedPassword);
        } catch (\Throwable $e) {
            $this->setFlash('danger', 'Erro ao salvar no banco de dados: ' . $e->getMessage());
            redirect('register');
        }

        $this->setFlash('success', 'Cadastro realizado! Faça login para continuar.');
        redirect('login');
    }

    public function logout(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            exit('Método não permitido');
        }

        $_SESSION = [];
        if (session_id() !== '') {
            session_regenerate_id(true);
        }

        $this->setFlash('success', 'Sessão encerrada com sucesso.');
        redirect('login');
    }
}
