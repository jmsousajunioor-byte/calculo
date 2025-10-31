document.addEventListener('DOMContentLoaded', () => {
    const alerts = document.querySelectorAll('[data-dismiss-after]');
    alerts.forEach((alert) => {
        const timeout = parseInt(alert.dataset.dismissAfter, 10) || 5000;
        setTimeout(() => {
            alert.classList.add('opacity-0', 'translate-y-1');
            setTimeout(() => alert.remove(), 300);
        }, timeout);
    });
});
