<?php $pageTitle = 'Dashboard'; ?>
<section class="grid gap-6">
    <div class="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
                <p class="text-sm uppercase tracking-wide text-primary-600 font-semibold mb-2">Bem-vindo(a), <?= e($authUser['name'] ?? 'Usuário'); ?></p>
                <h1 class="text-3xl font-semibold text-slate-800">Resumo de produção</h1>
                <p class="text-sm text-slate-500 mt-2">Visualize rapidamente sua performance de cálculos judiciais neste mês.</p>
            </div>
            <div class="rounded-2xl border border-primary-200 bg-primary-50 px-6 py-4 text-center">
                <span class="block text-xs uppercase tracking-widest text-primary-600 font-semibold">Cálculos no mês</span>
                <span class="text-4xl font-bold text-primary-700 mt-2"><?= (int) ($totalMes ?? 0); ?></span>
            </div>
        </div>
    </div>

    <div class="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-slate-800">Últimos cálculos gerados</h2>
            <a href="<?= e(app_base_url() . '/index.php?route=meus-calculos'); ?>" class="text-sm text-primary-600 hover:text-primary-700 font-semibold">
                Ver todos
            </a>
        </div>
        <?php if (empty($ultimosCalculos)): ?>
            <div class="text-sm text-slate-500">
                Ainda não há cálculos registrados. Gere seu primeiro cálculo para começar!
            </div>
        <?php else: ?>
            <div class="overflow-hidden rounded-2xl border border-slate-100">
                <table class="min-w-full divide-y divide-slate-100">
                    <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="px-4 py-3 text-left">Título</th>
                            <th class="px-4 py-3 text-left">Tipo</th>
                            <th class="px-4 py-3 text-left">Resultado</th>
                            <th class="px-4 py-3 text-left">Criado em</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm">
                        <?php foreach ($ultimosCalculos as $calculo): ?>
                            <tr class="hover:bg-primary-50/40 transition">
                                <td class="px-4 py-3 font-medium text-slate-700"><?= e($calculo['titulo'] ?: 'Sem título'); ?></td>
                                <td class="px-4 py-3 text-slate-500"><?= e($calculo['tipo_calculo']); ?></td>
                                <td class="px-4 py-3 text-primary-600 font-semibold">R$ <?= number_format((float) $calculo['resultado'], 2, ',', '.'); ?></td>
                                <td class="px-4 py-3 text-slate-400"><?= date('d/m/Y H:i', strtotime($calculo['created_at'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</section>
