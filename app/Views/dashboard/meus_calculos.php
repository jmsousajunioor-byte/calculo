<?php $pageTitle = 'Meus cálculos'; ?>
<section class="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-semibold text-slate-800">Histórico de cálculos</h1>
            <p class="text-sm text-slate-500 mt-2">
                Consulte os cálculos já realizados, baixe os PDFs e acompanhe os resultados.
            </p>
        </div>
        <a href="<?= e(app_base_url() . '/index.php?route=gerar-calculo'); ?>" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-white font-semibold shadow-soft hover:shadow-lg transition">
            Novo cálculo
        </a>
    </div>

    <?php if (empty($calculos)): ?>
        <div class="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-10 text-center">
            <p class="text-sm font-medium text-primary-600">Você ainda não gerou cálculos.</p>
            <p class="text-xs text-primary-500 mt-2">Comece criando um novo cálculo para visualizar seu histórico aqui.</p>
        </div>
    <?php else: ?>
        <div class="overflow-x-auto rounded-2xl border border-slate-100">
            <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th class="px-4 py-3 text-left">Título</th>
                        <th class="px-4 py-3 text-left">Período</th>
                        <th class="px-4 py-3 text-left">Resultado</th>
                        <th class="px-4 py-3 text-left">Criado em</th>
                        <th class="px-4 py-3 text-left">PDF</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                    <?php foreach ($calculos as $calculo): ?>
                        <tr class="hover:bg-primary-50/40 transition">
                            <td class="px-4 py-3 font-medium text-slate-700"><?= e($calculo['titulo'] ?: 'Sem título'); ?></td>
                            <td class="px-4 py-3 text-slate-500">
                                <?= date('d/m/Y', strtotime($calculo['data_inicio'])); ?>
                                –
                                <?= date('d/m/Y', strtotime($calculo['data_final'])); ?>
                            </td>
                            <td class="px-4 py-3 text-primary-600 font-semibold">
                                R$ <?= number_format((float) $calculo['resultado'], 2, ',', '.'); ?>
                            </td>
                            <td class="px-4 py-3 text-slate-400"><?= date('d/m/Y H:i', strtotime($calculo['created_at'])); ?></td>
                            <td class="px-4 py-3">
                                <a
                                    class="inline-flex items-center gap-1 rounded-full border border-primary-300 bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-600 hover:bg-primary-100 transition"
                                    href="<?= e(app_base_url() . '/index.php?route=download-pdf&id=' . $calculo['id']); ?>"
                                >
                                    Baixar
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    <?php endif; ?>
</section>
