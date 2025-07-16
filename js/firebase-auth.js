/**
 * Firebase 认证系统
 * 负责用户登录、注册、状态管理等核心功能
 */

// 引入Firebase相关SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    signInAnonymously, // 新增匿名登录方法
    EmailAuthProvider, // 新增
    linkWithCredential // 新增
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/**
 * Firebase 配置信息
 * 请根据您的Firebase项目配置进行修改
 */
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

/**
 * 全局变量
 */
let currentUser = null;
window.userProfile = window.userProfile || null;

/**
 * 用户认证状态管理类
 */
class AuthManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化认证管理器
     */
    init() {
        // 监听认证状态变化
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });

        // 绑定事件监听器
        this.bindEvents();
    }

    /**
     * 处理用户登录
     * @param {Object} user - Firebase用户对象
     */
    async handleUserLogin(user) {
        currentUser = user;
        console.log('用户邮箱:', user.email);
        console.log('用户uid:', user.uid);

        // 获取用户详细信息
        await this.loadUserProfile(user.uid);

        // 更新UI状态
        this.updateUIForLoggedInUser();

        // 显示用户头像
        this.showUserAvatar();

        // 隐藏登录按钮
        this.hideLoginButton();

        // 显示我的收藏模块
        this.showFavoritesBox();
        this.updateUpgradeBtnVisibility && this.updateUpgradeBtnVisibility();
    }

    /**
     * 处理用户登出
     */
    handleUserLogout() {
        currentUser = null;
        window.userProfile = null;
        console.log('用户已登出');

        // 更新UI状态
        this.updateUIForLoggedOutUser();

        // 隐藏用户头像
        this.hideUserAvatar();

        // 显示登录按钮
        this.showLoginButton();

        // 隐藏我的收藏模块
        this.hideFavoritesBox();
        this.updateUpgradeBtnVisibility && this.updateUpgradeBtnVisibility();
    }

    /**
     * 加载用户详细信息
     * @param {string} uid - 用户ID
     */
    async loadUserProfile(uid) {
        try {
            const userDoc = doc(db, 'userProfiles', uid);
            const snap = await getDoc(userDoc);

            if (snap.exists()) {
                window.userProfile = snap.data();
            } else {
                // 匿名用户特殊处理
                let nickname, avatar;
                if (currentUser.isAnonymous) {
                    nickname = '访客' + uid.slice(-4);
                    avatar = this.getDefaultAvatar('anonymous@guest.com');
                } else {
                    nickname = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '用户');
                    avatar = this.getDefaultAvatar(currentUser.email || '');
                }
                window.userProfile = {
                    nickname,
                    avatar,
                    bio: '',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                await this.saveUserProfile(uid, window.userProfile);
            }
        } catch (error) {
            console.error('加载用户资料失败:', error);
            let nickname, avatar;
            if (currentUser && currentUser.isAnonymous) {
                nickname = '访客' + uid.slice(-4);
                avatar = this.getDefaultAvatar('anonymous@guest.com');
            } else {
                nickname = currentUser && currentUser.displayName || (currentUser && currentUser.email ? currentUser.email.split('@')[0] : '用户');
                avatar = this.getDefaultAvatar(currentUser && currentUser.email || '');
            }
            window.userProfile = {
                nickname,
                avatar,
                bio: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
        }
    }

    /**
     * 保存用户资料
     * @param {string} uid - 用户ID
     * @param {Object} profile - 用户资料对象
     */
    async saveUserProfile(uid, profile) {
        try {
            const userDoc = doc(db, 'userProfiles', uid);
            await setDoc(userDoc, profile, { merge: true });
        } catch (error) {
            console.error('保存用户资料失败:', error);
        }
    }

    /**
     * 获取默认头像
     * @param {string} email - 用户邮箱
     * @returns {string} 头像URL
     */
    getDefaultAvatar(email) {
        // 如果是QQ邮箱，尝试获取QQ头像
        if (email.includes('@qq.com')) {
            const qqNumber = email.split('@')[0];
            if (/^\d+$/.test(qqNumber)) {
                return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`;
            }
        }

        // 默认头像
        return 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
    }

    /**
     * 更新登录用户UI
     */
    updateUIForLoggedInUser() {
        // 关闭登录弹窗
        this.closeLoginModal();

        // 更新用户头像显示
        this.updateUserAvatar();
    }

    /**
     * 更新登出用户UI
     */
    updateUIForLoggedOutUser() {
        // 清空表单
        this.clearLoginForm();

        // 隐藏下拉菜单
        this.hideUserDropdown();
    }

    /**
     * 显示用户头像
     */
    showUserAvatar() {
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            avatarBtn.style.display = 'block';
        }
    }

    /**
     * 隐藏用户头像
     */
    hideUserAvatar() {
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            avatarBtn.style.display = 'none';
        }
    }

    /**
     * 更新用户头像显示
     */
    updateUserAvatar() {
        const avatarContainer = document.getElementById('user-avatar-container');
        if (avatarContainer && window.userProfile) {
            const avatarImg = avatarContainer.querySelector('.user-avatar');
            const userName = avatarContainer.querySelector('.user-name');

            if (avatarImg) {
                avatarImg.src = window.userProfile.avatar;
                avatarImg.alt = window.userProfile.nickname || '访客';
            }

            if (userName) {
                userName.textContent = window.userProfile.nickname || '访客';
            }
        }
    }

    /**
     * 显示登录按钮
     */
    showLoginButton() {
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }
    }

    /**
     * 隐藏登录按钮
     */
    hideLoginButton() {
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
    }

    /**
     * 显示我的收藏模块
     */
    showFavoritesBox() {
        const favBox = document.getElementById('my-fav-box');
        if (favBox) {
            favBox.style.display = 'block';
        }
    }

    /**
     * 隐藏我的收藏模块
     */
    hideFavoritesBox() {
        const favBox = document.getElementById('my-fav-box');
        if (favBox) {
            favBox.style.display = 'none';
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 登录按钮点击事件
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // 用户头像点击事件
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            avatarBtn.addEventListener('click', () => this.toggleUserDropdown());
        }

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-avatar-btn')) {
                this.hideUserDropdown();
            }
        });

        // 登录表单提交事件
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单提交事件
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 匿名登录按钮事件
        const anonymousBtn = document.getElementById('anonymous-login-btn');
        if (anonymousBtn) {
            anonymousBtn.addEventListener('click', () => this.handleAnonymousLogin());
        }
        // 升级为正式账号按钮事件，弹窗显示
        const upgradeBtn = document.getElementById('upgrade-account-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                document.getElementById('upgrade-modal').style.display = 'flex';
                document.getElementById('upgrade-email').value = '';
                document.getElementById('upgrade-password').value = '';
                document.getElementById('upgrade-email-error').textContent = '';
                document.getElementById('upgrade-password-error').textContent = '';
            });
        }
        // 弹窗取消按钮
        const cancelBtn = document.getElementById('upgrade-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('upgrade-modal').style.display = 'none';
            });
        }
        // 弹窗升级按钮
        const okBtn = document.getElementById('upgrade-ok-btn');
        if (okBtn) {
            okBtn.addEventListener('click', async () => {
                const email = document.getElementById('upgrade-email').value.trim();
                const password = document.getElementById('upgrade-password').value;
                let valid = true;
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                    document.getElementById('upgrade-email-error').textContent = '请输入有效邮箱';
                    valid = false;
                } else {
                    document.getElementById('upgrade-email-error').textContent = '';
                }
                if (!password || password.length < 6) {
                    document.getElementById('upgrade-password-error').textContent = '密码至少6位';
                    valid = false;
                } else {
                    document.getElementById('upgrade-password-error').textContent = '';
                }
                if (!valid) return;
                okBtn.disabled = true;
                okBtn.textContent = '升级中...';
                await window.authManager.handleUpgradeAccount(email, password);
                okBtn.disabled = false;
                okBtn.textContent = '升级';
                document.getElementById('upgrade-modal').style.display = 'none';
            });
        }
    }

    /**
     * 显示登录弹窗
     */
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchToLoginMode();
            this.clearLoginForm();
            const info = this.loadLoginInfo && this.loadLoginInfo();
            if (info) {
                document.getElementById('login-email').value = info.email;
                document.getElementById('login-password').value = info.password;
                document.getElementById('remember-password').checked = true;
            } else {
                document.getElementById('remember-password').checked = false;
            }
        }
    }

    /**
     * 关闭登录弹窗
     */
    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'none';
            this.clearLoginForm();
        }
    }

    /**
     * 切换到登录模式
     */
    switchToLoginMode() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchBtn = document.getElementById('switch-mode-btn');

        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (switchBtn) switchBtn.textContent = '没有账号？立即注册';
    }

    /**
     * 切换到注册模式
     */
    switchToRegisterMode() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchBtn = document.getElementById('switch-mode-btn');

        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (switchBtn) switchBtn.textContent = '已有账号？立即登录';
    }

    /**
     * 清空登录表单
     */
    clearLoginForm() {
        const inputs = document.querySelectorAll('#login-modal input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });

        // 清除错误信息
        const errors = document.querySelectorAll('.form-error');
        errors.forEach(error => {
            error.style.display = 'none';
        });
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember-password').checked;
        const loginBtn = document.getElementById('login-btn');

        // 验证输入
        if (!this.validateEmail(email)) {
            this.showError('login-email', '请输入有效的邮箱地址');
            return;
        }

        if (!password) {
            this.showError('login-password', '请输入密码');
            return;
        }

        // 显示加载状态
        this.setLoadingState(loginBtn, true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (remember) {
                this.saveLoginInfo(email, password);
            } else {
                this.clearLoginInfo();
            }
            console.log('登录成功');
        } catch (error) {
            console.error('登录失败:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(loginBtn, false);
        }
    }

    /**
     * 处理注册
     */
    async handleRegister() {
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const nickname = document.getElementById('register-nickname').value.trim();
        const registerBtn = document.getElementById('register-btn');

        // 验证输入
        if (!this.validateEmail(email)) {
            this.showError('register-email', '请输入有效的邮箱地址');
            return;
        }

        if (password.length < 6) {
            this.showError('register-password', '密码至少需要6位');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register-confirm-password', '两次输入的密码不一致');
            return;
        }

        if (!nickname) {
            this.showError('register-nickname', '请输入昵称');
            return;
        }

        // 显示加载状态
        this.setLoadingState(registerBtn, true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // 更新用户资料
            await updateProfile(userCredential.user, {
                displayName: nickname
            });

            // 创建用户资料文档
            const userProfile = {
                nickname: nickname,
                avatar: this.getDefaultAvatar(email),
                bio: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            await this.saveUserProfile(userCredential.user.uid, userProfile);

            console.log('注册成功');
        } catch (error) {
            console.error('注册失败:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(registerBtn, false);
        }
    }

    /**
     * 处理匿名登录
     */
    async handleAnonymousLogin() {
        const anonymousBtn = document.getElementById('anonymous-login-btn');
        this.setLoadingState(anonymousBtn, true);
        try {
            await signInAnonymously(auth);
            // 登录成功后会自动触发 onAuthStateChanged
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(anonymousBtn, false);
        }
    }

    /**
     * 处理匿名用户升级为正式账号
     */
    async handleUpgradeAccount(email, password) {
        try {
            const credential = EmailAuthProvider.credential(email, password);
            await linkWithCredential(currentUser, credential);
            alert('升级成功，您的账号已绑定邮箱！');
            await this.handleUserLogin(auth.currentUser);
            this.updateUpgradeBtnVisibility && this.updateUpgradeBtnVisibility();
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * 处理登出
     */
    async handleLogout() {
        try {
            await signOut(auth);
            console.log('登出成功');
        } catch (error) {
            console.error('登出失败:', error);
            alert('登出失败：' + error.message);
        }
    }

    /**
     * 切换用户下拉菜单
     */
    toggleUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    /**
     * 隐藏用户下拉菜单
     */
    hideUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 显示错误信息
     * @param {string} fieldId - 字段ID
     * @param {string} message - 错误信息
     */
    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentNode.querySelector('.form-error');

        if (field) {
            field.classList.add('error');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * 设置加载状态
     * @param {HTMLElement} button - 按钮元素
     * @param {boolean} loading - 是否加载中
     */
    setLoadingState(button, loading) {
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            button.textContent = '处理中...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = button.dataset.originalText || '登录';
        }
    }

    /**
     * 处理认证错误
     * @param {Object} error - 错误对象
     */
    handleAuthError(error) {
        let message = '操作失败';

        switch (error.code) {
            case 'auth/user-not-found':
                message = '用户不存在';
                break;
            case 'auth/wrong-password':
                message = '密码错误';
                break;
            case 'auth/email-already-in-use':
                message = '邮箱已被注册';
                break;
            case 'auth/weak-password':
                message = '密码强度太弱';
                break;
            case 'auth/invalid-email':
                message = '邮箱格式无效';
                break;
            case 'auth/too-many-requests':
                message = '请求过于频繁，请稍后再试';
                break;
            default:
                message = error.message;
        }

        alert(message);
    }

    /**
     * 获取当前用户
     * @returns {Object|null} 当前用户对象
     */
    getCurrentUser() {
        return currentUser;
    }

    /**
     * 获取用户资料
     * @returns {Object|null} 用户资料对象
     */
    getUserProfile() {
        return window.userProfile;
    }

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return currentUser !== null;
    }

    /**
     * 保存登录信息
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     */
    saveLoginInfo(email, password) {
        // 简单加密（仅防止明文，非安全加密）
        localStorage.setItem('rememberLogin', JSON.stringify({
            email,
            password: window.btoa(unescape(encodeURIComponent(password)))
        }));
    }

    /**
     * 清除登录信息
     */
    clearLoginInfo() {
        localStorage.removeItem('rememberLogin');
    }

    /**
     * 加载登录信息
     * @returns {Object|null} 登录信息对象
     */
    loadLoginInfo() {
        const data = localStorage.getItem('rememberLogin');
        if (!data) return null;
        try {
            const obj = JSON.parse(data);
            return {
                email: obj.email,
                password: decodeURIComponent(escape(window.atob(obj.password)))
            };
        } catch (e) { return null; }
    }

    /**
     * 显示/隐藏“升级为正式账号”按钮
     */
    updateUpgradeBtnVisibility() {
        const upgradeBtn = document.getElementById('upgrade-account-btn');
        if (upgradeBtn) {
            if (currentUser && currentUser.isAnonymous) {
                upgradeBtn.style.display = 'block';
            } else {
                upgradeBtn.style.display = 'none';
            }
        }
    }
}

/**
 * 全局认证管理器实例
 */
window.authManager = new AuthManager();
window.authManager.updateUpgradeBtnVisibility && window.authManager.updateUpgradeBtnVisibility();

/**
 * 全局函数 - 显示登录弹窗
 */
window.showLoginModal = function () {
    window.authManager.showLoginModal();
};

/**
 * 全局函数 - 关闭登录弹窗
 */
window.closeLoginModal = function () {
    window.authManager.closeLoginModal();
};

/**
 * 全局函数 - 切换登录/注册模式
 */
window.switchAuthMode = function () {
    const loginForm = document.getElementById('login-form');
    if (loginForm && loginForm.style.display !== 'none') {
        window.authManager.switchToRegisterMode();
    } else {
        window.authManager.switchToLoginMode();
    }
};

/**
 * 全局函数 - 登出
 */
window.logout = function () {
    window.authManager.handleLogout();
};

/**
 * 全局函数 - 重置密码
 */
window.resetPassword = function () {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        alert('请先输入邮箱地址');
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert('密码重置邮件已发送，请检查您的邮箱');
        })
        .catch((error) => {
            console.error('发送重置邮件失败:', error);
            alert('发送重置邮件失败：' + error.message);
        });
};

// 密码可见切换功能
function setupPasswordVisibilityToggles() {
    document.querySelectorAll('.toggle-password-visibility').forEach(btn => {
        const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
        btn.onclick = function () {
            if (!input) return;
            const isVisible = input.type === 'text';
            input.type = isVisible ? 'password' : 'text';
            // 切换图标
            btn.innerHTML = isVisible
                ? `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                : `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 5.06-6.06M1 1l22 22"/><path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/></svg>`;
        };
    });
}
// 页面加载和弹窗切换时都要调用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPasswordVisibilityToggles);
} else {
    setupPasswordVisibilityToggles();
}
// 登录/注册模式切换后也要重新绑定
const origSwitchToLoginMode = AuthManager.prototype.switchToLoginMode;
AuthManager.prototype.switchToLoginMode = function () {
    origSwitchToLoginMode.call(this);
    setTimeout(() => {
        const info = this.loadLoginInfo && this.loadLoginInfo();
        if (info) {
            document.getElementById('login-email').value = info.email;
            document.getElementById('login-password').value = info.password;
            document.getElementById('remember-password').checked = true;
        } else {
            document.getElementById('remember-password').checked = false;
        }
    }, 0);
};
const origSwitchToRegisterMode = AuthManager.prototype.switchToRegisterMode;
AuthManager.prototype.switchToRegisterMode = function () {
    origSwitchToRegisterMode.call(this);
    setTimeout(setupPasswordVisibilityToggles, 0);
};

// 导出认证管理器供其他模块使用
export { AuthManager, auth, db }; 