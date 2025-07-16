// 引入Firebase相关SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDiz-O33R3gAm4SfWyh8lSKMX-_4HdPrvg",
    authDomain: "excel-6ffce.firebaseapp.com",
    projectId: "excel-6ffce",
    storageBucket: "excel-6ffce.firebasestorage.app",
    messagingSenderId: "380737839136",
    appId: "1:380737839136:web:1f1ab3e046b761106c5c45",
    measurementId: "G-WXCMT6NDXZ"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUid = null;
let favsCache = [];
window.isCustomizing = false;
window.orderChanged = false; // 添加排序变化标记

// 选中状态集合
let selectedSiteUrls = new Set();

// ========== 收藏编辑功能 ========== //
let editingFavIndex = null;

// 自定义提示函数 - 替换浏览器原生alert
function showCustomAlert(message, type = 'info') {
    // 移除已存在的提示
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert custom-alert-${type}`;
    alertDiv.innerHTML = `
        <div class="custom-alert-content">
            <div class="custom-alert-message">${message}</div>
            <button class="custom-alert-close" onclick="this.parentElement.parentElement.remove()">确定</button>
        </div>
    `;

    // 添加样式
    alertDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        animation: fadeIn 0.3s ease;
    `;

    const content = alertDiv.querySelector('.custom-alert-content');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    `;

    const messageEl = alertDiv.querySelector('.custom-alert-message');
    messageEl.style.cssText = `
        font-size: 16px;
        color: #333;
        margin-bottom: 20px;
        line-height: 1.5;
    `;

    const closeBtn = alertDiv.querySelector('.custom-alert-close');
    closeBtn.style.cssText = `
        background: #3385ff;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 24px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.3s ease;
    `;

    closeBtn.onmouseover = () => closeBtn.style.background = '#2968cc';
    closeBtn.onmouseout = () => closeBtn.style.background = '#3385ff';

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(alertDiv);

    // 点击背景关闭
    alertDiv.addEventListener('click', (e) => {
        if (e.target === alertDiv) {
            alertDiv.remove();
        }
    });

    // 回车键关闭
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            alertDiv.remove();
            document.removeEventListener('keydown', handleKeyPress);
        }
    };
    document.addEventListener('keydown', handleKeyPress);

    // 自动聚焦到按钮
    setTimeout(() => closeBtn.focus(), 100);
}

// 判断是否已收藏
function isSiteCollected(site) {
    return favsCache.some(fav => fav.url === site.url);
}

// 分组数据处理（按大类/小类分组，示例简单分组，实际可根据excel结构调整）
function groupSites(sites) {
    // 假设每个site有group字段，否则可按首字母或其他方式分组
    const groups = {};
    sites.forEach(site => {
        const group = site.group || '未分组';
        if (!groups[group]) groups[group] = [];
        groups[group].push(site);
    });
    return Object.entries(groups).map(([group, children]) => ({ group, children }));
}

// 渲染分组和卡片
function renderSiteModalGroupList(sitesData) {
    const groupList = document.getElementById('site-modal-group-list');
    groupList.innerHTML = '';

    const { sites, groupedSites } = sitesData;

    // 如果没有分组数据，使用平铺显示
    if (Object.keys(groupedSites).length === 0) {
        const cardList = document.createElement('div');
        cardList.className = 'site-modal-card-list';
        sites.forEach(site => {
            const card = createSiteCard(site);
            cardList.appendChild(card);
        });
        groupList.appendChild(cardList);
        return;
    }

    // 按分组显示
    Object.entries(groupedSites).forEach(([groupName, groupSites]) => {
        // 创建分组标题
        const groupTitle = document.createElement('div');
        groupTitle.className = 'site-modal-group-title';
        groupTitle.textContent = groupName;
        groupList.appendChild(groupTitle);

        // 创建分组卡片容器
        const cardList = document.createElement('div');
        cardList.className = 'site-modal-card-list';

        groupSites.forEach(site => {
            const card = createSiteCard(site);
            cardList.appendChild(card);
        });

        groupList.appendChild(cardList);
    });
}

// 创建单个站点卡片 - 增强版
function createSiteCard(site) {
    const isCollected = isSiteCollected(site);
    const isSelected = selectedSiteUrls.has(site.url);
    const card = document.createElement('div');
    card.className = 'site-modal-card';
    if (isCollected) card.classList.add('collected');
    if (isSelected) card.classList.add('selected');

    card.innerHTML = `
        <div class="site-modal-card-content" data-url="${site.url}">
     <div class="site-modal-card-checkbox">
                ${!isCollected ? `<input type="checkbox" ${isSelected ? 'checked' : ''} class="site-checkbox">` : ''}
            </div>
            <img src="${site.icon || ''}" class="site-modal-card-icon" onerror="this.src='https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';this.onerror=null;">
            <div class="site-modal-card-info">
                <div class="site-modal-card-title">${site.title}</div>
                <div class="site-modal-card-desc">${site.desc || ''}</div>
            </div>
            <div class="site-modal-card-status">
                ${isCollected ? '<span class="site-modal-card-badge">已收藏</span>' : ''}
            </div>
        </div>
    `;

    // 添加点击事件
    if (!isCollected) {
        const checkbox = card.querySelector('.site-checkbox');

        // 复选框点击事件
        if (checkbox) {
            checkbox.onclick = (e) => {
                e.stopPropagation();
                if (selectedSiteUrls.has(site.url)) {
                    selectedSiteUrls.delete(site.url);
                } else {
                    selectedSiteUrls.add(site.url);
                }
                updateCardSelection(card, site.url);
            };
        }

        // 卡片点击事件
        card.onclick = () => {
            if (selectedSiteUrls.has(site.url)) {
                selectedSiteUrls.delete(site.url);
            } else {
                selectedSiteUrls.add(site.url);
            }
            updateCardSelection(card, site.url);
        };
    }

    return card;
}

// 更新卡片选择状态
function updateCardSelection(card, siteUrl) {
    const isSelected = selectedSiteUrls.has(siteUrl);
    const checkbox = card.querySelector('.site-checkbox');

    if (isSelected) {
        card.classList.add('selected');
        if (checkbox) checkbox.checked = true;
    } else {
        card.classList.remove('selected');
        if (checkbox) checkbox.checked = false;
    }

    // 更新选中数量显示
    updateSelectedCount();
    // 更新全选按钮状态
    updateSelectAllButton();
}

// 更新选中数量显示
function updateSelectedCount() {
    const selectedCount = selectedSiteUrls.size;
    const addButton = document.querySelector('#select-site-modal .btn-primary');
    if (addButton) {
        addButton.textContent = `添加到收藏 (${selectedCount})`;
    }
}

// 全选/取消全选功能
window.toggleSelectAll = function () {
    const checkboxes = document.querySelectorAll('#site-list input[type=checkbox]:not(:disabled)');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    if (checked.length === checkboxes.length && checkboxes.length > 0) {
        // 取消全选
        checkboxes.forEach(cb => cb.checked = false);
    } else {
        // 全选
        checkboxes.forEach(cb => cb.checked = true);
    }
    updateAddBtnCount();
};

function updateAddBtnCount() {
    const checked = document.querySelectorAll('#site-list input[type=checkbox]:checked');
    const btn = document.querySelector('#select-site-modal .btn-primary');
    if (btn) btn.textContent = `添加到收藏 (${checked.length})`;
}

// 搜索监听
function setupSiteModalSearch() {
    const input = document.getElementById('site-modal-search-input');
    if (input) {
        input.oninput = function () {
            const keyword = this.value.trim();
            if (keyword.length === 0) {
                // 如果搜索框为空，显示所有站点
                renderSiteList();
            } else {
                // 使用网站原有的搜索功能
                performSiteModalSearch(keyword);
            }
            updateAddBtnCount();
        };
    }
}

// 使用网站原有搜索功能进行站点弹窗搜索
function performSiteModalSearch(keyword) {
    const siteList = document.getElementById('site-list');
    siteList.innerHTML = '';

    // 使用网站原有的搜索功能
    let matchedItems = [];

    // 检查是否有网站原有的搜索功能
    if (typeof window.performSearch === 'function') {
        // 使用原有的搜索功能
        matchedItems = window.performSearch(keyword);

        // 分离站内搜索结果和RSS搜索结果
        const regularResults = matchedItems.filter(item => !item.isRss);
        const rssResults = matchedItems.filter(item => item.isRss);

        // 渲染站内搜索结果
        if (regularResults.length > 0) {
            renderSiteSearchResults(regularResults, keyword, '站内搜索结果');
        }

        // 渲染RSS搜索结果
        if (rssResults.length > 0) {
            renderRssSearchResults(rssResults, keyword);
        }

        // 如果都没有结果，显示无结果提示
        if (regularResults.length === 0 && rssResults.length === 0) {
            renderNoSearchResults(keyword);
        }
    } else {
        // 如果没有原有搜索功能，使用原有的简单搜索
        renderSiteList(keyword);
    }
}

// 渲染站内搜索结果
function renderSiteSearchResults(matchedItems, keyword, title) {
    const siteList = document.getElementById('site-list');

    // 创建站内搜索结果标题
    const resultTitle = document.createElement('div');
    resultTitle.className = 'site-modal-group-title';
    resultTitle.innerHTML = `🔍 ${title} (${matchedItems.length}个站点)`;
    siteList.appendChild(resultTitle);

    // 创建搜索结果容器
    const cardList = document.createElement('div');
    cardList.className = 'site-modal-card-list';

    // 渲染每个搜索结果
    matchedItems.forEach(item => {
        const card = createSiteSearchResultCard(item, keyword);
        cardList.appendChild(card);
    });

    siteList.appendChild(cardList);
}

// 渲染RSS搜索结果
function renderRssSearchResults(rssResults, keyword) {
    const siteList = document.getElementById('site-list');

    // 创建RSS搜索结果标题
    const rssTitle = document.createElement('div');
    rssTitle.className = 'site-modal-group-title rss-results-title';
    rssTitle.innerHTML = `📰 RSS文章搜索结果 (${rssResults.length}条)`;
    siteList.appendChild(rssTitle);

    // 创建RSS结果容器
    const rssCardList = document.createElement('div');
    rssCardList.className = 'site-modal-card-list rss-results-container';

    // 渲染每个RSS结果
    rssResults.forEach(item => {
        const card = createRssSearchResultCard(item, keyword);
        rssCardList.appendChild(card);
    });

    siteList.appendChild(rssCardList);
}

// 渲染无搜索结果
function renderNoSearchResults(keyword) {
    const siteList = document.getElementById('site-list');
    const noResultDiv = document.createElement('div');
    noResultDiv.style.cssText = 'text-align: center; padding: 40px; color: #666; font-size: 14px;';
    noResultDiv.innerHTML = `
        <div style="margin-bottom: 10px;">🔍</div>
        <div>未找到包含"${keyword}"的站点或文章</div>
        <div style="font-size: 12px; margin-top: 5px;">可以尝试其他关键词或拼音搜索</div>
    `;
    siteList.appendChild(noResultDiv);
}

// 创建站内搜索结果卡片
function createSiteSearchResultCard(item, keyword) {
    const titleElem = item.element.querySelector('.logo span');
    const descElem = item.element.querySelector('.desc');
    const imgElem = item.element.querySelector('img');
    const linkElem = item.element.closest('a');

    const site = {
        title: titleElem ? titleElem.textContent.trim() : '',
        url: linkElem ? linkElem.href : '',
        icon: imgElem ? imgElem.src : '',
        desc: descElem ? descElem.textContent.trim() : '',
        group: getSiteGroup(item.element),
        matchType: item.matchType || '',
        matchWeight: item.matchWeight || 0
    };

    const isCollected = isSiteCollected(site);
    const isSelected = selectedSiteUrls.has(site.url);
    const card = document.createElement('div');
    card.className = 'site-modal-card';
    if (isCollected) card.classList.add('collected');
    if (isSelected) card.classList.add('selected');

    // 高亮搜索关键词
    const highlightedTitle = highlightKeyword(site.title, keyword);
    const highlightedDesc = site.desc ? highlightKeyword(site.desc, keyword) : '';

    card.innerHTML = `
        <div class="site-modal-card-content" data-url="${site.url}" data-type="site">
            <div class="site-modal-card-checkbox">
                ${!isCollected ? `<input type="checkbox" ${isSelected ? 'checked' : ''} class="site-checkbox">` : ''}
            </div>
            <img src="${site.icon || ''}" class="site-modal-card-icon" onerror="this.src='https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';this.onerror=null;">
            <div class="site-modal-card-info">
                <div class="site-modal-card-title">${highlightedTitle}</div>
                <div class="site-modal-card-desc">${highlightedDesc}</div>
                ${site.matchType ? `<div class="site-modal-card-match-type">[${getMatchTypeText(site.matchType)}]</div>` : ''}
            </div>
            <div class="site-modal-card-status">
                ${isCollected ? '<span class="site-modal-card-badge">已收藏</span>' : ''}
            </div>
        </div>
    `;

    // 添加点击事件
    if (!isCollected) {
        const checkbox = card.querySelector('.site-checkbox');
        if (checkbox) {
            checkbox.onclick = (e) => {
                e.stopPropagation();
                toggleSiteSelection(site.url, card);
            };
        }
        card.onclick = () => toggleSiteSelection(site.url, card);
    }

    return card;
}

// 创建RSS搜索结果卡片
function createRssSearchResultCard(item, keyword) {
    const isSelected = selectedSiteUrls.has(item.link);
    const card = document.createElement('div');
    card.className = 'site-modal-card rss-item';
    if (isSelected) card.classList.add('selected');

    // 高亮搜索关键词
    const highlightedTitle = highlightKeyword(item.title, keyword);
    const highlightedSummary = item.summary ? highlightKeyword(item.summary, keyword) : '';

    // 格式化日期
    let pubDate = '';
    try {
        pubDate = new Date(item.published).toLocaleDateString();
    } catch (e) {
        pubDate = item.published;
    }

    card.innerHTML = `
        <div class="site-modal-card-content" data-url="${item.link}" data-type="rss">
            <div class="site-modal-card-checkbox">
                <input type="checkbox" ${isSelected ? 'checked' : ''} class="site-checkbox">
            </div>
            <div class="site-modal-card-icon rss-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3273dc">
                    <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"/>
                </svg>
            </div>
            <div class="site-modal-card-info">
                <div class="site-modal-card-title">${highlightedTitle}</div>
                <div class="site-modal-card-desc">${highlightedSummary}</div>
                <div class="site-modal-card-meta">
                    <span class="site-modal-card-date">${pubDate}</span>
                    <span class="site-modal-card-source">· ${item.sourceHost || '未知来源'}</span>
                    ${item.matchType ? `<span class="site-modal-card-match-type">[${getRssMatchTypeText(item.matchType)}]</span>` : ''}
                </div>
            </div>
            <div class="site-modal-card-status">
                <span class="site-modal-card-badge rss-badge">RSS</span>
            </div>
        </div>
    `;

    // 添加点击事件
    const checkbox = card.querySelector('.site-checkbox');
    if (checkbox) {
        checkbox.onclick = (e) => {
            e.stopPropagation();
            toggleRssSelection(item, card);
        };
    }
    card.onclick = () => toggleRssSelection(item, card);

    return card;
}

// 切换站点选择状态
function toggleSiteSelection(siteUrl, card) {
    if (selectedSiteUrls.has(siteUrl)) {
        selectedSiteUrls.delete(siteUrl);
    } else {
        selectedSiteUrls.add(siteUrl);
    }
    updateCardSelection(card, siteUrl);
}

// 切换RSS选择状态
function toggleRssSelection(item, card) {
    if (selectedSiteUrls.has(item.link)) {
        selectedSiteUrls.delete(item.link);
    } else {
        selectedSiteUrls.add(item.link);
    }
    updateCardSelection(card, item.link);
}

// 获取RSS匹配类型文本
function getRssMatchTypeText(matchType) {
    const matchTypeMap = {
        'rss_exact_title': '精准匹配',
        'rss_title': '标题匹配',
        'rss_pinyin': '拼音匹配',
        'rss_pinyin_first': '首字母匹配',
        'rss_pinyin_first_compact': '首字母匹配',
        'rss_content': '内容匹配',
        'rss_category': '分类匹配'
    };

    return matchTypeMap[matchType] || '匹配';
}

// 获取站点分组信息
function getSiteGroup(element) {
    let parent = element.closest('.box');
    if (parent) {
        let h2 = parent.querySelector('h2');
        if (h2) {
            return h2.textContent.trim();
        }
    }
    return '未分组';
}

// 高亮搜索关键词
function highlightKeyword(text, keyword) {
    if (!keyword) return text;

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</mark>');
}

// 获取匹配类型文本
function getMatchTypeText(matchType) {
    const matchTypeMap = {
        'exact_title': '精准匹配',
        'title': '标题匹配',
        'pinyin_none': '拼音匹配',
        'pinyin': '拼音匹配',
        'pinyin_first': '首字母匹配',
        'pinyin_first_compact': '首字母匹配',
        'pinyin_input': '拼音输入匹配',
        'pinyin_input_first': '拼音首字母匹配',
        'pinyin_input_start': '拼音前缀匹配',
        'pinyin_input_char': '单字拼音匹配',
        'single_pinyin': '词组拼音',
        'desc': '描述匹配'
    };

    return matchTypeMap[matchType] || '匹配';
}

// 打开选择站点弹窗
window.openSelectSiteModal = function () {
    // 确保在打开弹窗时重新收集站点数据
    collectAllSitesFromExcel();

    // 添加调试信息
    console.log('打开选择站点弹窗，当前allSites数量:', window.allSites ? window.allSites.length : 0);

    // 显示弹窗
    document.getElementById('select-site-modal').style.display = 'flex';

    // 初始化搜索功能
    setupSiteModalSearch();

    // 渲染站点列表
    renderSiteList();

    // 更新按钮计数
    updateAddBtnCount();
};

// 渲染分组Tab+内容，支持拼音搜索
window.renderSiteList = function (keyword = '') {
    const siteList = document.getElementById('site-list');
    siteList.innerHTML = '';
    // 构建分组
    const groupMap = {};
    (window.allSites || []).forEach(site => {
        // 搜索过滤，支持拼音
        if (keyword) {
            const kw = keyword.toLowerCase();
            const titlePinyin = window.pinyinPro ? pinyinPro.pinyin(site.title, { toneType: 'none' }).toLowerCase() : '';
            const titleFirst = window.pinyinPro ? pinyinPro.pinyin(site.title, { pattern: 'first', toneType: 'none' }).toLowerCase() : '';
            if (
                !site.title.toLowerCase().includes(kw) &&
                !site.url.toLowerCase().includes(kw) &&
                !site.desc.toLowerCase().includes(kw) &&
                !(titlePinyin && titlePinyin.includes(kw)) &&
                !(titleFirst && titleFirst.replace(/\s/g, '').includes(kw))
            ) return;
        }
        const main = site.group ? site.group.split('>')[0].trim() : '未分组';
        const sub = site.group && site.group.includes('>') ? site.group.split('>')[1].trim() : '';
        if (!groupMap[main]) groupMap[main] = {};
        if (!groupMap[main][sub]) groupMap[main][sub] = [];
        groupMap[main][sub].push(site);
    });
    const mains = Object.keys(groupMap);
    // 一级Tab
    const tabBarMain = document.createElement('div');
    tabBarMain.className = 'tab-bar tab-bar-main';
    tabBarMain.style = 'display:flex;gap:8px;overflow-x:auto;margin-bottom:8px;padding-bottom:4px;';
    mains.forEach((main, i) => {
        const tab = document.createElement('button');
        tab.innerText = main;
        tab.className = 'tab-btn' + (i === 0 ? ' active' : '');
        tab.onclick = function () {
            document.querySelectorAll('#site-list .tab-bar-main .tab-btn').forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('#site-list .tab-bar-sub').forEach(c => c.style.display = 'none');
            document.getElementById('tab-bar-sub-' + i).style.display = 'flex';
            // 默认激活第一个二级tab
            const firstSub = document.getElementById('tab-bar-sub-' + i).querySelector('.tab-btn');
            if (firstSub) firstSub.click();
        };
        tabBarMain.appendChild(tab);
    });
    siteList.appendChild(tabBarMain);
    // 二级Tab和内容
    mains.forEach((main, i) => {
        const subs = Object.keys(groupMap[main]);
        const tabBarSub = document.createElement('div');
        tabBarSub.className = 'tab-bar tab-bar-sub';
        tabBarSub.id = 'tab-bar-sub-' + i;
        tabBarSub.style = 'display:' + (i === 0 ? 'flex' : 'none') + ';gap:8px;overflow-x:auto;margin-bottom:12px;';
        subs.forEach((sub, j) => {
            const tab = document.createElement('button');
            tab.innerText = sub || main;
            tab.className = 'tab-btn' + (j === 0 ? ' active' : '');
            tab.onclick = function () {
                document.querySelectorAll('#tab-bar-sub-' + i + ' .tab-btn').forEach(btn => btn.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('#site-list .site-list-content').forEach(c => c.style.display = 'none');
                document.getElementById('site-list-content-' + i + '-' + j).style.display = 'flex';
            };
            tabBarSub.appendChild(tab);
        });
        siteList.appendChild(tabBarSub);
        // 内容区
        subs.forEach((sub, j) => {
            const content = document.createElement('div');
            content.className = 'site-list site-list-content';
            content.id = 'site-list-content-' + i + '-' + j;
            content.style = 'flex-wrap:wrap;gap:16px;' + (j === 0 && i === 0 ? 'display:flex;' : 'display:none;');
            groupMap[main][sub].forEach((site, idx) => {
                const card = document.createElement('div');
                card.className = 'site-card';
                // 判断是否已收藏
                const isCollected = favsCache.some(f => f.url === site.url);
                card.innerHTML = `<input type="checkbox" value="${window.allSites.indexOf(site)}" style="margin-right:8px;" ${isCollected ? 'disabled' : ''} onchange="updateAddBtnCount()">
                  <span>${site.title}</span>
                  <small>${site.url}</small>`;
                if (isCollected) card.style.opacity = 0.5;
                content.appendChild(card);
            });
            siteList.appendChild(content);
        });
    });
};

// 登录状态切换时，控制按钮和弹窗显示
function updateLoginUI(loggedIn) {
    document.getElementById('top-login-btn').style.display = loggedIn ? 'none' : 'block';
    if (loggedIn) closeLoginModal();
}

// 监听登录状态变化
onAuthStateChanged(auth, async (user) => {
    if (user) {
        updateLoginUI(true);
        document.getElementById('my-fav-box').style.display = 'block';
        currentUid = user.uid;
        await loadFavsFromCloud();
    } else {
        updateLoginUI(false);
        document.getElementById('my-fav-box').style.display = 'none';
        currentUid = null;
        favsCache = [];
        renderFavs();
    }
});

// 加载云端收藏
async function loadFavsFromCloud() {
    if (!currentUid) return;
    const userDoc = doc(db, 'userFavs', currentUid);
    try {
        const snap = await getDoc(userDoc);
        favsCache = (snap.exists() && snap.data().favs) ? snap.data().favs : [];
        renderFavs();
    } catch (e) {
        favsCache = [];
        renderFavs();
    }
}

// 保存到云端
async function saveFavToCloud(fav) {
    if (!currentUid) return;
    favsCache.push(fav);
    const userDoc = doc(db, 'userFavs', currentUid);
    await setDoc(userDoc, {
        favs: favsCache,
        updatedAt: new Date().toISOString()
    }, { merge: true });
    renderFavs();
}

// 删除云端收藏
async function removeFavFromCloud(idx) {
    if (!currentUid) return;
    favsCache.splice(idx, 1);
    const userDoc = doc(db, 'userFavs', currentUid);
    await setDoc(userDoc, {
        favs: favsCache,
        updatedAt: new Date().toISOString()
    }, { merge: true });
    renderFavs();
}

// 更新云端收藏顺序
async function updateFavsOrder() {
    if (!currentUid) return;
    const userDoc = doc(db, 'userFavs', currentUid);
    await setDoc(userDoc, {
        favs: favsCache,
        updatedAt: new Date().toISOString()
    }, { merge: true });
}

// 显示登录弹窗
window.showLoginModal = function () {
    document.getElementById('login-modal').style.display = 'flex';
};

// 关闭登录弹窗
window.closeLoginModal = function () {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
};

// 登录事件
window.login = function () {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            showCustomAlert('登录失败：' + error.message, 'error');
        });
};

// 登出事件
window.logout = function () {
    signOut(auth);
};

// 切换编辑模式
window.toggleCustomMode = function () {
    window.isCustomizing = !window.isCustomizing;
    // 进入编辑模式时重置排序变化标记
    if (window.isCustomizing) {
        window.orderChanged = false;
    }
    renderFavs();
    var btn = document.getElementById('fav-custom-btn');
    if (btn) btn.innerHTML = window.isCustomizing ? '<span style="font-size:15px;">💾 保存</span>' : '<span style="font-size:15px;">⚙️编辑</span>';
    if (!window.isCustomizing) {
        updateFavsOrder();
        // 只有在排序发生变化时才显示提示
        if (window.orderChanged) {
            showDragSuccessMessage();
            window.orderChanged = false; // 重置标记
        }
    }
};

// 显示编辑模式提示
function showEditModeTip() {
    // 检查是否已经显示过提示
    if (localStorage.getItem('fav-drag-tip-shown')) return;

    const tip = document.createElement('div');
    tip.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 14px;
            z-index: 10001;
            max-width: 300px;
            text-align: center;
            line-height: 1.5;
        ">
            <div style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">📝 编辑模式提示</div>
            <div style="margin-bottom: 15px;">
                • 点击 <span style="color: #ff6b6b;">×</span> 删除收藏<br>
                • 拖拽 <span style="color: #3385ff;">⋮⋮</span> 调整顺序<br>
                • 点击 💾 保存 退出编辑
            </div>
            <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('fav-drag-tip-shown', 'true');" 
                    style="
                        background: #3385ff;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 13px;
                    ">
                知道了
            </button>
        </div>
    `;

    document.body.appendChild(tip);

    // 5秒后自动移除提示
    setTimeout(() => {
        if (tip.parentNode) {
            tip.remove();
            localStorage.setItem('fav-drag-tip-shown', 'true');
        }
    }, 5000);
}

// 渲染收藏
window.renderFavs = function () {
    const list = document.getElementById('fav-list');
    list.innerHTML = '';

    // 添加链接卡片
    const addCard = document.createElement('div');
    addCard.id = 'fav-add-card';
    addCard.className = 'fav-card';
    addCard.innerHTML = '<svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill: #3385ff;width: 22px;margin-right: 10px;"><path d="M577.088 0H448.96v448.512H0v128h448.96V1024h128.128V576.512H1024v-128H577.088z"></path></svg><div style="color:#3385ff;">添加链接</div>';
    addCard.onclick = openFavForm;
    list.appendChild(addCard);

    // 渲染收藏卡片
    favsCache.forEach((fav, idx) => {
        const card = document.createElement('div');
        card.className = 'fav-card';
        card.setAttribute('data-index', idx);

        // 在编辑模式下添加editing类
        if (window.isCustomizing) {
            card.classList.add('editing');
        }

        const iconUrl = fav.icon || `https://ico.cxr.cool/${new URL(fav.url).hostname}.ico`;
        card.innerHTML = `
    <a href="${fav.url}" target="_blank" class="fav-link">
        <img src="${iconUrl}" class="fav-icon" onerror="this.src='https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';this.onerror=null;">
            <div class="fav-context"><div class="fav-title">${fav.title}</div>
                <div class="fav-desc">${fav.desc || ''}</div></div>
    </a>
    ${window.isCustomizing ? `<span onclick="removeFav(${idx})" class="fav-remove">×</span>` : ''}
    ${window.isCustomizing ? `<div class="fav-drag-handle">⋮⋮</div>` : ''} 
    `;
        list.appendChild(card);

        // 修复：编辑模式下点击卡片弹出编辑弹窗
        if (window.isCustomizing) {
            card.addEventListener('click', function (e) {
                // 避免点击删除按钮、拖拽手柄、a标签时触发编辑
                if (
                    e.target.classList.contains('fav-remove') ||
                    e.target.classList.contains('fav-drag-handle') ||
                    e.target.closest('a')
                ) {
                    return;
                }
                window.openEditFavForm(idx);
            });
        }
    });

    // 编辑模式下初始化SortableJS
    if (window.isCustomizing) {
        if (window._sortableInstance) {
            window._sortableInstance.destroy();
        }
        window._sortableInstance = new Sortable(list, {
            animation: 150,
            handle: '.fav-drag-handle',
            draggable: '.fav-card[data-index]',
            filter: '#fav-add-card',
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                // 排除addCard
                const realOld = evt.oldIndex - 1;
                const realNew = evt.newIndex - 1;
                if (realOld < 0 || realNew < 0) return;
                const moved = favsCache.splice(realOld, 1)[0];
                favsCache.splice(realNew, 0, moved);
                // 标记排序已发生变化
                window.orderChanged = true;
                renderFavs();
            }
        });
    } else {
        if (window._sortableInstance) {
            window._sortableInstance.destroy();
            window._sortableInstance = null;
        }
    }
};

// 删除收藏
window.removeFav = function (idx) {
    removeFavFromCloud(idx);
};

// "+"加号卡片弹窗
function openFavForm() {
    document.getElementById('fav-form-modal').style.display = 'flex';
    resetFavFormTitle(); // 仅在新增时重置标题
}

window.closeFavForm = function () {
    editingFavIndex = null;
    document.getElementById('fav-form-modal').style.display = 'none';
};

// 使用新API获取网站信息
window.autoGetIcon = async function () {
    const urlInput = document.getElementById('fav-form-url');
    const url = urlInput.value.trim();

    if (!url) {
        showCustomAlert('请先填写网址', 'warning');
        return;
    }

    // 确保URL包含协议头
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
        urlInput.value = fullUrl;
    }

    try {
        // 显示加载状态
        document.getElementById('fav-form-title').value = '加载中...';
        document.getElementById('fav-form-icon').value = '';
        document.getElementById('fav-form-desc').value = '';

        // 调用新API
        const response = await fetch('https://v.api.aa1.cn/api/api-web-head-json/index.php?url=' + encodeURIComponent(fullUrl));
        const data = await response.json();

        if (data && data.code === 200) {
            // 填充表单
            document.getElementById('fav-form-title').value = data.title || '';
            document.getElementById('fav-form-icon').value = 'https://ico.cxr.cool/' + (data.url.replace(/^https?:\/\//, '').split('/')[0]) + '.ico';
            document.getElementById('fav-form-desc').value = data.description || '';
        } else {
            // 如果API失败，尝试使用备用方案
            document.getElementById('fav-form-title').value = '';
            document.getElementById('fav-form-icon').value = 'https://ico.cxr.cool/' + (fullUrl.replace(/^https?:\/\//, '').split('/')[0]) + '.ico';
            document.getElementById('fav-form-desc').value = '';
        }
    } catch (error) {
        console.error('获取网站信息失败:', error);
        // 备用方案
        document.getElementById('fav-form-title').value = '';
        document.getElementById('fav-form-icon').value = 'https://ico.cxr.cool/' + (fullUrl.replace(/^https?:\/\//, '').split('/')[0]) + '.ico';
        document.getElementById('fav-form-desc').value = '';
    }
};

// 提交收藏表单
const origSubmitFavForm = window.submitFavForm;
window.submitFavForm = function () {
    const url = document.getElementById('fav-form-url').value.trim();
    const title = document.getElementById('fav-form-title').value.trim();
    const icon = document.getElementById('fav-form-icon').value.trim();
    const desc = document.getElementById('fav-form-desc').value.trim();
    if (!url || !title) {
        showCustomAlert('请填写必填项：URL和网站名称', 'warning');
        return;
    }
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
    }
    const fav = {
        url: fullUrl,
        title: title,
        icon: icon || null,
        desc: desc || null,
        createdAt: new Date().toISOString()
    };
    if (editingFavIndex !== null) {
        // 编辑模式，更新原有收藏
        updateFavInCache(editingFavIndex, fav);
        editingFavIndex = null;
        closeFavForm();
        resetFavFormTitle();
        showCustomAlert('收藏已更新', 'success');
    } else {
        // 新增模式，直接上传到云端，由云端同步刷新本地缓存和UI
        window.closeFavForm();
        saveFavToCloud(fav); // 新增时直接上传到云端
    }
};

// 打开编辑弹窗并填充数据
window.openEditFavForm = function (idx) {
    editingFavIndex = idx;
    const fav = favsCache[idx];
    document.getElementById('fav-form-modal').style.display = 'flex';
    document.getElementById('fav-form-title').value = fav.title || '';
    document.getElementById('fav-form-url').value = fav.url || '';
    document.getElementById('fav-form-icon').value = fav.icon || '';
    document.getElementById('fav-form-desc').value = fav.desc || '';
    // 修改弹窗标题
    const titleEl = document.querySelector('.fav-form-title');
    if (titleEl) titleEl.textContent = '编辑收藏';
};

// 恢复弹窗标题
function resetFavFormTitle() {
    const titleEl = document.querySelector('.fav-form-title');
    if (titleEl) titleEl.textContent = '添加链接';
}

// 修改收藏并保存
function updateFavInCache(idx, fav) {
    favsCache[idx] = { ...favsCache[idx], ...fav };
    updateFavsOrder();
    renderFavs();
}

// 批量添加本站数据
window.batchAddFromExcel = function () {
    const sitesData = collectAllSitesFromExcel();
    if (sitesData.sites.length === 0) {
        showCustomAlert('未找到可添加的网站数据', 'warning');
        return;
    }

    // 显示选择弹窗
    showSelectSiteModal(sitesData);
};

// Excel加载后自动生成window.allSites
window.allSites = [];
function collectAllSitesFromExcel() {
    try {
        const mainContent = document.getElementById('excel');
        if (!mainContent) {
            console.log('Excel容器未找到，等待加载...');
            return;
        }

        const cards = mainContent.querySelectorAll('.box-card');
        console.log('找到卡片数量:', cards.length);

        let sites = [];
        cards.forEach((card, cardIndex) => {
            const items = card.querySelectorAll('a');
            console.log(`卡片${cardIndex + 1}中的链接数量:`, items.length);

            items.forEach((a, itemIndex) => {
                const title = a.querySelector('.logo span') ? a.querySelector('.logo span').textContent.trim() : '';
                const url = a.href;
                const icon = a.querySelector('img') ? a.querySelector('img').src : '';
                const desc = a.querySelector('.desc') ? a.querySelector('.desc').textContent.trim() : '';

                // 分组可用父级h2或box标题
                let group = '';
                let parent = a.closest('.box');
                if (parent) {
                    let h2 = parent.querySelector('h2');
                    if (h2) group = h2.textContent.trim();
                }

                if (title && url) {
                    sites.push({ title, url, icon, group, desc });
                }
            });
        });

        window.allSites = sites;
        console.log('成功收集站点数据，总数:', sites.length);

        // 如果站点数量为0，可能是Excel数据还没加载完成
        if (sites.length === 0) {
            console.log('未收集到站点数据，可能Excel还在加载中...');
        }

    } catch (e) {
        window.allSites = [];
        console.error('收集站点数据失败:', e);
    }
}

// 关闭弹窗
window.closeSelectSiteModal = function () {
    document.getElementById('select-site-modal').style.display = 'none';
};

// 添加到收藏
window.addSelectedSitesToFav = async function () {
    // 获取所有选中的复选框
    const checkedBoxes = Array.from(document.querySelectorAll('#site-list input[type=checkbox]:checked'));

    console.log('选中的复选框数量:', checkedBoxes.length);
    console.log('当前allSites数量:', window.allSites ? window.allSites.length : 0);

    if (!checkedBoxes.length) {
        showCustomAlert('请选择要添加的站点', 'warning');
        return;
    }

    let added = 0;
    let skipped = 0;

    for (const checkbox of checkedBoxes) {
        let site;
        const cardContent = checkbox.closest('.site-modal-card-content');

        console.log('处理复选框:', checkbox.value, '是否有cardContent:', !!cardContent);

        if (cardContent) {
            // 这是搜索结果（站内或RSS）
            const dataType = cardContent.dataset.type;
            const dataUrl = cardContent.dataset.url;

            console.log('搜索结果类型:', dataType, 'URL:', dataUrl);

            if (dataType === 'rss') {
                // 这是RSS结果，需要从RSS数据中获取完整信息
                const rssItem = findRssItemByLink(dataUrl);
                if (rssItem) {
                    site = {
                        url: rssItem.link,
                        title: rssItem.title,
                        desc: rssItem.summary || '',
                        icon: null, // RSS项目通常没有图标
                        isRss: true,
                        sourceHost: rssItem.sourceHost,
                        published: rssItem.published
                    };
                }
            } else {
                // 这是站内搜索结果
                const card = cardContent.closest('.site-modal-card');
                const titleElem = card.querySelector('.site-modal-card-title');
                const descElem = card.querySelector('.site-modal-card-desc');
                const iconElem = card.querySelector('.site-modal-card-icon');

                site = {
                    url: dataUrl,
                    title: titleElem ? titleElem.textContent.replace(/<[^>]*>/g, '').trim() : '',
                    desc: descElem ? descElem.textContent.replace(/<[^>]*>/g, '').trim() : '',
                    icon: iconElem && !iconElem.classList.contains('rss-icon') ? iconElem.src : '',
                    isRss: false
                };
            }
        } else {
            // 这是原有列表中的站点（通过value属性获取索引）
            const index = parseInt(checkbox.value);
            console.log('原有站点索引:', index, 'allSites存在:', !!window.allSites);

            if (!isNaN(index) && window.allSites && window.allSites[index]) {
                site = window.allSites[index];
                console.log('找到原有站点:', site.title, site.url);
            } else {
                console.log('未找到原有站点，索引:', index, 'allSites长度:', window.allSites ? window.allSites.length : 0);
            }
        }

        if (!site) {
            console.log('跳过无效站点');
            continue;
        }

        // 检查是否已经收藏
        if (favsCache.some(f => f.url === site.url)) {
            console.log('站点已收藏，跳过:', site.title);
            skipped++;
            continue;
        }

        // 添加到收藏
        console.log('添加站点到收藏:', site.title);
        await saveFavToCloud(site);
        added++;
    }

    // 显示结果
    if (added === 0 && skipped > 0) {
        showCustomAlert('所选项目均已收藏，无需重复添加！', 'info');
    } else if (added > 0) {
        let message = `成功添加${added}个项目到收藏`;
        if (skipped > 0) {
            message += `，${skipped}个项目已存在`;
        }
        showCustomAlert(message, 'success');
    }

    // 清空选择状态
    selectedSiteUrls.clear();

    // 关闭弹窗
    closeSelectSiteModal();
};

// 根据链接查找RSS项目
function findRssItemByLink(link) {
    // 检查是否有全局的RSS数据
    if (window.rssItems && Array.isArray(window.rssItems)) {
        return window.rssItems.find(item => item.link === link);
    }
    return null;
}

// Excel异步加载后自动收集站点
setTimeout(collectAllSitesFromExcel, 1500);

// 绑定批量添加按钮事件
document.addEventListener('DOMContentLoaded', function () {
    const batchBtn = document.getElementById('fav-batch-add-btn');
    if (batchBtn) batchBtn.onclick = window.openSelectSiteModal;
});

document.addEventListener('DOMContentLoaded', function () {
    const customBtn = document.getElementById('fav-custom-btn');
    if (customBtn) {
        customBtn.onclick = window.toggleCustomMode;
    }
});

// 新增：编辑弹窗"确定"按钮逻辑，仅本地保存
window.confirmEditFavForm = function () {
    const url = document.getElementById('fav-form-url').value.trim();
    const title = document.getElementById('fav-form-title').value.trim();
    const icon = document.getElementById('fav-form-icon').value.trim();
    const desc = document.getElementById('fav-form-desc').value.trim();
    if (!url || !title) {
        showCustomAlert('请填写必填项：URL和网站名称', 'warning');
        return;
    }
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
    }
    const fav = {
        url: fullUrl,
        title: title,
        icon: icon || null,
        desc: desc || null,
        createdAt: new Date().toISOString()
    };
    if (editingFavIndex !== null) {
        // 编辑模式，仅本地保存
        favsCache[editingFavIndex] = { ...favsCache[editingFavIndex], ...fav };
        editingFavIndex = null;
        renderFavs();
        window.closeFavForm();
    } else {
        // 新增模式，直接上传到云端，由云端同步刷新本地缓存和UI
        window.closeFavForm();
        saveFavToCloud(fav); // 新增时直接上传到云端
    }
};

// 获取域名工具函数
function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}
// ========== 保证收藏弹窗图标预览与输入框内容始终同步 ========== //
function syncFavIconPreviewByInput() {
    const iconInput = document.getElementById('fav-form-icon');
    const urlInput = document.getElementById('fav-form-url');
    const previewImg = document.getElementById('icon-preview-img-html');
    const defaultIcon = 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
    if (!iconInput || !previewImg || !urlInput) return;
    const iconUrl = iconInput.value.trim();
    const url = urlInput.value.trim();
    if (iconUrl) {
        previewImg.src = iconUrl;
    } else if (url) {
        const domain = getDomainFromUrl(url);
        previewImg.src = domain ? `https://ico.cxr.cool/${domain}.ico` : defaultIcon;
    } else {
        previewImg.src = defaultIcon;
    }
}
// 绑定input/change事件，避免重复绑定
(function bindFavIconInputSync() {
    const iconInput = document.getElementById('fav-form-icon');
    const urlInput = document.getElementById('fav-form-url');
    if (!iconInput || !urlInput) return;
    if (iconInput._previewBinded) return;
    iconInput._previewBinded = true;
    iconInput.addEventListener('input', syncFavIconPreviewByInput);
    iconInput.addEventListener('change', syncFavIconPreviewByInput);
    urlInput.addEventListener('input', syncFavIconPreviewByInput);
    urlInput.addEventListener('change', syncFavIconPreviewByInput);
})();
// 统一清空收藏表单内容
function clearFavFormFields() {
    const ids = ['fav-form-url', 'fav-form-title', 'fav-form-icon', 'fav-form-desc'];
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    const titleEl = document.querySelector('.fav-form-title');
    if (titleEl) titleEl.textContent = '添加链接';
}
// 只在openFavForm里清空一次
window.openFavForm = function () {
    editingFavIndex = null;
    clearFavFormFields();
    document.getElementById('fav-form-modal').style.display = 'flex';
    syncFavIconPreviewByInput();
};
// 打开弹窗时自动同步icon字段
const origOpenFavForm = window.openFavForm;
window.openFavForm = function () {
    if (typeof origOpenFavForm === 'function') origOpenFavForm();
    setTimeout(syncFavIconPreviewByInput, 50);
};
const origOpenEditFavForm = window.openEditFavForm;
window.openEditFavForm = function (idx) {
    if (typeof origOpenEditFavForm === 'function') origOpenEditFavForm(idx);
    setTimeout(syncFavIconPreviewByInput, 50);
};
// 自动获取/上传图片后也刷新预览
const origAutoGetIcon = window.autoGetIcon;
window.autoGetIcon = async function () {
    if (typeof origAutoGetIcon === 'function') await origAutoGetIcon();
    syncFavIconPreviewByInput();
};
// 上传图片按钮逻辑增强
(function enhanceIconUploadBtn() {
    const btn = document.getElementById('icon-upload-btn-html');
    if (!btn) return;
    const iconInput = document.getElementById('fav-form-icon');
    const urlInput = document.getElementById('fav-form-url');
    if (!iconInput || !urlInput) return;
    if (btn._enhanced) return;
    btn._enhanced = true;
    let fileInput = btn._fileInput;
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        btn.parentNode.appendChild(fileInput);
        btn._fileInput = fileInput;
    }
    btn.onclick = () => fileInput.click();
    fileInput.onchange = async function () {
        const file = fileInput.files[0];
        if (!file) return;
        btn.textContent = '点我上传';
        btn.disabled = true;
        try {
            const url = await window.uploadToTelegram(file);
            iconInput.value = url;
            btn.textContent = '点我上传';
            btn.disabled = false;
            syncFavIconPreviewByInput();
            if (window.showCustomAlert) window.showCustomAlert('上传成功，已自动填入图标URL', 'success');
        } catch (e) {
            btn.textContent = '点我上传';
            btn.disabled = false;
            if (window.showCustomAlert) window.showCustomAlert('上传失败：' + e.message, 'error');
        }
        fileInput.value = '';
    };
})();

// ========== 站长推荐模块 ========== //
const adminDocId = "owTNzDqUcePOAp9nISR1lBxS4Ev2"; // 站长推荐UID
const adminCollection = "userFavs"; // 你的收藏集合名

async function loadAdminRecommend() {
    const docRef = doc(db, adminCollection, adminDocId);
    const docSnap = await getDoc(docRef);
    const box = document.getElementById('admin-recommend-box');
    if (!box) return;
    if (docSnap.exists()) {
        const favs = docSnap.data().favs || [];
        renderAdminRecommend(favs);
    } else {
        box.innerHTML = '<div style="color:#888;padding:20px;">暂无站长推荐</div>';
    }
}

function renderAdminRecommend(favs) {
    const box = document.getElementById('admin-recommend-box');
    box.innerHTML = '<div class="my-fav-box-header"><div class="my-fav-box-title"><span class="my-fav-box-title-icon">👑 站长推荐</span></div></div>';
    const list = document.createElement('div');
    list.className = 'my-fav-list';
    favs.forEach(fav => {
        const card = document.createElement('div');
        card.className = 'fav-card';
        const iconUrl = fav.icon || (fav.url ? `https://ico.cxr.cool/${new URL(fav.url).hostname}.ico` : '');
        card.innerHTML = `
            <a href="${fav.url}" target="_blank" class="fav-link">
                <img src="${iconUrl}" class="fav-icon" onerror="this.src='https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';this.onerror=null;">
                <div class="fav-context">
                    <div class="fav-title">${fav.title}</div>
                    <div class="fav-desc">${fav.desc || ''}</div>
                </div>
            </a>
        `;
        list.appendChild(card);
    });
    box.appendChild(list);
}

window.addEventListener('DOMContentLoaded', loadAdminRecommend);// 拦截/增强编辑弹窗打开逻辑，自动同步预览图和输入框
if (window.openEditFavModal) {
    const origOpenEditFavModal = window.openEditFavModal;
    window.openEditFavModal = function (fav) {
        // fav.icon为数据库favs里的icon字段
        window.syncFavIconPreview(fav && fav.icon ? fav.icon : '');
        return origOpenEditFavModal.apply(this, arguments);
    };
}
// 新增弹窗时也自动同步
if (window.openAddFavModal) {
    const origOpenAddFavModal = window.openAddFavModal;
    window.openAddFavModal = function () {
        window.syncFavIconPreview('');
        return origOpenAddFavModal.apply(this, arguments);
    };
}


