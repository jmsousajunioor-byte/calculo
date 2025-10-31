<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use DateTimeImmutable;

abstract class BaseController
{
    protected function render(string $view, array $data = []): void
    {
        $viewPath = BASE_PATH . '/app/Views/' . $view . '.php';
        if (!file_exists($viewPath)) {
            throw new \RuntimeException("View {$view} não encontrada.");
        }

        $user = null;
        if ($this->isAuthenticated()) {
            $userModel = new User();
            $user = $userModel->findById((int) $_SESSION['user_id']);
        }

        $viewData = array_merge($data, [
            'flash' => $this->consumeFlash(),
            'authUser' => $user,
            'baseUrl' => app_base_url(),
        ]);

        extract($viewData, EXTR_OVERWRITE);

        include BASE_PATH . '/app/Views/partials/header.php';
        include $viewPath;
        include BASE_PATH . '/app/Views/partials/footer.php';
    }

    protected function isAuthenticated(): bool
    {
        return isset($_SESSION['user_id']);
    }

    protected function requireAuth(): void
    {
        if (!$this->isAuthenticated()) {
            $this->setFlash('warning', 'Faça login para acessar essa área.');
            redirect('login');
        }
    }

    protected function setFlash(string $type, string $message): void
    {
        $_SESSION['flash'][] = [
            'type' => $type,
            'message' => $message,
        ];
    }

    protected function consumeFlash(): array
    {
        $flash = $_SESSION['flash'] ?? [];
        unset($_SESSION['flash']);

        return $flash;
    }

    protected function parseDate(string $date): \DateTimeImmutable
    {
        return new DateTimeImmutable($date);
    }
}
