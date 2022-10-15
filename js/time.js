function lovepyqSitetime() {
    window.setTimeout("lovepyqSitetime()", 1000);
    var seconds = 1000;
    var minutes = seconds * 60;
    var hours = minutes * 60;
    var days = hours * 24;
    var years = days * 365;
    var today = new Date();
    var todayYear = today.getFullYear();
    var todayMonth = today.getMonth() + 1;
    var todayDate = today.getDate();
    var todayHour = today.getHours();
    var todayMinute = today.getMinutes();
    var todaySecond = today.getSeconds();
    // 时间设置
    var t1 = Date.UTC(2022, 6, 3, 24, 00, 00); //年，月，日，时，分，秒
    var t2 = Date.UTC(
        todayYear,
        todayMonth,
        todayDate,
        todayHour,
        todayMinute,
        todaySecond
    );
    var diff = t2 - t1;
    var diffYears = Math.floor(diff / years);
    var diffDays = Math.floor(diff / days - diffYears * 365);
    var diffHours = Math.floor(
        (diff - (diffYears * 365 + diffDays) * days) / hours
    );
    var diffMinutes = Math.floor(
        (diff - (diffYears * 365 + diffDays) * days - diffHours * hours) /
        minutes
    );
    var diffSeconds = Math.floor(
        (diff -
            (diffYears * 365 + diffDays) * days -
            diffHours * hours -
            diffMinutes * minutes) /
        seconds
    );
    document.getElementById("lovepyqSitetime").innerHTML =
        "我们相<img class='heartgit' style='width: 20px; vertical-align: middle;' src='https://p.qlogo.cn/hy_personal/3e28f14aa051684243963d5396c2a938078a85c23f2eed887938535a772e251e/0.png'>了：</br>" +
        diffYears +
        "年" +
        diffDays +
        "天" +
        diffHours +
        "时" +
        diffMinutes +
        "分" +
        diffSeconds +
        "秒啦";
}
lovepyqSitetime();