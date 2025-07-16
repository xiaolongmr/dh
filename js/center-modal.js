// 统一弹窗模块
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { renderAccountSettingsModal } from './account-settings.js';

const auth = getAuth();
const db = getFirestore();

// 打开统一弹窗
window.openCenterModal = async function (type) {
    const modal = document.getElementById('center-modal');
    const content = modal.querySelector('.modal-content');
    if (type === 'account') {
        renderAccountSettingsModal();
        return;
    }
    modal.style.display = 'flex';
    content.innerHTML = '';
    if (type === 'profile') {
        await renderProfileCenter(content);
    } else if (type === 'notice') {
        renderSystemNotice(content);
    } else if (type === 'logout') {
        renderLogoutConfirm(content);
    }
};
window.closeCenterModal = function () {
    document.getElementById('center-modal').style.display = 'none';
};

// 个人中心内容
async function renderProfileCenter(content) {
    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<div style="padding:48px 32px;text-align:center;">请先登录</div>';
        return;
    }
    let userProfileData = {};
    try {
        const docSnap = await getDoc(doc(db, 'userProfiles', user.uid));
        if (docSnap.exists()) {
            userProfileData = docSnap.data();
        } else {
            userProfileData = {
                nickname: user.displayName || '未设置昵称',
                bio: '这个人很懒，什么都没有留下~',
                avatar: user.photoURL || 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png',
                coverImage: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=900&q=80',
                articles: 0, comments: 0, followers: 0, following: false
            };
        }
    } catch (e) {
        content.innerHTML = '<div style="padding:48px 32px;text-align:center;">加载用户资料失败</div>';
        return;
    }
    content.innerHTML = `
    <div style="position:relative;width:900px;max-width:98vw;max-height:96vh;overflow:auto;background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.10);margin:auto;">
      <button id="close-center-modal-btn" style="position:absolute;right:18px;top:18px;background:rgba(0,0,0,0.12);color: #fffafa;border:none;border-radius:50%;width:36px;height:36px;font-size:22px;cursor:pointer;z-index:2;">×</button>
      <div class="profile-cover" style="height:220px;background:rgb(231, 231, 231) url('${userProfileData.coverImage}') center center/cover no-repeat;position:relative;">
        <div style="position:absolute;left:50%;bottom:-56px;transform:translateX(-50%);">
          <img class="profile-avatar" src="${userProfileData.avatar}" style="width:112px;height:112px;border-radius:50%;border:5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.12);object-fit:cover;">
        </div>
        <button id="change-cover-btn" style="position:absolute;right:24px;bottom:18px;background:rgba(0,0,0,0.45);color:#fff;border:none;border-radius:6px;padding:7px 18px;cursor:pointer;font-size:15px;">修改封面</button>
      </div>
      <div style="padding:70px 32px 0 32px;text-align:center;">
        <div class="profile-nickname" style="font-size:26px;font-weight:700;">${userProfileData.nickname}</div>
        <div class="profile-bio" style="color:#888;font-size:15px;margin:10px 0 18px 0;">${userProfileData.bio}</div>
        <div class="profile-stats" style="display:flex;justify-content:center;gap:32px;font-size:15px;color:#666;margin-bottom:18px;">
          <span><b>${userProfileData.articles || 0}</b> 文章</span>
          <span><b>${userProfileData.comments || 0}</b> 评论</span>
          <span><b>${userProfileData.followers || 0}</b> 粉丝</span>
        </div>
        <div style="display:flex;justify-content:center;gap:18px;margin-bottom:24px;">
          <button class="follow-btn" style="background:#3385ff;color:#fff;border:none;border-radius:6px;padding:7px 32px;font-size:15px;cursor:pointer;">${userProfileData.following ? '取消关注' : '+ 关注'}</button>
          <button class="private-msg-btn" style="background:#fff;color:#3385ff;border:1.5px solid #3385ff;border-radius:6px;padding:7px 32px;font-size:15px;cursor:pointer;">私信</button>
        </div>
      </div>
      <div style="border-top:1px solid #f0f0f0;margin-top:18px;">
        <div id="profile-tabs" style="display:flex;justify-content:center;gap:0;">
          <div class="profile-tab active" style="flex:1;text-align:center;padding:16px 0;cursor:pointer;font-weight:600;border-bottom:2.5px solid #3385ff;color:#3385ff;">文章</div>
          <div class="profile-tab" style="flex:1;text-align:center;padding:16px 0;cursor:pointer;">评论</div>
          <div class="profile-tab" style="flex:1;text-align:center;padding:16px 0;cursor:pointer;">关注</div>
          <div class="profile-tab" style="flex:1;text-align:center;padding:16px 0;cursor:pointer;">收藏</div>
        </div>
        <div id="profile-tab-content" style="padding:48px 0 64px 0;text-align:center;color:#aaa;font-size:17px;">
          <div class="profile-tab-pane" style="display:block;">你还没有发布任何文章。</div>
          <div class="profile-tab-pane" style="display:none;">你还没有任何评论。</div>
          <div class="profile-tab-pane" style="display:none;">你还没有关注任何人。</div>
          <div class="profile-tab-pane" style="display:none;">你还没有收藏任何内容。</div>
        </div>
      </div>
    </div>`;
    document.getElementById('close-center-modal-btn').onclick = closeCenterModal;
    content.querySelector('#change-cover-btn').onclick = () => uploadCoverImage(user, userProfileData, content);
    content.querySelector('.follow-btn').onclick = () => toggleFollow(user, userProfileData, content);
    content.querySelector('.private-msg-btn').onclick = () => showCustomTip('私信功能敬请期待！', 'success');
    setupProfileTabs(content);
}

// 系统通知内容（占位）
function renderSystemNotice(content) {
    content.innerHTML = `
    <div style="position:relative;width:400px;max-width:98vw;background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.10);margin:auto;padding:36px 32px 32px 32px;">
      <button id="close-center-modal-btn" style="position:absolute;right:18px;top:18px;background:rgba(0,0,0,0.12);color:#333;border:none;border-radius:50%;width:36px;height:36px;font-size:22px;cursor:pointer;z-index:2;">×</button>
      <h2 style="margin-bottom:24px;">系统通知</h2>
      <div style="color:#888;">暂无系统通知。</div>
    </div>`;
    document.getElementById('close-center-modal-btn').onclick = closeCenterModal;
}

// 退出登录确认
function renderLogoutConfirm(content) {
    content.innerHTML = `
    <div style="position:relative;width:340px;max-width:98vw;background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.10);margin:auto;padding:36px 32px 32px 32px;text-align:center;">
      <button id="close-center-modal-btn" style="position:absolute;right:18px;top:18px;background:rgba(0,0,0,0.12);color:#333;border:none;border-radius:50%;width:36px;height:36px;font-size:22px;cursor:pointer;z-index:2;">×</button>
      <div style="font-size:18px;margin-bottom:24px;">确定要退出登录吗？</div>
      <button id="logout-confirm-btn" style="background:#f44336;color:#fff;border:none;border-radius:6px;padding:8px 32px;font-size:15px;">退出登录</button>
    </div>`;
    document.getElementById('close-center-modal-btn').onclick = closeCenterModal;
    document.getElementById('logout-confirm-btn').onclick = async function () {
        await auth.signOut();
        showCustomTip('已退出登录');
        closeCenterModal();
        window.location.reload();
    };
}

// 上传背景图
async function uploadCoverImage(user, userProfileData, content) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function (e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            showCustomTip('正在上传背景图...', 'success');
            const url = await window.uploadToTelegram(file);
            await setDoc(doc(db, 'userProfiles', user.uid), { coverImage: url }, { merge: true });
            userProfileData.coverImage = url;
            await renderProfileCenter(content);
            showCustomTip('背景图上传成功！');
        } catch (error) {
            showCustomTip('背景图上传失败：' + error.message, 'error');
        }
    };
    input.click();
}

// 关注/取消关注
async function toggleFollow(user, userProfileData, content) {
    try {
        const newState = !userProfileData.following;
        await setDoc(doc(db, 'userProfiles', user.uid), { following: newState }, { merge: true });
        userProfileData.following = newState;
        await renderProfileCenter(content);
        showCustomTip(newState ? '关注成功！' : '已取消关注', 'success');
    } catch (e) {
        showCustomTip('操作失败：' + e.message, 'error');
    }
}

// Tab切换
function setupProfileTabs(content) {
    const tabs = content.querySelectorAll('#profile-tabs .profile-tab');
    const panes = content.querySelectorAll('#profile-tab-content .profile-tab-pane');
    tabs.forEach(function (tab, idx) {
        tab.onclick = function () {
            tabs.forEach(function (t, i) {
                t.classList.toggle('active', i === idx);
                t.style.color = i === idx ? '#3385ff' : '#222';
                t.style.borderBottom = i === idx ? '2.5px solid #3385ff' : '2.5px solid transparent';
            });
            panes.forEach(function (pane, i) {
                pane.style.display = i === idx ? 'block' : 'none';
            });
        };
    });
}

// 顶部自定义提示
function showCustomTip(msg, type = 'success') {
    let tip = document.createElement('div');
    tip.textContent = msg;
    tip.style = `position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:10050;padding:10px 32px;background:${type === 'error' ? '#f44336' : '#3385ff'};color:#fff;border-radius:6px;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.12);opacity:0.98;`;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 1800);
}

// 绑定菜单按钮事件
window.addEventListener('DOMContentLoaded', function () {
    const profileBtn = document.getElementById('profile-center-link');
    const noticeBtn = document.getElementById('system-notice-link');
    const accountBtn = document.getElementById('account-settings-link');
    const logoutBtn = document.getElementById('logout-link');
    if (profileBtn) profileBtn.onclick = function (e) { e.preventDefault(); openCenterModal('profile'); };
    if (noticeBtn) noticeBtn.onclick = function (e) { e.preventDefault(); openCenterModal('notice'); };
    if (accountBtn) accountBtn.onclick = function (e) { e.preventDefault(); openCenterModal('account'); };
    if (logoutBtn) logoutBtn.onclick = function (e) { e.preventDefault(); openCenterModal('logout'); };
});

// 监听账号设置菜单点击
const accountSettingsLink = document.getElementById('account-settings-link');
if (accountSettingsLink) {
    accountSettingsLink.addEventListener('click', function (e) {
        e.preventDefault();
        renderAccountSettingsModal();
        document.getElementById('center-modal').style.display = 'flex';
    });
} 