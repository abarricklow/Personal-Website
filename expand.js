// Expandable cards
// Shows its .card-details (photos, description, links)

document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.expandable');
    if (!cards.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DURATION = reduceMotion ? 0 : 450;

    // Build the overlay + panel once and reuse them
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    const panel = document.createElement('div');
    panel.className = 'card-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-panel-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';

    const body = document.createElement('div');
    body.className = 'card-panel-body';

    panel.append(closeBtn, body);

    let activeCard = null;
    let isAnimating = false;

    function setRect(el, r) {
        el.style.top = r.top + 'px';
        el.style.left = r.left + 'px';
        el.style.width = r.width + 'px';
        el.style.height = r.height + 'px';
    }

    // Work out the centered size, fitting the content when it is short
    function targetRect() {
        const width = Math.min(900, window.innerWidth * 0.92);
        const maxHeight = window.innerHeight * 0.88;

        // Measure content height at the final width
        panel.style.visibility = 'hidden';
        panel.style.transition = 'none';
        panel.style.width = width + 'px';
        panel.style.height = 'auto';
        const natural = panel.scrollHeight;
        panel.style.visibility = '';
        panel.style.transition = '';

        const height = Math.min(natural, maxHeight);
        return {
            top: (window.innerHeight - height) / 2,
            left: (window.innerWidth - width) / 2,
            width: width,
            height: height
        };
    }

    function openCard(card) {
        if (isAnimating || activeCard) return;
        isAnimating = true;
        activeCard = card;

        // Copy the card's content into the panel
        body.innerHTML = card.innerHTML;
        const heading = body.querySelector('h3');
        if (heading) {
            heading.id = 'card-panel-title';
            panel.setAttribute('aria-labelledby', 'card-panel-title');
        }

        document.body.append(overlay, panel);
        document.body.classList.add('card-open');

        const start = card.getBoundingClientRect();
        const end = targetRect();

        // Start exactly on top of the card, then grow
        panel.style.transition = 'none';
        setRect(panel, start);
        card.style.visibility = 'hidden';
        panel.offsetHeight; // force layout so the next change animates
        panel.style.transition = '';

        requestAnimationFrame(function () {
            overlay.classList.add('visible');
            setRect(panel, end);
        });

        setTimeout(function () {
            panel.classList.add('content-in');
            body.scrollTop = 0;
            closeBtn.focus();
            isAnimating = false;
        }, DURATION);
    }

    function closeCard() {
        if (isAnimating || !activeCard) return;
        isAnimating = true;

        const card = activeCard;
        panel.classList.remove('content-in');
        overlay.classList.remove('visible');
        setRect(panel, card.getBoundingClientRect());

        setTimeout(function () {
            panel.remove();
            overlay.remove();
            body.innerHTML = '';
            card.style.visibility = '';
            document.body.classList.remove('card-open');
            card.focus(); // return keyboard focus to where the user was
            activeCard = null;
            isAnimating = false;
        }, DURATION);
    }

    cards.forEach(function (card) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        card.addEventListener('click', function (e) {
            // Let real links inside a card still work
            if (e.target.closest('a')) return;
            openCard(card);
        });

        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCard(card);
            }
        });
    });

    closeBtn.addEventListener('click', closeCard);
    overlay.addEventListener('click', closeCard);

    document.addEventListener('keydown', function (e) {
        if (!activeCard) return;
        if (e.key === 'Escape') closeCard();

        // Keep Tab inside the panel while it's open
        if (e.key === 'Tab') {
            const focusable = panel.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Keep the panel centered if the window is resized while open
    window.addEventListener('resize', function () {
        if (activeCard && !isAnimating) setRect(panel, targetRect());
    });
});