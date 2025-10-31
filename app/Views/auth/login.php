<section class="max-w-md mx-auto bg-white/70 backdrop-blur rounded-3xl shadow-soft border border-slate-200/80 p-8">
    <div class="mb-6 text-center">
        <h1 class="text-2xl font-semibold text-primary-700 mb-2">Acesse sua conta</h1>
        <p class="text-sm text-slate-500">Entre para gerar e acompanhar seus cálculos judiciais.</p>
    </div>
    <form method="POST" action="<?= e(app_base_url() . '/index.php?route=login'); ?>" class="space-y-5">
        <div>
            <label for="email" class="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
            <input
                type="email"
                name="email"
                id="email"
                required
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="seu@email.com">
        </div>
        <div>
            <label for="password" class="block text-sm font-medium text-slate-600 mb-1">Senha</label>
            <input
                type="password"
                name="password"
                id="password"
                required
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="******">
        </div>
        <button type="submit" class="w-full inline-flex justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 text-white font-semibold shadow-soft hover:shadow-lg transition">
            Entrar
        </button>
    </form>
    <p class="mt-6 text-center text-sm text-slate-500">
        Ainda não possui conta?
        <a href="<?= e(app_base_url() . '/index.php?route=register'); ?>" class="text-primary-600 hover:text-primary-700 font-medium">
            Cadastre-se
        </a>
    </p>
</section>
