// ==================== 配置区 (必须修改！) ====================
// 请替换成你在腾讯云IM控制台获取的真实值
const SDK_APP_ID = 1600126430; // 替换为你的 SDKAppID，例如：1400123456
const SECRET_KEY = "5dabf6704fe8fc43b07340ddf3d1155aecd23867497b52fb5a660b7c14d884c1"; // 替换为你的密钥，例如：abcdefghijklmnopqrstuvwxyz0123456789
// ========================================================

// 腾讯云IM实例和变量
let tim;
let currentUserID = '';
let talkingToUserID = 'user2'; // 默认的聊天对象

// DOM 元素
const loginBtn = document.getElementById('login-btn');
const sendBtn = document.getElementById('send-btn');
const userIdInput = document.getElementById('user-id-input');
const friendIdInput = document.getElementById('friend-id-input');
const messageInput = document.getElementById('message-input');
const messageList = document.getElementById('message-list');
const currentUserSpan = document.getElementById('current-user');

/*
// 工具函数：生成UserSig（适配64位ECDSA-SHA256密钥）
function genTestUserSig(userID) {
    const { JSEncrypt } = require('jsencrypt'); // 需安装：npm install jsencrypt
    const sdkAppID = SDK_APP_ID;
    const privateKey = SECRET_KEY; // 你的64位密钥
    
    const time = Math.floor(Date.now() / 1000);
    const expire = 604800;
    
    // 构造签名原文
    const data = `${userID}${sdkAppID}${time}${expire}`;
    
    // RSA-SHA256 签名（ECDSA兼容模式）
    const sign = new JSEncrypt();
    sign.setPrivateKey(privateKey);
    const sig = sign.sign(data, CryptoJS.SHA256, "sha256");
    
    return {
        sdkAppID: sdkAppID,
        userSig: sig,
        userID: userID
    };
}
*/


// 工具函数：在消息区域添加一条消息
function appendMessage(senderId, text, isOutgoing = false, isSystem = false) {
    const messageEl = document.createElement('div');
    const senderEl = document.createElement('div');
    const contentEl = document.createElement('div');
    
    if (isSystem) {
        messageEl.className = 'message system';
        contentEl.className = 'message-content';
        contentEl.textContent = text;
        messageEl.appendChild(contentEl);
    } else {
        messageEl.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
        senderEl.className = 'message-sender';
        senderEl.textContent = senderId;
        contentEl.className = 'message-content';
        contentEl.textContent = text;
        messageEl.appendChild(senderEl);
        messageEl.appendChild(contentEl);
    }
    
    messageList.appendChild(messageEl);
    // 滚动到底部
    messageList.scrollTop = messageList.scrollHeight;
}

// 1. 初始化腾讯云IM SDK
function initTIM() {
    // 创建SDK实例，版本为最新
    const TIM = window.TIM;
    const options = {
        SDKAppID: SDK_APP_ID
    };
    tim = TIM.create(options);
    
    // 设置日志级别（开发阶段设为debug，上线后可改为warn或error）
    tim.setLogLevel(0);
    
    // 监听收到消息的事件
    tim.on(TIM.EVENT.MESSAGE_RECEIVED, function(event) {
        // event.data 是接收到的消息数组
        event.data.forEach(function(message) {
            // 只处理文本消息
            if (message.type === 'TIMTextElem') {
                // 判断是否是当前聊天对象发来的
                if (message.from === talkingToUserID || message.from === currentUserID) {
                    const isOutgoing = message.from === currentUserID;
                    appendMessage(message.from, message.payload.text, isOutgoing);
                } else {
                    console.log('收到非当前会话消息:', message);
                }
            }
        });
    });
    
    console.log('腾讯云IM SDK 初始化成功！');
    appendMessage('系统', 'SDK初始化完成，请登录开始聊天。', false, true);
}

// 2. 登录功能
loginBtn.addEventListener('click', async function() {
    const userID = userIdInput.value.trim();
    if (!userID) {
        alert('请输入用户ID');
        return;
    }
    
    // 生成UserSig（实际生产环境中，此步骤必须在你的服务器端完成！）
    const userSig = "eJwtzMEKgkAUheF3mXXYdabxotDOCCoI0QihTeSot1KGOxZh9O6ZuTzfgf8tsl3qPQ2LSEgPxGzcVJi2o5JGfjjDcjpccTtbS4WI-ADAl8FCwf8xL0tsBtdaS4BJO2p*hggh6lDhVKFq6GJStSVvs-W*jTf9HRXnF8WJujbo8lV9mqv*yEFcp-oAS-H5AlEjMXw_eJyrVgrxCdYrSy1SslIy0jNQ0gHzM1NS80oy0zLBwqXFqUVGUInilOzEgoLMFCUrQzMDA0MjMxNjA4hMakVBZlEqUNzU1NTIwAAqWpKZCxIzNzewNDczMrKAmpKZDjTX3Czbxyc7Rt-Psig7wtUgOSM-IyowMrHMLSsrpyrR39zbNbs0J82xNCTD3cJWqRYAT7kyIA__";
    
    try {
        // 执行登录
        const loginResult = await tim.login({ userID: userID, userSig: userSig });
        console.log('登录成功：', loginResult);
        
        currentUserID = userID;
        currentUserSpan.textContent = userID;
        loginBtn.textContent = '已登录';
        loginBtn.disabled = true;
        userIdInput.disabled = true;
        
        appendMessage('系统', `用户 [${userID}] 登录成功！`, false, true);
        messageInput.focus();
    } catch (error) {
        console.error('登录失败：', error);
        alert('登录失败，请检查SDKAppID和密钥是否正确，以及网络连接。');
    }
});

// 3. 发送消息功能
sendBtn.addEventListener('click', async function() {
    if (!currentUserID) {
        alert('请先登录！');
        return;
    }
    
    const text = messageInput.value.trim();
    const toUser = friendIdInput.value.trim();
    
    if (!text) {
        alert('请输入消息内容');
        return;
    }
    if (!toUser) {
        alert('请输入对方用户ID');
        return;
    }
    
    // 更新当前聊天对象
    talkingToUserID = toUser;
    
    // 创建一条文本消息
    const message = tim.createTextMessage({
        to: toUser,
        conversationType: 'C2C', // C2C表示单聊
        payload: {
            text: text
        }
    });
    
    try {
        // 发送消息
        const sendResult = await tim.sendMessage(message);
        console.log('发送成功：', sendResult);
        
        // 在本地界面显示自己发出的消息
        appendMessage(currentUserID, text, true);
        
        // 清空输入框
        messageInput.value = '';
        messageInput.focus();
    } catch (error) {
        console.error('发送失败：', error);
        alert('消息发送失败，请检查网络或对方ID是否存在。');
    }
});

// 支持按回车发送消息
messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendBtn.click();
    }
});

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    initTIM();
    appendMessage('系统', '聊天室已启动！请设置你的用户ID并登录。', false, true);
});