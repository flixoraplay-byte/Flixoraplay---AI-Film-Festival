
    let briefs = [];
    let allEntries = [];

    document.addEventListener('DOMContentLoaded', async () => {
      // Cinematic Transition to Brand Theme
      setTimeout(() => {
        document.body.classList.add('adarena-brand');
      }, 500);

      try {
        allEntries = await API.getEntries();
      } catch (err) {
        console.warn('Failed to load entries statistics', err);
      }
      loadBriefs();

      document.getElementById('industry-filter').addEventListener('change', filterAndRender);
      document.getElementById('sort-filter').addEventListener('change', filterAndRender);
    });

    async function loadBriefs() {
      const grid = document.getElementById('briefs-grid');
      try {
        // Fetch only brand brief competitions (is_brand_brief=1)
        briefs = await API.getCompetitions({ is_brand_brief: 1 });
        filterAndRender();
      } catch (err) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
            <div class="icon"><svg data-lucide="wifi-off"></svg></div>
            <h3>Could not load briefs</h3>
            <p>${err.message}</p>
            <button class="btn btn-outline" onclick="loadBriefs()"><svg data-lucide="refresh-cw"></svg> Retry</button>
          </div>`;
        lucide.createIcons();
      }
    }

    function filterAndRender() {
      const grid = document.getElementById('briefs-grid');
      const ind = document.getElementById('industry-filter').value;
      const sort = document.getElementById('sort-filter').value;

      let filtered = [...briefs];

      // Filter by industry
      if (ind !== 'all') {
        filtered = filtered.filter(b => b.theme === ind);
      }

      // Sort
      if (sort === 'prize') {
        filtered.sort((a, b) => {
          const valA = parseInt((a.prize || '').replace(/\D/g, '') || '0', 10);
          const valB = parseInt((b.prize || '').replace(/\D/g, '') || '0', 10);
          return valB - valA;
        });
      } else if (sort === 'deadline') {
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      document.getElementById('briefs-count').textContent = `${filtered.length} Active Brief${filtered.length !== 1 ? 's' : ''}`;

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1; padding: 80px 0;">
            <div class="icon"><svg data-lucide="folder-open"></svg></div>
            <h3>No briefs found</h3>
            <p>Try changing your filters or check back later.</p>
          </div>`;
        lucide.createIcons();
        return;
      }

      const placeholders = [
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop'
      ];

      grid.innerHTML = filtered.map((brief, index) => {
        const statusBadge = {
          open: `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(46,160,67,0.15);color:var(--green-light);border-radius:4px;font-size:0.7rem;font-weight:700;"><svg data-lucide="circle-dot" style="width:10px;height:10px;"></svg> OPEN</span>`,
          judging: `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(229,165,10,0.15);color:var(--gold-light);border-radius:4px;font-size:0.7rem;font-weight:700;"><svg data-lucide="scale" style="width:10px;height:10px;"></svg> JUDGING</span>`,
          closed: `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.05);color:var(--text-3);border-radius:4px;font-size:0.7rem;font-weight:700;"><svg data-lucide="lock" style="width:10px;height:10px;"></svg> CLOSED</span>`,
        }[brief.status] || '';

        const entriesCount = allEntries.filter(e => e.competitionId === brief.id).length;
        const img = brief.thumbnail || placeholders[index % placeholders.length];
        const days = Math.max(0, Math.ceil((new Date(brief.deadline) - new Date()) / (1000 * 60 * 60 * 24)));

        return `
          <a href="/competitions/competition.html?id=${brief.id}" class="cine-card premium">
            <div class="cine-thumb">
              <img src="${img}" alt="Brief thumbnail" />
              <svg data-lucide="briefcase" style="position:relative; z-index:1; width:36px;height:36px;color:#fff;opacity:0.8;"></svg>
              <div class="premium-badge"><svg data-lucide="award" style="width:12px;height:12px;"></svg> AdArena Brief</div>
              <div style="position:absolute;bottom:16px;left:16px;z-index:2;">${statusBadge}</div>
            </div>
            
            <div class="cine-body">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <h3 class="cine-title" style="margin:0;">${brief.title}</h3>
                <div style="font-weight:800; color:var(--gold-light); font-size:1.1rem; white-space:nowrap; margin-left:12px;">${brief.prize || 'Custom'}</div>
              </div>
              
              <div style="font-size:0.8rem; color:var(--text-3); margin-bottom:12px; font-weight:600; display:flex; gap:12px;">
                <span>${brief.hostName}</span>
                <span>&bull;</span>
                <span style="color:var(--text-4);">${brief.theme || 'General'}</span>
              </div>
              
              <p class="cine-desc">${brief.description}</p>
              
              <div style="margin-top:auto; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-4); font-weight:600;">
                <span>${entriesCount} Entries</span>
                <span style="display:flex; align-items:center; gap:4px;"><svg data-lucide="clock" style="width:12px;height:12px;"></svg> ${days} days left</span>
              </div>
            </div>
          </a>`;
      }).join('');

      lucide.createIcons();
    }
    
    const snapContainer = document.getElementById('snap-container');
    const nav = document.getElementById('main-nav');
    if (snapContainer && nav) {
      snapContainer.addEventListener('scroll', () => {
        if (snapContainer.scrollTop > 50) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      });
    }
  