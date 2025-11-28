// Nautilus.CIM - Shared Sidebar Script

// Sidebar resize functionality
let isResizing = false;
let startX = 0;
let startWidth = 0;

function initSidebarResize() {
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    if (!resizeHandle) return;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        // Убедиться, что клик именно на handle элементе
        if (e.target !== resizeHandle && !resizeHandle.contains(e.target)) {
            return;
        }
        
        isResizing = true;
        startX = e.clientX;
        startWidth = document.getElementById('sidebar').offsetWidth;
        document.body.style.userSelect = 'none';
        resizeHandle.style.backgroundColor = 'var(--primary-color)';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const diff = e.clientX - startX;
        const newWidth = Math.max(150, Math.min(500, startWidth + diff)); // Min 150px, Max 500px
        
        document.getElementById('sidebar').style.width = newWidth + 'px';
        localStorage.setItem('sidebarWidth', newWidth);
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = '';
            const resizeHandle = document.getElementById('sidebar-resize-handle');
            if (resizeHandle) {
                resizeHandle.style.backgroundColor = '';
            }
        }
    });
}

function restoreSidebarWidth() {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
        document.getElementById('sidebar').style.width = savedWidth + 'px';
    }
}

// Sidebar toggle functionality
let savedSidebarWidth = null;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCurrentlyCollapsed) {
        // Раскрываем сайдбар
        const width = savedSidebarWidth || localStorage.getItem('sidebarWidth') || '250px';
        sidebar.style.width = width + 'px';
        sidebar.classList.remove('collapsed');
        toggleBtn.classList.add('sidebar-open');
    } else {
        // Скрываем сайдбар
        // Сохраняем текущую ширину перед скрытием
        const currentWidth = sidebar.offsetWidth || localStorage.getItem('sidebarWidth') || '250px';
        savedSidebarWidth = currentWidth;
        sidebar.style.width = '0px';
        sidebar.classList.add('collapsed');
        toggleBtn.classList.remove('sidebar-open');
    }
    
    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// Restore sidebar state on page load
function restoreSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const savedWidth = localStorage.getItem('sidebarWidth') || '250px';
    
    // Сохранить ширину в переменную для toggleSidebar
    savedSidebarWidth = savedWidth;
    
    if (isCollapsed) {
        // Сайдбар должен быть скрыт
        sidebar.classList.add('collapsed');
        toggleBtn.classList.remove('sidebar-open');
        sidebar.style.width = '0px';
    } else {
        // Сайдбар должен быть видим
        sidebar.classList.remove('collapsed');
        toggleBtn.classList.add('sidebar-open');
        sidebar.style.width = savedWidth + 'px';
    }
    
    // Initialize resize functionality
    initSidebarResize();
}

// Projects Tree Navigation
let lastProjectsClickTime = 0;

function handleProjectsClick() {
    const now = Date.now();
    const timeSinceLastClick = now - lastProjectsClickTime;
    lastProjectsClickTime = now;
    
    // это нужно было для главной, я от этого отказался
    // Если двойной клик (менее 300ms между кликами)
    if (timeSinceLastClick < 300) {
        window.location.href = 'projects.html';
        return;
    }
    
    // Одиночный клик - раскрыть/закрыть дерево
    toggleProjectsTree();
}

function toggleProjectsTree() {
    const container = document.getElementById('projects-tree-container');
    const button = document.querySelector('.nav-tree-toggle');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
        // If on projects.html page, check if we're viewing project details
        if (window.location.pathname.includes('projects.html')) {
            const modelsContainer = document.getElementById('models-container');
            const profilesContainer = document.getElementById('profiles-container');
            
            // If viewing project details, just show projects list (keep tree expanded)
            if (modelsContainer && !modelsContainer.classList.contains('hidden')) {
                if (typeof showProjectsList === 'function') {
                    showProjectsList();
                }
                return; // Don't collapse the tree
            }
        }
        
        // Otherwise, collapse the tree normally
        container.classList.add('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'false');
        // Сохранить состояние дерева в localStorage
        localStorage.setItem('projectsTreeExpanded', 'false');
    } else {
        container.classList.remove('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'true');
        // Сохранить состояние дерева в localStorage
        localStorage.setItem('projectsTreeExpanded', 'true');
        renderProjectsTree();
    }
}

function renderProjectsTree() {
    const projectsList = document.getElementById('projects-list-tree');
    const projects = getAllProjects();
    const currentProjectId = getCurrentProjectId();
    const expandedProjects = JSON.parse(localStorage.getItem('expandedProjects') || '{}');
    
    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<div class="nav-tree-item-link no-projects-tree">Нет проектов</div>';
        return;
    }
    
    const html = projects.map(p => {
        const isExpanded = expandedProjects[p.id];
        const isCurrentProject = currentProjectId === p.id;
        
        return `
            <div class="project-tree-item">
                <div class="project-tree-header ${isCurrentProject ? 'active' : ''}">
                    <button class="project-expand-btn" onclick="toggleProjectStructure(${p.id}); event.stopPropagation();" 
                            aria-expanded="${isExpanded ? 'true' : 'false'}">
                        <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    </button>
                    <span class="project-name" data-id="${p.id}" onclick="selectProject(${p.id}); event.stopPropagation();" title="${p.name}">
                        📦 ${p.name}
                    </span>
                </div>
                ${isExpanded ? `
                    <div class="project-structure">
                        ${p.models && p.models.length > 0 ? `
                            <div class="structure-section">
                                <div class="structure-title">📋 Модели (${p.models.length})</div>
                                <div class="structure-items">
                                    ${p.models.map(m => `
                                        <div class="structure-item" data-id="${m.id || ''}">🔷 ${m.name || 'Модель без названия'}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${p.profiles && p.profiles.length > 0 ? `
                            <div class="structure-section">
                                <div class="structure-title">⚙️ Профили (${p.profiles.length})</div>
                                <div class="structure-items">
                                    ${p.profiles.map(pr => `
                                        <div class="structure-item" data-id="${pr.id || ''}">⚡ ${pr.name || 'Профиль без названия'}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${(!p.models || p.models.length === 0) && (!p.profiles || p.profiles.length === 0) ? `
                            <div class="structure-empty">Нет моделей и профилей</div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    projectsList.innerHTML = html;
}

function toggleProjectStructure(projectId) {
    const expandedProjects = JSON.parse(localStorage.getItem('expandedProjects') || '{}');
    
    if (expandedProjects[projectId]) {
        delete expandedProjects[projectId];
    } else {
        expandedProjects[projectId] = true;
    }
    
    localStorage.setItem('expandedProjects', JSON.stringify(expandedProjects));
    renderProjectsTree();
}

// Restore projects tree state on page load
function restoreProjectsTreeState() {
    const isExpanded = localStorage.getItem('projectsTreeExpanded') === 'true';
    const container = document.getElementById('projects-tree-container');
    const button = document.querySelector('.nav-tree-toggle');
    
    if (isExpanded) {
        container.classList.remove('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'true');
        renderProjectsTree();
    } else {
        container.classList.add('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'false');
    }
}
