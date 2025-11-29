/* Utility */
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const el = sel => document.querySelector(sel);

/* Elements */
const filterBtns = $$('.filter-btn');
const cards = $$('.card');
const gallery = el('#gallery');
const modal = el('#modal');
const mediaContainer = el('#mediaContainer');
const mediaTitle = el('#mediaTitle');
const modalClose = el('#modalClose');
const searchInput = el('#searchInput');
const btnAll = el('#btnAll');
const btnContact = el('#btnContact');

/* GOOGLE SCRIPT URL - REPLACE after deployment */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxu3KcKRAV8YggDHnwVT-dZY_PZmUCxXnTmGcL-JdaArDMOf06C9g55JDSRwtUYL0p-pw/exec";

/* Filters */
function setActiveFilter(filter){
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  filterCards(filter);
}
function filterCards(filter){
  const q = (searchInput?.value || '').trim().toLowerCase();
  cards.forEach(c=>{
    const cat = c.dataset.category || '';
    const title = (c.dataset.title||'').toLowerCase();
    const matchesFilter = filter==='all' || cat===filter;
    const matchesSearch = !q || title.includes(q);
    c.style.display = (matchesFilter && matchesSearch) ? 'block' : 'none';
  });
}

filterBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    setActiveFilter(btn.dataset.filter);
  });
});

if(btnAll) btnAll.addEventListener('click', ()=> setActiveFilter('all'));
if(searchInput) searchInput.addEventListener('input', ()=>{
  const active = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  filterCards(active);
});

/* Cards -> modal open */
cards.forEach(c=>{
  c.addEventListener('click', ()=>{
    const video = c.dataset.video;
    const title = c.dataset.title || 'Project';
    openModal(video, title);
  });
});

/* Open modal (youtube urls or direct mp4) */
function openModal(src, title){
  mediaContainer.innerHTML='';
  mediaTitle.textContent = title;

  if(/youtube|youtu\.be/.test(src)){
    const iframe = document.createElement('iframe');
    iframe.src = src.includes('embed') ? src : src.replace('watch?v=', 'embed/');
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    mediaContainer.appendChild(iframe);
  } else {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.src = src;
    mediaContainer.appendChild(video);
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

/* Modal close */
function closeModal(){
  mediaContainer.innerHTML='';
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
if(modalClose) modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });

/* Share */
el('#shareBtn')?.addEventListener('click', ()=>{
  const title = mediaTitle.textContent;
  const url = location.href;
  if(navigator.share){
    navigator.share({title, url}).catch(()=>{});
  } else {
    prompt('Share this link', url);
  }
});

/* Download */
el('#downloadBtn')?.addEventListener('click', ()=>{
  const video = mediaContainer.querySelector('video');
  if(video && video.src){
    const a = document.createElement('a'); a.href = video.src; a.download = '';
    document.body.appendChild(a); a.click(); a.remove();
  } else alert('Download not available for embedded players.');
});

/* Smooth scroll to contact */
btnContact?.addEventListener('click', ()=>{ document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'}); });

/* Lazy-loading fallback */
if('loading' in HTMLImageElement.prototype){
  // native lazy supported - nothing to do
} else {
  const imgs = $$('img[loading="lazy"]');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          const i = en.target;
          i.src = i.dataset.src || i.src;
          io.unobserve(i);
        }
      });
    },{rootMargin:'200px'});
    imgs.forEach(i=>io.observe(i));
  } else {
    // last resort: load all
    imgs.forEach(i => i.src = i.dataset.src || i.src);
  }
}

/* initial filter */
setActiveFilter('all');

/* SUBSCRIPTION form (home) */
const subscribeBtn = el('#subscribeBtn');
const emailInput = el('#emailInput');
if(subscribeBtn && emailInput){
  subscribeBtn.addEventListener('click', async ()=>{
    const email = (emailInput.value || '').trim();
    if(!email) return alert('Please enter an email.');
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = 'Sending...';

    try {
      const payload = { type: 'subscription', email };
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        alert('Thanks — you are subscribed!');
        emailInput.value = '';
      } else {
        alert('There was an error. Try again later.');
      }
    } catch (err) {
      console.error(err);
      alert('Request failed. Check your script URL and CORS settings.');
    } finally {
      subscribeBtn.disabled = false;
      subscribeBtn.textContent = 'Subscribe';
    }
  });
}

/* CONTACT form handler */
const contactForm = el('#contactForm');
if(contactForm){
  contactForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const status = el('#contactFormStatus');
    btn.disabled = true;
    const data = {
      type: 'contact',
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      phone: contactForm.phone.value.trim(),
      message: contactForm.message.value.trim()
    };
    status.textContent = 'Sending...';
    try{
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if(res.ok){
        status.textContent = 'Message sent — we will contact you soon.';
        contactForm.reset();
      } else {
        status.textContent = 'Submission failed. Try again later.';
      }
    } catch(err){
      console.error(err);
      status.textContent = 'Request failed. Check your script URL.';
    } finally {
      btn.disabled = false;
      setTimeout(()=>{ status.textContent = ''; }, 4000);
    }
  });
}
