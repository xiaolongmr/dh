// 账号设置功能
import { getAuth, updateEmail, updatePassword, updateProfile, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// 打开账号设置弹窗
window.openAccountSettings = async function () {
    document.getElementById('account-settings-modal').style.display = 'flex';
    const user = auth.currentUser;
    if (!user) return;
    // 预填资料
    document.getElementById('avatar-preview').src = user.photoURL || 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
    document.getElementById('avatar-preview').removeAttribute('data-uploaded');
    document.getElementById('nickname-input').value = user.displayName || '';
    document.getElementById('email-input').value = user.email || '';
    document.getElementById('email-input').readOnly = true;
    // Firestore 个人说明和昵称、注册时间
    const docSnap = await getDoc(doc(db, 'userProfiles', user.uid));
    document.getElementById('bio-input').value = docSnap.exists() ? (docSnap.data().bio || '') : '';
    if (docSnap.exists() && docSnap.data().nickname) {
        document.getElementById('nickname-input').value = docSnap.data().nickname;
    }
    // 注册时间
    if (docSnap.exists() && docSnap.data().createdAt) {
        document.getElementById('register-time').textContent = docSnap.data().createdAt.replace('T', ' ').replace('Z', '');
    } else {
        document.getElementById('register-time').textContent = '';
    }
    // 邮箱验证状态
    if (user.emailVerified) {
        document.getElementById('verify-email-btn').style.display = 'none';
        document.getElementById('email-verified-status').textContent = '已验证';
    } else {
        document.getElementById('verify-email-btn').style.display = '';
        document.getElementById('email-verified-status').textContent = '未验证';
    }
};

// 关闭弹窗
window.closeAccountSettings = function () {
    document.getElementById('account-settings-modal').style.display = 'none';
};

// 顶部自定义提示条（替换alert）
function showCustomTip(msg, type = 'success') {
    let tip = document.createElement('div');
    tip.textContent = msg;
    tip.style = `position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:10050;padding:10px 32px;background:${type === 'error' ? '#f44336' : '#3385ff'};color:#fff;border-radius:6px;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.12);opacity:0.98;`;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 1800);
}

// 头像上传区域新布局和交互
function setupAvatarUploadArea() {
    // 选择本地图片
    if (document.getElementById('avatar-upload-btn')) {
        document.getElementById('avatar-upload-btn').onclick = function () {
            document.getElementById('avatar-upload').click();
        };
    }
    // 历史头像按钮
    if (document.getElementById('avatar-history-btn')) {
        document.getElementById('avatar-history-btn').onclick = function () {
            showCustomTip('历史头像功能敬请期待！', 'success');
        };
    }
    // 头像图片也可点击上传
    if (document.getElementById('avatar-preview')) {
        document.getElementById('avatar-preview').style.cursor = 'pointer';
        document.getElementById('avatar-preview').onclick = function () {
            document.getElementById('avatar-upload').click();
        };
    }
}

// 页面加载后初始化头像上传区域
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupAvatarUploadArea();
} else {
    document.addEventListener('DOMContentLoaded', setupAvatarUploadArea);
}

// 头像上传（弹窗内裁剪）
if (document.getElementById('avatar-upload')) {
    document.getElementById('avatar-upload').onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            // 显示裁剪区在账号设置弹窗内
            document.getElementById('avatar-cropper-area').style.display = 'block';
            document.getElementById('avatar-cropper-img').src = event.target.result;
            // 初始化Cropper
            if (window._avatarCropper) window._avatarCropper.destroy();
            window._avatarCropper = new Cropper(document.getElementById('avatar-cropper-img'), {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                movable: true,
                zoomable: true,
                rotatable: false,
                scalable: false,
                guides: false,
                center: true,
                highlight: false,
                cropBoxResizable: true,
                cropBoxMovable: true,
                minContainerWidth: 120,
                minContainerHeight: 120
            });
        };
        reader.readAsDataURL(file);
    };
}

// 裁剪区按钮事件
if (document.getElementById('avatar-cropper-cancel')) {
    document.getElementById('avatar-cropper-cancel').onclick = function () {
        if (window._avatarCropper) window._avatarCropper.destroy();
        document.getElementById('avatar-cropper-area').style.display = 'none';
    };
}
if (document.getElementById('avatar-cropper-confirm')) {
    document.getElementById('avatar-cropper-confirm').onclick = async function () {
        if (!window._avatarCropper) return;
        // 显示loading
        document.getElementById('avatar-loading').style.display = 'flex';
        window._avatarCropper.getCroppedCanvas({ width: 64, height: 64, imageSmoothingQuality: 'high' }).toBlob(async (blob) => {
            try {
                // 上传到Telegram图床，返回图片直链
                const url = await window.uploadToTelegram(blob);
                // 预览和保存用新头像
                document.getElementById('avatar-preview').src = url;
                document.getElementById('avatar-preview').setAttribute('data-uploaded', url);
                showCustomTip('头像上传成功！');
            } catch (err) {
                showCustomTip('头像上传失败：' + err.message, 'error');
            }
            // 隐藏loading
            document.getElementById('avatar-loading').style.display = 'none';
            window._avatarCropper.destroy();
            document.getElementById('avatar-cropper-area').style.display = 'none';
        }, 'image/webp', 0.9);
    };
}

// 保存资料（去除邮箱相关，仅保存头像、昵称、个人说明）
if (document.getElementById('save-profile-btn')) {
    document.getElementById('save-profile-btn').onclick = async function () {
        const user = auth.currentUser;
        if (!user) return;
        const nickname = document.getElementById('nickname-input').value.trim();
        const bio = document.getElementById('bio-input').value.trim();
        // 优先用上传后的头像
        const avatar = document.getElementById('avatar-preview').getAttribute('data-uploaded') || user.photoURL || '';
        // 更新Auth（displayName 仍需同步，photoURL用avatar）
        await updateProfile(user, { displayName: nickname, photoURL: avatar });
        // Firestore只写nickname和avatar字段
        await setDoc(doc(db, 'userProfiles', user.uid), { nickname, avatar, bio }, { merge: true });
        showCustomTip('资料已保存！');
        // 彻底同步全局userProfile，保证头像和昵称按钮即时更新
        window.userProfile = window.userProfile || {};
        window.userProfile.avatar = avatar;
        window.userProfile.nickname = nickname;
        window.userProfile.bio = bio;
        if (window.authManager && typeof window.authManager.updateUserAvatar === 'function') {
            window.authManager.updateUserAvatar();
        }
    };
}

// 邮箱验证按钮逻辑
if (document.getElementById('verify-email-btn')) {
    document.getElementById('verify-email-btn').onclick = async function () {
        const user = auth.currentUser;
        if (!user) return;
        await sendEmailVerification(user);
        showCustomTip('验证邮件已发送，请在当前登录账号的浏览器中打开邮箱链接完成验证！');
    };
}

// 修改密码
if (document.getElementById('change-password-btn')) {
    document.getElementById('change-password-btn').onclick = async function () {
        const user = auth.currentUser;
        const newPwd = document.getElementById('password-input').value;
        if (!newPwd) return alert('请输入新密码');
        try {
            await updatePassword(user, newPwd);
            alert('密码修改成功，请牢记新密码！');
            document.getElementById('password-input').value = '';
        } catch (err) {
            alert('密码修改失败：' + err.message);
        }
    };
}

// 新增：模块化渲染方法
export async function renderAccountSettingsModal() {
    const centerModal = document.getElementById('center-modal');
    const modalContent = centerModal.querySelector('.modal-content');
    modalContent.innerHTML = '';

    modalContent.innerHTML = `
        <div class="account-settings-content" style="background:#fff;border-radius:12px;max-width:700px;width:95vw;padding:0;box-shadow:0 8px 32px rgba(0,0,0,0.18);position:relative;display:flex;overflow:hidden;">
            <div class="account-settings-sidebar" style="width:220px;background:#f7f7f7;padding:32px 18px;display:flex;flex-direction:column;align-items:center;gap:32px;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                    <img id="avatar-preview" src="" alt="头像预览" style="width:80px;height:80px;border-radius:50%;border:1px solid #eee;object-fit:cover;cursor:pointer;">
                    <input type="file" id="avatar-upload" accept="image/*" style="display:none;">
                    <button type="button" id="avatar-upload-btn" class="btn btn-secondary" style="padding:6px 16px;">上传头像</button>
                    <div id="avatar-cropper-area" style="display:none;margin-top:12px;text-align:center;">
                        <div style="position:relative;display:inline-block;">
                            <img id="avatar-cropper-img" style="max-width:180px;max-height:180px;display:inline-block;">
                            <div id="avatar-loading" style="display:none;position:absolute;left:0;top:0;width:100%;height:100%;background:rgba(255,255,255,0.6);z-index:10;justify-content:center;align-items:center;">
                                <div class="loader"></div>
                            </div>
                        </div>
                        <div style="margin-top:8px;">
                            <button type="button" id="avatar-cropper-confirm" class="btn btn-primary" style="margin-right:8px;">确定</button>
                            <button type="button" id="avatar-cropper-cancel" class="btn btn-secondary">取消</button>
                        </div>
                    </div>
                </div>
                <div style="width:100%;text-align:center;">
                    <div style="font-size:13px;color:#888;">注册时间</div>
                    <div id="register-time" style="font-size:14px;color:#333;margin-top:2px;"></div>
                </div>
                <div style="width:100%;text-align:center;">
                    <div style="font-size:13px;color:#888;">电子邮箱</div>
                    <div style="margin-top:2px;">
                        <input type="email" id="email-input" class="form-input" readonly style="width:100%;text-align:center;">
                    </div>
                    <div style="margin-top:6px;">
                        <button type="button" id="verify-email-btn" class="btn btn-secondary" style="padding:4px 10px;display:none;">立即验证</button>
                        <span id="email-verified-status" style="font-size:13px;color:#3385ff;margin-left:6px;"></span>
                    </div>
                </div>
            </div>
            <div class="account-settings-main" style="flex:1;padding:40px 36px;display:flex;flex-direction:column;justify-content:center;">
                <h2 style="text-align:left;margin-bottom:32px;">账号设置</h2>
                <form id="account-settings-form" autocomplete="off">
                    <div class="form-group" style="margin-bottom:28px;">
                        <label style="font-weight:600;">昵称</label>
                        <input type="text" id="nickname-input" class="form-input" maxlength="20" style="width:100%;margin-top:6px;">
                    </div>
                    <div class="form-group" style="margin-bottom:28px;">
                        <label style="font-weight:600;">个人说明</label>
                        <input type="text" id="bio-input" class="form-input" maxlength="50" style="width:100%;margin-top:6px;">
                    </div>
                    <div class="form-actions" style="display:flex;gap:16px;justify-content:flex-start;margin-top:32px;">
                        <button type="button" id="save-profile-btn" class="btn btn-primary" style="padding:8px 32px;">保存资料</button>
                        <button type="button" id="close-account-settings-btn" class="btn btn-secondary" style="padding:8px 24px;">关闭</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 预填用户资料
    const user = auth.currentUser;
    if (!user) return;

    modalContent.querySelector('#avatar-preview').src = user.photoURL || 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
    modalContent.querySelector('#avatar-preview').removeAttribute('data-uploaded');
    modalContent.querySelector('#nickname-input').value = user.displayName || '';
    modalContent.querySelector('#email-input').value = user.email || '';
    modalContent.querySelector('#email-input').readOnly = true;

    const docSnap = await getDoc(doc(db, 'userProfiles', user.uid));
    modalContent.querySelector('#bio-input').value = docSnap.exists() ? (docSnap.data().bio || '') : '';
    if (docSnap.exists() && docSnap.data().nickname) {
        modalContent.querySelector('#nickname-input').value = docSnap.data().nickname;
    }
    if (docSnap.exists() && docSnap.data().createdAt) {
        modalContent.querySelector('#register-time').textContent = docSnap.data().createdAt.replace('T', ' ').replace('Z', '');
    } else {
        modalContent.querySelector('#register-time').textContent = '';
    }
    if (user.emailVerified) {
        modalContent.querySelector('#verify-email-btn').style.display = 'none';
        modalContent.querySelector('#email-verified-status').textContent = '已验证';
    } else {
        modalContent.querySelector('#verify-email-btn').style.display = '';
        modalContent.querySelector('#email-verified-status').textContent = '未验证';
    }

    // 绑定所有事件
    modalContent.querySelector('#close-account-settings-btn').onclick = function () {
        centerModal.style.display = 'none';
        modalContent.innerHTML = '';
        if (window._avatarCropper) {
            window._avatarCropper.destroy();
            window._avatarCropper = null;
        }
    };

    modalContent.querySelector('#avatar-upload-btn').onclick = function () {
        modalContent.querySelector('#avatar-upload').click();
    };

    modalContent.querySelector('#avatar-preview').onclick = function () {
        modalContent.querySelector('#avatar-upload').click();
    };

    modalContent.querySelector('#avatar-upload').onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            modalContent.querySelector('#avatar-cropper-area').style.display = 'block';
            modalContent.querySelector('#avatar-cropper-img').src = event.target.result;
            if (window._avatarCropper) window._avatarCropper.destroy();
            window._avatarCropper = new Cropper(modalContent.querySelector('#avatar-cropper-img'), {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                movable: true,
                zoomable: true,
                rotatable: false,
                scalable: false,
                guides: false,
                center: true,
                highlight: false,
                cropBoxResizable: true,
                cropBoxMovable: true,
                minContainerWidth: 120,
                minContainerHeight: 120
            });
        };
        reader.readAsDataURL(file);
    };

    modalContent.querySelector('#avatar-cropper-cancel').onclick = function () {
        if (window._avatarCropper) window._avatarCropper.destroy();
        modalContent.querySelector('#avatar-cropper-area').style.display = 'none';
    };

    modalContent.querySelector('#avatar-cropper-confirm').onclick = async function () {
        if (!window._avatarCropper) return;
        modalContent.querySelector('#avatar-loading').style.display = 'flex';
        window._avatarCropper.getCroppedCanvas({ width: 64, height: 64, imageSmoothingQuality: 'high' }).toBlob(async (blob) => {
            try {
                const url = await window.uploadToTelegram(blob);
                modalContent.querySelector('#avatar-preview').src = url;
                modalContent.querySelector('#avatar-preview').setAttribute('data-uploaded', url);
                showCustomTip('头像上传成功！');
            } catch (err) {
                showCustomTip('头像上传失败：' + err.message, 'error');
            }
            modalContent.querySelector('#avatar-loading').style.display = 'none';
            window._avatarCropper.destroy();
            modalContent.querySelector('#avatar-cropper-area').style.display = 'none';
        }, 'image/webp', 0.9);
    };

    modalContent.querySelector('#save-profile-btn').onclick = async function () {
        const user = auth.currentUser;
        if (!user) return;
        const nickname = modalContent.querySelector('#nickname-input').value.trim();
        const bio = modalContent.querySelector('#bio-input').value.trim();
        const avatar = modalContent.querySelector('#avatar-preview').getAttribute('data-uploaded') || user.photoURL || '';
        await updateProfile(user, { displayName: nickname, photoURL: avatar });
        await setDoc(doc(db, 'userProfiles', user.uid), { nickname, avatar, bio }, { merge: true });
        showCustomTip('资料已保存！');
        window.userProfile = window.userProfile || {};
        window.userProfile.avatar = avatar;
        window.userProfile.nickname = nickname;
        window.userProfile.bio = bio;
        if (window.authManager && typeof window.authManager.updateUserAvatar === 'function') {
            window.authManager.updateUserAvatar();
        }
    };

    modalContent.querySelector('#verify-email-btn').onclick = async function () {
        const user = auth.currentUser;
        if (!user) return;
        await sendEmailVerification(user);
        showCustomTip('验证邮件已发送，请在当前登录账号的浏览器中打开邮箱链接完成验证！');
    };
} 