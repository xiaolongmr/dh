!function(){function t(t,o,s){for(var e=document.getElementsByClassName(t),n=document.getElementsByClassName(o),a=window.innerHeight||document.body.clientHeight,c=6;c<e.length;c++)a<=s&&"pc"===deviceVal?(e[c].style.display="none",n[0].style.marginTop="5px"):(e[c].style.display="block",n[0].style.marginTop="0px")}window.onresize=function(){t("i-link-box","linkList-item",845)},window.onload=function(){t("i-link-box","linkList-item",845)},window.ShowHideElement=t}();var now=-1,resLength=0,listIndex=-1,hotList=0,thisSearch="https://cn.bing.com/search?q=",thisSearchIcon="./logo.jpg",storage=window.localStorage;storage.stopHot||(storage.stopHot=!0),"false"==storage.stopHot?$("#hot-btn").attr("style","background: url(./img/hotg.svg) no-repeat center/cover;"):$("#hot-btn").attr("style","background: url(./img/hotk.svg) no-repeat center/cover;");var ssData=storage.searchEngine;function getHotkeyword(t){$.ajax({type:"GET",url:"https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su",async:!0,data:{wd:t},dataType:"jsonp",jsonp:"cb",success:function(t){if($("#search-box ul").text(""),hotList=t.s.length){$("#search-box").css("display","block");for(var o=0;o<hotList;o++)$("#search-box ul").append("<li><span>"+(o+1)+"</span>"+t.s[o]+"</li>"),$("#search-box ul li").eq(o).click((function(){$("#txt").val(this.childNodes[1].nodeValue),window.open(thisSearch+this.childNodes[1].nodeValue),$("#search-box").css("display","none")})),0===o?($("#search-box ul li").eq(o).css({"border-top":"none"}),$("#search-box ul span").eq(o).css({color:"#fff",background:"#f54545"})):1===o?$("#search-box ul span").eq(o).css({color:"#fff",background:"#ff8547"}):2===o&&$("#search-box ul span").eq(o).css({color:"#fff",background:"#ffac38"})}else $("#search-box").css("display","none")},error:function(t){console.log(t)}})}null!=storage.searchEngine&&(ssData=ssData.split(","),thisSearch=ssData[0],$("#search-icon").attr("class",ssData[1]),$("#search-icon").attr("style",ssData[2])),$("#txt").keyup((function(t){if($(this).val()){if(38==t.keyCode||40==t.keyCode||"true"!=storage.stopHot)return;$("#search-clear").css("display","block"),getHotkeyword($(this).val())}else $("#search-clear").css("display","none"),$("#search-box").css("display","none")})),$("#txt").keydown((function(t){if(40===t.keyCode){listIndex===hotList-1?listIndex=0:listIndex++,$("#search-box ul li").eq(listIndex).addClass("current").siblings().removeClass("current");var o=$("#search-box ul li").eq(listIndex)[0].childNodes[1].nodeValue;$("#txt").val(o)}if(38===t.keyCode){t.preventDefault&&t.preventDefault(),t.returnValue&&(t.returnValue=!1),0===listIndex||-1===listIndex?listIndex=hotList-1:listIndex--,$("#search-box ul li").eq(listIndex).addClass("current").siblings().removeClass("current");o=$("#search-box ul li").eq(listIndex)[0].childNodes[1].nodeValue;$("#txt").val(o)}13===t.keyCode&&(window.open(thisSearch+$("#txt").val()),$("#search-box").css("display","none"),$("#txt").blur(),$("#search-box ul li").removeClass("current"),listIndex=-1)})),$("#search-clear").click((function(){$("#txt").val(""),$("#search-clear").css("display","none"),$("#search-box").css("display","none")})),$(".search-btn").click((function(){window.open(thisSearch+$("#txt").val()),$("#search-box").css("display","none"),$("#txt").blur(),$("#search-box ul li").removeClass("current"),listIndex=-1})),$("#txt").focus((function(){$(".search-box").css("box-shadow","0 4px 6px #0000001f"),$(this).val()&&"true"==storage.stopHot&&getHotkeyword($(this).val())})),$("#txt").blur((function(){$(".search-box").css("box-shadow","0 2px 3px #0000000f"),setTimeout((function(){$("#search-box").css("display","none")}),400)})),$((function(){for(var t={data:[{name:"影视",icon:"https://ymck.me/wp-content/uploads/2022/12/head-removebg-preview-1-1.png",color:"#d2f2f4",url:"https://search.ymck.me/index.php?q="},{name:"F搜",icon:"https://static.hetaousercontent.com/static/assets/apple-touch-icon.png",color:"#4c8bf5",url:"https://fsoufsou.com/search?q="},{name:"百度",icon:"https://xiaolongmr.github.io/test/svg/baidu.svg",color:"#3385ff",url:"https://www.baidu.com/s?wd="},{name:"翻译",icon:"https://fanyi-cdn.cdn.bcebos.com/webStatic/translation/img/favicon/favicon-32x32.png",color:"#3385ff",url:"https://fanyi.baidu.com/#zh/en/"},{name:"必应",color:"#0a8583",icon:"https://xiaolongmr.github.io/test/svg/bing.svg",url:"https://cn.bing.com/search?q="},{name:"图标",icon:"https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg",color:"#ec653b",url:"https://www.iconfont.cn/search/index?searchType=icon&q="},{name:"logo",icon:"http://s.sj33.cn/favicon.ico",color:"#ec653b",url:"http://s.sj33.cn/search/?s=5844175569310651634&entry=0&ie=utf&nsid=0&ie=utf&q="},{name:"歌曲",icon:"https://www.gequbao.com/static/img/logo.png",color:"#ec653b",url:"https://www.gequbao.com/s/"},{name:"好搜",icon:"https://xiaolongmr.github.io/test/svg/so.svg",color:"#f8b616",url:"https://www.so.com/s?q="},{name:"搜狗",icon:"https://xiaolongmr.github.io/test/svg/sogou.svg",color:"#fe620d",url:"https://www.sogou.com/web?query="},{name:"ppt",icon:"https://xiaolongmr.github.io/test/svg/ppt.svg",color:"#ffb744",url:"http://so.1ppt.com/cse/search?tn=👋记得开心呀&s=18142763795818420485&entry=1&ie=utf&nsid=3&ie=utf&q="},{name:"Github",icon:"https://xiaolongmr.github.io/test/svg/github.svg",color:"#24292e",url:"https://githubfast.com/search?q="},{name:"头条",icon:"https://xiaolongmr.github.io/test/svg/toutiao.svg",color:"#e61a0f",url:"https://m.toutiao.com/search?keyword="},{name:"微信",icon:"https://xiaolongmr.github.io/test/svg/wechat.svg",color:"#ff0030",url:"https://weixin.sogou.com/weixin?type=2&s_from=input&query="},{name:"知乎",icon:"https://xiaolongmr.github.io/test/svg/zhihu.svg",color:"#0078d7",url:"https://www.zhihu.com/search?type=content&q="},{name:"微博",icon:"https://xiaolongmr.github.io/test/svg/weibo.svg",color:"#f3131b",url:"https://s.weibo.com/weibo/"},{name:"B 站",icon:"https://xiaolongmr.github.io/test/svg/bilibili.svg",color:"#f45a8d",url:"http://search.bilibili.com/all?keyword="},{name:"夸克",icon:"https://xiaolongmr.github.io/test/svg/quark.svg",color:"#03bc11",url:"https://quark.sm.cn/s?q="},{name:"站酷",icon:"https://xiaolongmr.github.io/test/svg/zcool.svg",color:"#148aff",url:"https://www.zcool.com.cn/search/content?word="}]},o=0;o<t.data.length;o++){var s='<li><i style="background: url('+t.data[o].icon+") no-repeat center/cover;color: "+t.data[o].color+'"></i><span>'+t.data[o].name+"</span></li>";$(".search-engine-list").append(s)}$("#search-icon, .search-engine").hover((function(){$(".search-engine").css("display","block")}),(function(){$(".search-engine").css("display","none")})),$("#hot-btn").on("click",(function(){"true"==storage.stopHot?($(this).attr("style","background: url(./img/hotg.svg) no-repeat center/cover;"),storage.stopHot=!1):(storage.stopHot=!0,$(this).attr("style","background: url(./img/hotk.svg) no-repeat center/cover;")),console.log(storage.stopHot)})),$(".search-engine-list li").click((function(){var o=$(this).index(),s=$(this).children().attr("style"),e=$(this).children().attr("style");$("#search-icon").attr("style",s),$("#search-icon").attr("style",e),thisSearch=t.data[o].url,$(".search-engine").css("display","none"),storage.searchEngine=[thisSearch,s,e]}))})),$(document).ready((function(){$("#menu").click((function(t){$(this).toggleClass("on"),$(".list").toggleClass("closed"),$(".mywth").toggleClass("hidden")})),$("#content").click((function(t){$(".on").removeClass("on"),$(".list").addClass("closed"),$(".mywth").removeClass("hidden")}))}));