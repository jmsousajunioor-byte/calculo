<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Calculo;
use DateTimeImmutable;

class DashboardController extends BaseController
{
    private Calculo $calculoModel;

    public function __construct()
    {
        $this->calculoModel = new Calculo();
    }

    public function index(): void
    {
        $this->requireAuth();

        $userId = (int) $_SESSION['user_id'];
        $month = new DateTimeImmutable('first day of this month');
        $totalMes = $this->calculoModel->countForMonth($userId, $month);
        $ultimosCalculos = array_slice($this->calculoModel->listByUser($userId), 0, 5);

        $this->render('dashboard/index', [
            'totalMes' => $totalMes,
            'ultimosCalculos' => $ultimosCalculos,
        ]);
    }
}

