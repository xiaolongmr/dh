// update time:2023/7/1
(
    function() {
        //当浏览器窗口被调整大小时触发
        window.onresize = function() {
            ShowHideElement("i-link-box", "linkList-item", 845);
        }
        window.onload = function() {
            ShowHideElement("i-link-box", "linkList-item", 845);
        }

        function ShowHideElement(Element1, Element2, Vaule) {
            var Person = document.getElementsByClassName(Element1);
            var BoxHeight = document.getElementsByClassName(Element2);
            var WindowHeight = window.innerHeight || document.body.clientHeight;
            //遍历获取到的元素
            for (var i = 6; i < Person.length; i++) {
                if (WindowHeight <= Vaule && deviceVal === "pc") {
                    Person[i].style.display = "none";
                    BoxHeight[0].style.marginTop = "5px";
                } else {
                    Person[i].style.display = "block";
                    BoxHeight[0].style.marginTop = "0px";
                }
            }
        }

        window.ShowHideElement = ShowHideElement;
    }());

var now = -1;
var resLength = 0;
var listIndex = -1;
var hotList = 0;
var thisSearch = 'https://soupian.pro/search?key=';
var thisSearchIcon = './logo.jpg';
var storage = window.localStorage;
if (!storage.stopHot) {
    storage.stopHot = true
}
storage.stopHot == 'false' ?
    $('#hot-btn').attr(
        'style',
        'background: url(./img/hotg.svg) no-repeat center/cover;'
    ) :
    $('#hot-btn').attr(
        'style',
        'background: url(./img/hotk.svg) no-repeat center/cover;'
    );
var ssData = storage.searchEngine;
if (storage.searchEngine != undefined) {
    ssData = ssData.split(',');
    thisSearch = ssData[0];
    $('#search-icon').attr('class', ssData[1])
    $('#search-icon').attr('style', ssData[2])
}

// function getHotkeyword(value) {
//     $.ajax({
//         type: "GET",
//         url: "https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su",
//         async: true,
//         data: {
//             wd: value
//         },
//         dataType: "jsonp",
//         jsonp: "cb",
//         success: function(res) {
//             $("#search-box ul").text("");
//             hotList = res.s.length;
//             if (hotList) {
//                 $("#search-box").css("display", "block");
//                 for (var i = 0; i < hotList; i++) {
//                     $("#search-box ul").append("<li><span>" + (
//                         i + 1
//                     ) + "</span>" + res.s[i] + "</li>");
//                     $("#search-box ul li")
//                         .eq(i)
//                         .click(function() {
//                             $('#txt').val(this.childNodes[1].nodeValue);
//                             window.open(thisSearch + this.childNodes[1].nodeValue);
//                             $('#search-box').css('display', 'none')
//                         });
//                     if (i === 0) {
//                         $("#search-box ul li")
//                             .eq(i)
//                             .css({ "border-top": "none" });
//                         $("#search-box ul span")
//                             .eq(i)
//                             .css({ "color": "#fff", "background": "#f54545" })
//                     } else {
//                         if (i === 1) {
//                             $("#search-box ul span")
//                                 .eq(i)
//                                 .css({ "color": "#fff", "background": "#ff8547" })
//                         } else {
//                             if (i === 2) {
//                                 $("#search-box ul span")
//                                     .eq(i)
//                                     .css({ "color": "#fff", "background": "#ffac38" })
//                             }
//                         }
//                     }
//                 }
//             } else {
//                 $("#search-box").css("display", "none")
//             }
//         },
//         error: function(res) {
//             console.log(res)
//         }
//     })
// }

// 按键松开时执行
$("#txt").keyup(function(e) {
    if ($(this).val()) {
        if (e.keyCode == 38 || e.keyCode == 40 || storage.stopHot != 'true') {
            return
        }
        $("#search-clear").css("display", "block");
        getHotkeyword($(this).val())
    } else {
        $("#search-clear").css("display", "none");
        $("#search-box").css("display", "none")
    }
});

$("#txt").keydown(function(e) {
    if (e.keyCode === 40) {
        listIndex === (hotList - 1) ?
            listIndex = 0 :
            listIndex++;
        $("#search-box ul li")
            .eq(listIndex)
            .addClass("current")
            .siblings()
            .removeClass("current");
        var hotValue = $("#search-box ul li")
            .eq(listIndex)[0]
            .childNodes[1]
            .nodeValue;
        $("#txt").val(hotValue)
    }
    if (e.keyCode === 38) {
        if (e.preventDefault) {
            e.preventDefault()
        }
        if (e.returnValue) {
            e.returnValue = false
        }
        listIndex === 0 || listIndex === -1 ?
            listIndex = (hotList - 1) :
            listIndex--;
        $("#search-box ul li")
            .eq(listIndex)
            .addClass("current")
            .siblings()
            .removeClass("current");
        var hotValue = $("#search-box ul li")
            .eq(listIndex)[0]
            .childNodes[1]
            .nodeValue;
        $("#txt").val(hotValue)
    }
    if (e.keyCode === 13) {
        window.open(thisSearch + $("#txt").val());
        $("#search-box").css("display", "none");
        $("#txt").blur();
        $("#search-box ul li").removeClass("current");
        listIndex = -1
    }
});
$("#search-clear").click(function() {
    $('#txt').val("");
    $('#search-clear').css('display', 'none');
    $("#search-box").css("display", "none");
});


$("#txt").on("keydown", function(event) {
    if (event.keyCode == 13) {
        event.stopPropagation(); // 阻止事件冒泡
        if (thisSearch === "https://www.720yun.com/search/0/") {
            performSearch();
        }
    }
});

// $(".search-btn").click(function() {
//     if (thisSearch === "https://www.720yun.com/search/0/") {
//         performSearch();
//     }
// });

// Add dynamic event binding for .search-btn
$(document).on("click", ".search-btn", function() {
    // Check if a search engine is selected
    if (thisSearch) {
        performSearch();
    }
});

$("#txt").on("keydown", function(event) {
    if (event.keyCode == 13) {
        event.stopPropagation(); // Prevent event bubbling
        if (thisSearch) {
            performSearch();
        }
    }
});


// function performSearch() {
//     var searchUrl = "https://www.720yun.com/search/0/";
//     var searchQuery = encodeURIComponent($("#txt").val());
//     var newSearchUrl = searchUrl + searchQuery;
//     if(thisSearch === "https://www.720yun.com/search/0/") {
//         newSearchUrl += "/0/1?from=1nav.ml";
//     }
//     window.open(newSearchUrl);
//     $("#search-box").css("display", "none");
//     $("#txt").blur();
//     $("#search-box ul li").removeClass("current");
//     listIndex = -1;
// }


// Modify the performSearch function to use the dynamic search engine
function performSearch() {
    var searchUrl = thisSearch; // Use the dynamically selected search engine
    var searchQuery = encodeURIComponent($("#txt").val());
    var newSearchUrl = searchUrl + searchQuery;
    // Add any additional parameters specific to the search engine here
    if(thisSearch === "https://www.720yun.com/search/0/") {
        newSearchUrl += "/0/1?from=1nav.ml";
    }
    window.open(newSearchUrl);
    $("#search-box").css("display", "none");
    $("#txt").blur();
    $("#search-box ul li").removeClass("current");
    listIndex = -1;
}


// 绑定回车事件 2023/7/1匿名聊天回车发送不了消息，是这里原因
// $(document).keydown(function(event) {
//     if (event.keyCode == 13) {
//         $(".search-btn").trigger("click");
//     }
// });

$("#txt").focus(function() {
    $(".search-box").css("box-shadow", "0 4px 6px #0000001f");
    //$(".search-box").css("border", "1px solid #cecece");
    if ($(this).val() && storage.stopHot == 'true') {
        getHotkeyword($(this).val())
    }
});
$("#txt").blur(function() {
    $(".search-box").css("box-shadow", "0 2px 3px #0000000f");
    //$(".search-box").css("border", "1px solid #00000026");
    setTimeout(function() {
        $("#search-box").css("display", "none")
    }, 400)
});
$(function() {
    // $('#search-box ul').html() === '' ? $('#search-box').css('height','0px') :
    // $('#search-box').css('height','auto');
    var search = {
        data: [{
                name: '影视',
                icon: 'https://soupian.pro/favicon.ico',
                color: '#d2f2f4',
                url: 'https://soupian.pro/search?key='
            },{
                name: '歌曲',
                icon: 'https://www.gequbao.com/static/img/logo.png',
                color: '#ec653b',
                url: 'https://www.gequbao.com/s/'
            },{
                name: '翻译',
                icon: 'https://pc3.gtimg.com/softmgr/logo/48/27735_48_1631066451.png',
                color: '#3385ff',
                url: 'https://fanyi.baidu.com/#zh/en/'
            },{
                name: '必应',
                color: '#0a8583',
                icon: 'https://pc3.gtimg.com/softmgr/logo/48/26342_48_1586405624.png',
                url: 'https://cn.bing.com/search?q='
            },{
                name: '谷歌',
                color: '#0a8583',
                icon: 'https://pc3.gtimg.com/softmgr/logo/48/2661_48_1450768944.png',
                url: 'https://www.google.com/search?q='
            },
            // {
            //     name: '影视',
            //     icon: 'https://cdn.h5ds.com/space/files/600972551685382144/20230818/616911822626918400.png',
            //     color: '#d2f2f4',
            //     url: 'https://search.ymck.me/index.php?q='
            // },
            {
                name: 'F搜',
                icon: 'https://img.urlnode.com/file/9b30dd8f785f099d9864a.png',
                color: '#4c8bf5',
                url: 'https://fsoufsou.com/search?q='
            }, {
                name: '百度',
                icon: 'https://xiaolongmr.github.io/test/svg/baidu.svg',
                color: '#3385ff',
                url: 'https://www.baidu.com/s?wd='
            }, {
                name: '夸克',
                icon: 'https://xiaolongmr.github.io/test/svg/quark.svg',
                color: '#03bc11',
                url: 'https://quark.sm.cn/s?q='
            }, {
                name: '好搜',
                icon: 'https://xiaolongmr.github.io/test/svg/so.svg',
                color: '#f8b616',
                url: 'https://www.so.com/s?q='
            }, {
                name: '搜狗',
                icon: 'https://xiaolongmr.github.io/test/svg/sogou.svg',
                color: '#fe620d',
                url: 'https://www.sogou.com/web?query='
            }, {
                name: '头条',
                icon: 'https://xiaolongmr.github.io/test/svg/toutiao.svg',
                color: '#e61a0f',
                url: 'https://m.toutiao.com/search?keyword='
            }, {
                name: '图标',
                icon: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
                color: '#ec653b',
                url: 'https://www.iconfont.cn/search/index?searchType=icon&q='
            }, {
                name: 'logo',
                icon: 'http://s.sj33.cn/favicon.ico',
                color: '#ec653b',
                url: 'http://s.sj33.cn/search/?s=5844175569310651634&entry=0&ie=utf&nsid=0&ie=utf&q='
            }, {
                name: '花瓣',
                icon: 'https://st0.dancf.com/static/02/202306090204-51f4.png',
                color: '#148aff',
                url: 'https://huaban.com/search?q='
            }, {
                name: '站酷',
                icon: 'https://xiaolongmr.github.io/test/svg/zcool.svg',
                color: '#148aff',
                url: 'https://www.zcool.com.cn/search/content?word='
            }, {
                name: 'ppt',
                icon: 'https://xiaolongmr.github.io/test/svg/ppt.svg',
                color: '#ffb744',
                url: 'http://so.1ppt.com/cse/search?tn=👋记得开心呀&s=18142763795818420485&entry=1&ie=utf&nsid=3&ie=utf&q=',
            }, {
                name: 'GH',
                icon: 'https://xiaolongmr.github.io/test/svg/github.svg',
                color: '#24292e',
                url: 'https://github.com/search?q='
            }, {
                name: '微信',
                icon: 'https://xiaolongmr.github.io/test/svg/wechat.svg',
                color: '#ff0030',
                url: 'https://weixin.sogou.com/weixin?type=2&s_from=input&query='
            }, {
                name: '知乎',
                icon: 'https://xiaolongmr.github.io/test/svg/zhihu.svg',
                color: '#0078d7',
                url: 'https://www.zhihu.com/search?type=content&q='
            }, {
                name: '微博',
                icon: 'https://xiaolongmr.github.io/test/svg/weibo.svg',
                color: '#f3131b',
                url: 'https://s.weibo.com/weibo/'
            }, {
                name: 'B 站',
                icon: 'https://picshack.net/ib/5dVpB3slCQ.jpg',
                color: '#f45a8d',
                url: 'http://search.bilibili.com/all?keyword='
            }, {
                name: 'VR全景',
                icon: 'https://pic.zhaotu.me/2023/08/15/f183642a-350f-4717-8660-7eeddd49090e3548a7ae9a3f34f6.png',
                color: '#148aff',
                url: 'https://www.720yun.com/search/0/'
            }, {
                name: '深言达意',
                icon: 'https://shenyandayi.com/favicon.ico',
                color: '#148aff',
                url: 'https://shenyandayi.com/wantWordsResult?lang=zh&query='
            }, {
                name: '二维码',
                icon: 'https://static.clewm.net/static/images/favicon.ico',
                color: '#148aff',
                url: 'https://cli.im/api/qrcode/code?text='
            }
        ]
    }
    for (var i = 0; i < search.data.length; i++) {
        var addList = '<li><i style="background: url(' + search
            .data[i]
            .icon + ') no-repeat center/cover;color: ' + search
            .data[i]
            .color + '"></i><span>' + search
            .data[i]
            .name + '</span></li>'
        $('.search-engine-list').append(addList);
    }

    $('#search-icon, .search-engine').hover(function() {
        $('.search-engine').css('display', 'block')
    }, function() {
        $('.search-engine').css('display', 'none')
    });

    $('#hot-btn').on('click', function() {
        // $(this).toggleClass('icon-kaiguanclose-copy');
        if (storage.stopHot == 'true') {
            $(this).attr(
                'style',
                'background: url(./img/hotg.svg) no-repeat center/cover;'
            )
            storage.stopHot = false
        } else {
            storage.stopHot = true
            $(this).attr(
                'style',
                'background: url(./img/hotk.svg) no-repeat center/cover;'
            )
        }
        console.log(storage.stopHot)
    });

    $('.search-engine-list li').click(function() {
        var _index = $(this).index();
        var thisIcon = $(this)
            .children()
            .attr('style');
        var thisColor = $(this)
            .children()
            .attr('style');
        $('#search-icon').attr('style', thisIcon)
        $('#search-icon').attr('style', thisColor)
        thisSearch = search
            .data[_index]
            .url;
        $('.search-engine').css('display', 'none')

        storage.searchEngine = [thisSearch, thisIcon, thisColor]
    })
})

$(document).ready(function() {
    //菜单点击
    $("#menu").click(function(event) {
        $(this).toggleClass('on');
        $(".list").toggleClass('closed');
        $(".mywth").toggleClass('hidden');
    });
    $("#content").click(function(event) {
        $(".on").removeClass('on');
        $(".list").addClass('closed');
        $(".mywth").removeClass('hidden');
    });
});