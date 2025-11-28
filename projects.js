// Nautilus.CIM - Projects Page Script

let currentEditProjectId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSampleData();
    updateCurrentProject();
    renderProjects();
    renderProjectsTree();
    restoreSidebarState();
    restoreProjectsTreeState();
});

let selectedProjectId = null;
let selectedModelId = null;
let selectedProfileId = null;

function renderProjects() {
    // Don't re-render if we're viewing project details
    if (selectedProjectId !== null) {
        return;
    }
    
    const projects = getProjects();
    const html = projects.map(p => `
        <div class="card">
            <div class="flex-between mb-10">
                <div>
                    <div style="font-weight:600; font-size:16px; margin-bottom:5px; cursor:pointer;" onclick="viewProjectDetails(${p.id})">${p.name}</div>
                    <div style="font-size:13px; color:var(--text-secondary);">Версия ${p.version} • Создан: ${p.createdAt || 'N/A'}</div>
                </div>
                <div class="flex gap-10">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${p.id})">✏️ Изменить</button>
                    <button class="btn btn-primary btn-small" onclick="openProject(${p.id})">Открыть →</button>
                </div>
            </div>
            <div style="margin-top:10px; color:var(--text-secondary); font-size:14px;">
                ${p.description || 'Нет описания'}
            </div>
            <div style="margin-top:15px; display:flex; gap:15px; font-size:13px;">
                <span>📋 Модели: <strong>${p.models.length}</strong></span>
                <span>⚙️ Профили: <strong>${p.profiles.length}</strong></span>
            </div>
        </div>
    `).join('');

    document.getElementById('projects-list').innerHTML = html || '<div style="text-align:center; color:var(--text-secondary); padding:40px;">Нет проектов</div>';
}

function viewProjectDetails(projectId) {
    selectedProjectId = projectId;
    
    // Reset selection when switching projects
    selectedModelId = null;
    selectedProfileId = null;
    
    // Hide search and projects list
    document.getElementById('search-box').classList.add('hidden');
    document.getElementById('projects-list').classList.add('hidden');
    
    // Show models and profiles containers
    document.getElementById('models-container').classList.remove('hidden');
    document.getElementById('profiles-container').classList.remove('hidden');
    
    // Show open project button
    document.getElementById('open-project-action').classList.remove('hidden');
    
    // Clear details panels
    document.getElementById('model-details').innerHTML = '<div class="text-center">Выберите модель для просмотра деталей</div>';
    document.getElementById('profile-details').innerHTML = '<div class="text-center">Выберите профиль для просмотра деталей</div>';
    
    // Render project details
    renderModels(projectId);
    renderProfiles(projectId);
}

function showProjectsList() {
    // Hide models and profiles containers
    document.getElementById('models-container').classList.add('hidden');
    document.getElementById('profiles-container').classList.add('hidden');
    
    // Hide open project button
    document.getElementById('open-project-action').classList.add('hidden');
    
    // Show search and projects list
    document.getElementById('search-box').classList.remove('hidden');
    document.getElementById('projects-list').classList.remove('hidden');
    
    selectedProjectId = null;
    selectedModelId = null;
    selectedProfileId = null;
}

function renderModels(projectId) {
    const models = getModels(projectId);
    const html = models.map(m => `
        <div class="tree-item ${selectedModelId === m.id ? 'selected' : ''}" onclick="selectModel(${m.id}, '${m.name}')">
            📦 ${m.name}
        </div>
    `).join('');
    
    document.getElementById('models-list').innerHTML = html || '<div class="no-items text-muted">Нет моделей</div>';
}

function renderProfiles(projectId) {
    const profiles = getProfiles(projectId);
    const html = profiles.map(p => `
        <div class="tree-item ${selectedProfileId === p.id ? 'selected' : ''}" onclick="selectProfile(${p.id}, '${p.name}')">
            ⚙️ ${p.name}
        </div>
    `).join('');
    
    document.getElementById('profiles-list').innerHTML = html || '<div class="no-items text-muted">Нет профилей</div>';
}

function selectModel(modelId, modelName) {
    selectedModelId = modelId;
    renderModels(selectedProjectId);
    renderModelDetails();
}

function selectProfile(profileId, profileName) {
    selectedProfileId = profileId;
    renderProfiles(selectedProjectId);
    renderProfileDetails();
}

function renderModelDetails() {
    const model = getModel(selectedProjectId, selectedModelId);
    if (!model) return;
    
    const html = `
        <div class="tabs">
            <div class="tab active">Свойства</div>
        </div>
        <div class="tab-content active">
            <div class="flex-between mb-15">
                <h3 class="no-margin">${model.name}</h3>
            </div>
            <table class="table model-details-table">
                <tr>
                    <td colspan="2">Описание</td>
                    <td colspan="2">${model.description}</td>
                </tr>
                <tr>
                    <td>Дата создания/загрузки: </td>
                    <td><span>${model.createDate || '---'}</span></td>
                    <td>Дата изменения: </td>
                    <td><span>${model.modifyDate || '---'}</span></td>
                </tr>
                <tr>
                    <td colspan="2">Используется в профилях</td>
                    <td colspan="2">${model.relatedProfiles && model.relatedProfiles.length > 0 ? model.relatedProfiles.map(p => p.name).join(", ") : "---"}</td>
                </tr>
            </table>
        </div>
    `;
    
    document.getElementById('model-details').innerHTML = html;
}

function renderProfileDetails() {
    const profile = getProfile(selectedProjectId, selectedProfileId);
    if (!profile) return;
    
    const html = `
        <div class="tabs">
            <div class="tab active">Свойства</div>
        </div>
        <div class="tab-content active">
            <div class="flex-between mb-15">
                <h3 class="no-margin">${profile.name}</h3>
            </div>
            <table class="table">
                <tr>
                    <td class="table-label">Базовая модель</td>
                    <td><span class="badge">${profile.baseModel}</span></td>
                </tr>
                <tr>
                    <td class="table-label">Версия</td>
                    <td>${profile.version}</td>
                </tr>
                <tr>
                    <td class="table-label">Описание</td>
                    <td>${profile.description}</td>
                </tr>
                <tr>
                    <td class="table-label">Классов в профиле</td>
                    <td>${profile.classes || 0}</td>
                </tr>
                <tr>
                    <td class="table-label">Атрибутов</td>
                    <td>${profile.attributes || 0}</td>
                </tr>
            </table>
        </div>
    `;
    
    document.getElementById('profile-details').innerHTML = html;
}

function filterProjects() {
    const query = document.getElementById('search-projects').value.toLowerCase();
    const projects = getProjects();
    const filtered = projects.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
    );

    const html = filtered.map(p => `
        <div class="card">
            <div class="flex-between mb-10">
                <div>
                    <div style="font-weight:600; font-size:16px; margin-bottom:5px;">${p.name}</div>
                    <div style="font-size:13px; color:var(--text-secondary);">Версия ${p.version} • Создан: ${p.createdAt || 'N/A'}</div>
                </div>
                <div class="flex gap-10">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${p.id})">✏️ Изменить</button>
                    <button class="btn btn-primary btn-small" onclick="openProject(${p.id})">Открыть →</button>
                </div>
            </div>
            <div style="margin-top:10px; color:var(--text-secondary); font-size:14px;">
                ${p.description || 'Нет описания'}
            </div>
            <div style="margin-top:15px; display:flex; gap:15px; font-size:13px;">
                <span>📋 Модели: <strong>${p.models.length}</strong></span>
                <span>⚙️ Профили: <strong>${p.profiles.length}</strong></span>
            </div>
        </div>
    `).join('');

    document.getElementById('projects-list').innerHTML = html || '<div style="text-align:center; color:var(--text-secondary); padding:40px;">Проекты не найдены</div>';
}

function createProject() {
    const name = document.getElementById('project-name').value.trim();
    if (!name) {
        alert('Введите название проекта');
        return;
    }

    const projects = getProjects();
    const newProject = {
        id: Math.max(...projects.map(p => p.id), 0) + 1,
        name: name,
        description: document.getElementById('project-desc').value,
        version: document.getElementById('project-version').value,
        createdAt: new Date().toISOString().split('T')[0],
        models: [],
        profiles: []
    };

    projects.push(newProject);
    saveProjects(projects);
    closeModal('new-project-modal');

    // Clear form
    document.getElementById('project-name').value = '';
    document.getElementById('project-desc').value = '';
    document.getElementById('project-version').value = '1.0';

    renderProjects();
    renderProjectsTree();
    alert('Проект успешно создан!');
}

function editProject(projectId) {
    currentEditProjectId = projectId;
    const project = getProject(projectId);

    document.getElementById('edit-project-name').value = project.name;
    document.getElementById('edit-project-desc').value = project.description || '';
    document.getElementById('edit-project-version').value = project.version;

    openModal('edit-project-modal');
}

function saveProjectEdit() {
    if (!currentEditProjectId) return;

    const projects = getProjects();
    const project = projects.find(p => p.id === currentEditProjectId);

    project.name = document.getElementById('edit-project-name').value;
    project.description = document.getElementById('edit-project-desc').value;
    project.version = document.getElementById('edit-project-version').value;

    saveProjects(projects);
    closeModal('edit-project-modal');
    renderProjects();
    renderProjectsTree();
    alert('Проект успешно обновлён!');
}

function openProject(projectId) {
    setCurrentProject(projectId);
    window.location.href = 'project-details.html';
}

function openCurrentProject() {
    if (selectedProjectId) {
        setCurrentProject(selectedProjectId);
        window.location.href = 'project-details.html';
    }
}

// Sidebar toggle functionality
// Функции переведены в sidebar.js

function selectProject(projectId) {
    // Если мы на странице projects.html, показать детали проекта
    if (window.location.pathname.includes('projects.html')) {
        viewProjectDetails(projectId);
        return;
    }
    
    // Сохранить выбранный проект
    setCurrentProject(projectId);
    
    // Обновить отображение
    updateCurrentProject();
    renderProjects();
    renderProjectsTree();
}
