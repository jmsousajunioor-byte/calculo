<?php $pageTitle = 'Gerar cálculo'; ?>
<section class="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
    <div class="mb-8">
        <h1 class="text-2xl font-semibold text-slate-800">Gerar cálculo judicial</h1>
        <p class="text-sm text-slate-500 mt-2">
            Preencha os dados para calcular automaticamente correção pelo INPC e juros legais. Se a API do IBGE estiver indisponível, informe o percentual manual no campo de fallback.
        </p>
    </div>

    <form method="POST" action="<?= e(app_base_url() . '/index.php?route=gerar-calculo'); ?>" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
            <label for="titulo" class="block text-sm font-medium text-slate-600 mb-1">Título do cálculo</label>
            <input
                type="text"
                id="titulo"
                name="titulo"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Ex: Aluguel Junho/2023"
            >
        </div>

        <div>
            <label for="valor_base" class="block text-sm font-medium text-slate-600 mb-1">Valor base (R$)</label>
            <input
                type="text"
                id="valor_base"
                name="valor_base"
                required
                inputmode="decimal"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="0,00"
            >
        </div>

        <div>
            <label for="tipo_calculo" class="block text-sm font-medium text-slate-600 mb-1">Tipo de cálculo</label>
            <input
                type="text"
                id="tipo_calculo"
                name="tipo_calculo"
                required
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Ex: Aluguel com INPC + 1% a.m."
            >
        </div>

        <div>
            <label for="juros_mensal" class="block text-sm font-medium text-slate-600 mb-1">Juros mensais (%)</label>
            <input
                type="number"
                step="0.01"
                min="0"
                id="juros_mensal"
                name="juros_mensal"
                value="1.00"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Ex: 1,00"
            >
            <p class="text-xs text-slate-400 mt-1">Percentual de juros aplicado mês a mês.</p>
        </div>

        <div>
            <label for="inicio_juros" class="block text-sm font-medium text-slate-600 mb-1">Início dos juros (opcional)</label>
            <input
                type="date"
                id="inicio_juros"
                name="inicio_juros"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
            <p class="text-xs text-slate-400 mt-1">Se não informado: usa regra padrão (a partir da citação; caso posterior, a partir do dia seguinte ao vencimento).</p>
        </div>

        <div>
            <label for="data_inicio" class="block text-sm font-medium text-slate-600 mb-1">Data inicial</label>
            <input
                type="date"
                id="data_inicio"
                name="data_inicio"
                required
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
        </div>

        <div>
            <label for="data_citacao" class="block text-sm font-medium text-slate-600 mb-1">Data da citação</label>
            <input
                type="date"
                id="data_citacao"
                name="data_citacao"
                required
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
        </div>

        <div>
            <label for="data_final" class="block text-sm font-medium text-slate-600 mb-1">Data final</label>
            <input
                type="date"
                id="data_final"
                name="data_final"
                required
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
        </div>

        <div class="md:col-span-2">
            <label for="inpc_override" class="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
                Fallback INPC (%) <span class="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <input
                type="number"
                step="0.01"
                min="0"
                id="inpc_override"
                name="inpc_override"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Informe percentual acumulado se necessário"
            >
            <p class="text-xs text-slate-400 mt-2">
                Este valor será usado apenas se a consulta automática ao INPC falhar. Informe o percentual acumulado desejado (ex: 5,32).
            </p>
        </div>

        <div class="md:col-span-2 flex justify-end">
            <button type="submit" class="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-white font-semibold shadow-soft hover:shadow-lg transition">
                Gerar cálculo e PDF
            </button>
        </div>
    </form>
</section>
