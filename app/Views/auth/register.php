<section class="max-w-xl mx-auto bg-white/70 backdrop-blur rounded-3xl shadow-soft border border-slate-200/80 p-8">
    <div class="mb-6 text-center">
        <h1 class="text-2xl font-semibold text-primary-700 mb-2">Crie seu acesso</h1>
        <p class="text-sm text-slate-500">Cadastre-se para começar a automatizar cálculos judiciais.</p>
    </div>
    <form method="POST" action="<?= e(app_base_url() . '/index.php?route=register'); ?>" class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
                <label for="name" class="block text-sm font-medium text-slate-600 mb-1">Nome completo</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Maria Advogada">
            </div>
            <div class="sm:col-span-2">
                <label for="email" class="block text-sm font-medium text-slate-600 mb-1">E-mail profissional</label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="maria@escritorio.com">
            </div>
            <div>
                <label for="password" class="block text-sm font-medium text-slate-600 mb-1">Senha</label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    minlength="6"
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Mínimo 6 caracteres">
            </div>
            <div>
                <label for="password_confirmation" class="block text-sm font-medium text-slate-600 mb-1">Confirmação</label>
                <input
                    type="password"
                    name="password_confirmation"
                    id="password_confirmation"
                    required
                    minlength="6"
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Repita a senha">
            </div>
        </div>
        <button type="submit" class="w-full inline-flex justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 text-white font-semibold shadow-soft hover:shadow-lg transition">
            Criar conta
        </button>
    </form>
    <p class="mt-6 text-center text-sm text-slate-500">
        Já possui login?
        <a href="<?= e(app_base_url() . '/index.php?route=login'); ?>" class="text-primary-600 hover:text-primary-700 font-medium">
            Faça login
        </a>
    </p>
</section>
