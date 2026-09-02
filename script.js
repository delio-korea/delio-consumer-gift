const header = document.querySelector('[data-header]');
const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.farm-media-grid video').forEach((video) => {
  const toggle = video.closest('figure')?.querySelector('[data-video-toggle]');
  const syncVideoButton = () => {
    if (!toggle) return;
    toggle.textContent = video.paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', video.paused ? '현장 영상 재생' : '현장 영상 일시정지');
  };
  video.addEventListener('play', syncVideoButton);
  video.addEventListener('pause', syncVideoButton);
  if (prefersReducedMotion) {
    video.pause();
    syncVideoButton();
  }
  toggle?.addEventListener('click', () => {
    if (video.paused) {
      video.play().catch(syncVideoButton);
    } else {
      video.pause();
    }
  });
  syncVideoButton();
});

const productFilters = document.querySelectorAll('[data-filter]');
const productCards = document.querySelectorAll('[data-price]');
const productGrid = document.querySelector('[data-product-grid]');

productFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    productFilters.forEach((item) => item.classList.toggle('active', item === button));
    productCards.forEach((card) => {
      const visible = selected === 'all' || card.dataset.price === selected;
      card.classList.toggle('product-hidden', !visible);
    });
    if (productGrid) {
      productGrid.scrollTo({ left: 0, behavior: 'smooth' });
    }
  });
});

const productToggles = document.querySelectorAll('[data-product-toggle]');
productToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const card = toggle.closest('.gift-card');
    const willOpen = !card.classList.contains('detail-open');

    productToggles.forEach((otherToggle) => {
      otherToggle.closest('.gift-card').classList.remove('detail-open');
      otherToggle.setAttribute('aria-expanded', 'false');
      otherToggle.textContent = '+';
    });

    if (willOpen) {
      card.classList.add('detail-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = '−';
    }
  });
});

const inquiryForm = document.querySelector('[data-inquiry-form]');
if (inquiryForm) {
  const submitButton = inquiryForm.querySelector('[type="submit"]');
  const formStatus = inquiryForm.querySelector('[data-form-status]');
  const submitLabel = submitButton.innerHTML;

  inquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = '문의 내용을 보내는 중입니다...';
    formStatus.className = 'form-status';
    formStatus.textContent = '';

    const values = Object.fromEntries(new FormData(inquiryForm));
    values._subject = `[DELIO 개인 선물 주문 문의] ${values.성함 || ''}`;
    values._template = 'table';
    values._captcha = 'false';

    try {
      const response = await fetch('https://formsubmit.co/ajax/deli_o@naver.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      const needsActivation = result.success === 'false'
        && /activation|activate form/i.test(result.message || '');
      if (needsActivation) {
        formStatus.classList.add('is-notice');
        formStatus.textContent = '문의 접수 기능을 활성화하는 중입니다. 관리자 확인 후 다시 이용해주세요.';
        return;
      }
      if (!response.ok || result.success === 'false' || result.success === false) {
        throw new Error(result.message || 'Form submission failed');
      }

      inquiryForm.reset();
      formStatus.classList.add('is-success');
      formStatus.textContent = '문의가 정상적으로 접수되었습니다. 델리오에서 확인 후 연락드리겠습니다.';
    } catch (error) {
      console.error('DELIO inquiry submission error:', error);
      formStatus.classList.add('is-error');
      formStatus.textContent = location.protocol === 'file:'
        ? '로컬 파일에서는 전송할 수 없습니다. 배포된 홈페이지에서 다시 테스트해주세요.'
        : '전송에 실패했습니다. 잠시 후 다시 시도하거나 카카오 문의를 이용해주세요.';
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = submitLabel;
    }
  });
}
