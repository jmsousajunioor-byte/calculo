<?php
declare(strict_types=1);

// Bridge para executar a mesma aplicação PHP no ambiente da Vercel
// Mantemos SCRIPT_NAME como se fosse /index.php para que app_base_url()
// gere links corretos (sem o prefixo /api).
$_SERVER['SCRIPT_NAME'] = '/index.php';

// Delega ao front controller real
require __DIR__ . '/../public/index.php';

