<?php
$pageTitle = $pageTitle ?? APP_NAME;
$isAuthenticated = isset($authUser);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle); ?> | <?= e(APP_NAME); ?></title>
    <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAADtZjDiAAAAUVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////8t9l9yAAAAJXRSTlMAAQIDBAcJEBMdKi0yNUdJUVlcgI2Vn6isusPJ1trm7vX6/P5ynBbXAAAAPklEQVQY02NgwAEYGBiY2JRgYGBQZmJhZmBjYmBgYoARjBiZ+Dh4uHi4JMRk4uRm4uPi4eLg54KShgYAAAF0JAgacHsYAAAAASUVORK5CYII=">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="<?= e(app_base_url() . '/css/app.css'); ?>">
    <script defer src="<?= e(app_base_url() . '/js/app.js'); ?>"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                        }
                    },
                    boxShadow: {
                        soft: '0 15px 35px -15px rgba(37, 99, 235, 0.45)',
                    }
                }
            }
        };
    </script>
</head>
<body class="min-h-screen bg-slate-100 text-slate-800">
    <div class="relative overflow-hidden">
        <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl">
            <div class="left-[max(10rem,50%)] aspect-[1255/678] w-[40rem] bg-gradient-to-tr from-primary-600 to-primary-400 opacity-40"></div>
        </div>
    </div>
    <header class="sticky top-0 z-20 backdrop-blur bg-white/80 border-b border-slate-200">
        <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <a href="<?= e(app_base_url() . '/index.php'); ?>" class="text-xl font-semibold text-primary-700 tracking-wide">
                <?= e(APP_NAME); ?>
            </a>
            <?php if ($isAuthenticated): ?>
                <nav class="flex items-center gap-6 text-sm font-medium">
                    <a class="hover:text-primary-600 transition" href="<?= e(app_base_url() . '/index.php?route=dashboard'); ?>">Dashboard</a>
                    <a class="hover:text-primary-600 transition" href="<?= e(app_base_url() . '/index.php?route=gerar-calculo'); ?>">Gerar Cálculo</a>
                    <a class="hover:text-primary-600 transition" href="<?= e(app_base_url() . '/index.php?route=meus-calculos'); ?>">Meus Cálculos</a>
                    <form method="POST" action="<?= e(app_base_url() . '/index.php?route=logout'); ?>">
                        <button type="submit" class="inline-flex items-center rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 text-white shadow-soft hover:shadow-lg transition">
                            Sair
                        </button>
                    </form>
                </nav>
            <?php endif; ?>
        </div>
    </header>
    <main class="mx-auto max-w-5xl px-6 py-10">
        <?php if (!empty($flash)): ?>
            <div class="space-y-3 mb-6">
                <?php foreach ($flash as $message): ?>
                    <?php
                    $styles = [
                        'success' => 'bg-green-500/10 text-green-700 border border-green-200',
                        'danger' => 'bg-red-500/10 text-red-700 border border-red-200',
                        'warning' => 'bg-yellow-500/10 text-yellow-700 border border-yellow-200',
                        'info' => 'bg-primary-500/10 text-primary-700 border border-primary-200',
                    ];
                    $style = $styles[$message['type']] ?? $styles['info'];
                    ?>
                    <div class="rounded-xl px-4 py-3 text-sm font-medium <?= $style; ?>" data-dismiss-after="6000">
                        <?= e($message['message']); ?>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
