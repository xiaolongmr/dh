/**
 * 配置项
 * data-redirectUrl //跳转地址
 * @type {DOMStringMap}
 */
var config = document.querySelector('script[name=ospRobot]').dataset;

//图标位置, 宽高
var iconTop = config.iconTop || false
var iconBottom = config.iconBottom || false
if (!iconTop && !iconBottom) {
  iconBottom = 100
}

var iconLeft = config.iconLeft || false
var iconRight = config.iconRight || false
if (!iconLeft && !iconRight) {
  iconRight = 50
}

var iconWidth = config.iconWidth || 100
var iconHeight = config.iconHeight || 100

var chatStyle = config.style || '';

// 聊天框宽高
var chatWidth = config.chatWidth || 375
chatWidth = chatWidth >= 325 ? chatWidth : 325
var chatHeight = config.chatHeight || 667
var chatPosition = config.chatPosition || 'leftTop'
//聊天框头部
var chatColor = config.chatColor || '#3377ee'
var chatTitle = config.chatTitle || '夏小智'

//新窗口地址
var redirectUrl = config.redirectUrl || ''

//咨询地址
var chatUrl = config.chatUrl || '';

//咨询服务域名
var chatDomain = config.chatDomain || '';
//图标
// var icon = config.icon || (chatDomain + '/static/img/robot/robot-2.png');
var icon = config.icon || ('https://cdn.h5ds.com/space/files/600972551685382144/20250709/867425894834118656.png');

// tip
var chatDesc = config.chatDesc || 'Hi！我是夏小智,关于导航站有什么问题尽管来问我吧！'

// iframe 是否打开
var chatOpen = false;

// 悬浮元素id
var divId = 'yj-chat-box-20250331';

//创建悬浮元素
var div = document.createElement('div');
div.id = divId;
div.innerHTML = `<img class='robot-img' src='${icon}' />`;
div.innerHTML += `<div class='robot-text'>${chatTitle}</div>`;
div.innerHTML += `<div class='robot-tip'></div>`;
div.onclick = function () {
  if (redirectUrl) {
    window.open(redirectUrl, '_blank')
    return
  }

  targetDom = document.getElementById(divId)

  if (!chatOpen) {
    //创建会话框元素
    var chatDiv = document.createElement('div')
    chatDiv.className = 'osp-robot-box-chat-202406201'
    chatDiv.id = 'osp-robot-box-chat-202406201'
    var chatDivStyle = 'height: ' + (parseInt(chatHeight) + 50) + 'px;' +
      'width: ' + chatWidth + 'px;' +
      'box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.44);' +
      'border-radius: 10px;' +
      'overflow: hidden;' +
      'position:absolute;'

    if (chatPosition == 'leftTop') {
      chatDivStyle += 'top: ' + (-10 - (parseInt(chatHeight) + 50)) + 'px;' +
        'right:0;'
    } else if (chatPosition == 'leftBottom') {
      chatDivStyle += 'bottom: ' + (-10 - (parseInt(chatHeight) + 50)) + 'px;' +
        'right:0;'
    } else if (chatPosition == 'rightTop') {
      chatDivStyle += 'top: ' + (-10 - (parseInt(chatHeight) + 50)) + 'px;' +
        'left:0;'
    } else if (chatPosition == 'rightBottom') {
      chatDivStyle += 'bottom: ' + (-10 - (parseInt(chatHeight) + 50)) + 'px;' +
        'left:0;'
    }
    chatDiv.style = chatDivStyle

    targetDom.append(chatDiv)
    targetDom.className += ' osp-robot-box-202406201-close';
    chatOpen = true

    //创建会话框头部
    var headerDiv = document.createElement('div')
    headerDiv.innerText = chatTitle
    headerDiv.style = 'height:50px; background-color:' + chatColor + ';display:flex;align-items:center; justify-content: center;color:#fff'
    chatDiv.append(headerDiv)

    //创建iframe, 也就是咨询页面
    var iframe = document.createElement('iframe');
    iframe.className = 'osp-robot-box-202406201-iframe'
    iframe.style = 'width:' + chatWidth + 'px;' + 'height:' + chatHeight + 'px; border:none;'
    iframe.src = chatUrl;

    chatDiv.append(iframe)

  } else {
    document.getElementById('osp-robot-box-chat-202406201').remove()
    targetDom.className = 'osp-robot-box-202406201';
    chatOpen = false
  }
}

//延迟1秒执行, 防止body不存在
setTimeout(function () {
  document.body.append(div)
}, 1000)

// 机器人说话文本
var index = 0;
var robotTip = '';
var robotTipArr = chatDesc.split(',');

function changeRobotTip() {
  robotTip = '';
  if (index === robotTipArr.length) {
    index = 0;
  }

  const strs = robotTipArr[index].split('');
  strs.forEach((item, i) => {
    setTimeout(() => {
      robotTip += item;
      div.querySelector('.robot-tip').innerHTML = robotTip;
      if (i === strs.length - 1) {
        setTimeout(() => {
          index++;
          changeRobotTip();
        }, 1200);
      }
    }, 120 * i);
  });
}

changeRobotTip();


// 悬浮元素样式
var style = document.createElement('style');
style.type = 'text/css';

// 修改样式字符串的格式，使用模板字符串来保持格式清晰
var ospRobotBoxStyle = `
#${divId} {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  ${iconTop ? `top: ${iconTop}px;` : ''}
  ${iconLeft ? `left: ${iconLeft}px;` : ''}
  ${iconBottom ? `bottom: ${iconBottom}px;` : ''}
  ${iconRight ? `right: ${iconRight}px;` : ''}
  width: ${iconWidth}px;
  height: ${iconHeight}px;
  z-index: 9999;
  ${chatStyle}
}

#${divId} .robot-img {
  width: 62px;
  height: 62px;
  position: relative;
  top: 6px;
  animation: spread_robot 2.4s linear infinite;
}

#${divId} .robot-text {
  border-radius: 20px;
  background: linear-gradient(90deg, #6a9ef8 0, #8978f5 100%);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 20px;
  padding: 4px 10px;
  position: absolute;
  transform: translateY(42px);
}

#${divId} .robot-tip {
  border-radius: 20px;
  background: #fff;
  font-size: 14px;
  font-weight: 400;
  color: #2f3968;
  line-height: 20px;
  padding: 4px 15px;
  box-shadow: 0 0 8px 0 #5b49DF2B;
  position: fixed;
  transform: translateY(-51px);
}

#${divId}::before {
  content: "";
  width: 54px;
  height: 54px;
  border-radius: 50%;
  position: absolute;
  background: linear-gradient(90deg, #6a9ef8 0, #8978f5 100%);
  animation: spread_small 2.4s linear infinite;
  opacity: .2;
}

#${divId}::after {
  content: "";
  width: 70px;
  height: 70px;
  border-radius: 50%;
  position: absolute;
  background: linear-gradient(90deg, #6a9ef8 0, #8978f5 100%);
  animation: spread_big 2.4s linear infinite;
  opacity: .15;
}

@keyframes spread_small {
  0% {
    width: 54px;
    height: 54px;
    opacity: .2;
  }
  50% {
    width: 60px;
    height: 60px;
    opacity: .12;
  }
  100% {
    width: 54px;
    height: 54px;
    opacity: .2;
  }
}

@keyframes spread_big {
  0% {
    width: 70px;
    height: 70px;
    opacity: .15;
  }
  50% {
    width: 80px;
    height: 80px;
    opacity: .1;
  }
  100% {
    width: 70px;
    height: 70px;
    opacity: .15;
  }
}

@keyframes spread_robot {
  0% {
    width: 62px;
    height: 62px;
    top: 6px;
  }
  20% {
    width: 62px;
    height: 66px;
    top: -1px;
  }
  50% {
    width: 62px;
    height: 66px;
    top: -11px;
  }
  80% {
    width: 62px;
    height: 66px;
    top: 1px;
  }
  100% {
    width: 62px;
    height: 62px;
    top: 6px;
  }
}`;

// 添加样式到 style 元素
style.appendChild(document.createTextNode(ospRobotBoxStyle));

// 添加 style 到 head
var head = document.head || document.getElementsByTagName('head')[0];
head.appendChild(style);