// i18n
(function(G) {
    G = G || {};

    var cn = {
            //--common--//
            '_lang':'cn',
            'title': 'iChoice健康解决方案',
            'bpm': '心率',
            'glu': '血糖',
            'scale': '体重',
            'pulseOx': '血氧',
            'tracker': '手环',
            'ecg': '心电图',
            'thermometer': ' 体温表',
            'medReminder': '吃药提醒',
            'reset':'复位'
        },
        en = {
            '_lang':'en',
            'title': 'iChoice Healthcare',
            'bpm': 'BPM',
            'glu': 'Blood Glucose',
            'scale': 'Scale',
            'pulseOx': 'Pulse Oximeter',
            'tracker': 'Tracker',
            'ecg': 'ECG',
            'thermometer': ' Thermometer',
            'medReminder': 'Med-Reminder',
            'reset':'reset'
        },
        lang = {},
        i18n = function(k) {
            return lang[k] || null;
        },
        auto = function() {
            var bl = (navigator.language || navigator.browserLanguage).toLowerCase();
            bl.match('cn') ? (lang = cn) : (lang = en)
        };

    /* auto select language form settings */
    try {
        var s = JSON.parse(localStorage.getItem('settings'));
        if (!s.language || s.language == 0) {
            auto();
        } else {
            (s.language == 'cn') ? (lang = cn) : (lang = en);
        }
    } catch (e) {
        auto()
    }

    /**
     * i18n.format
     *
     * @param {String} String template (set String `{0},{1},{2}` in your arguments)
     * @param {String} String arguments as data
     * @return {String} String response
     * @example
     *      var number = 30;
     *      el.innerHTML = i18n.format('查看所有 {0} 条',number);
     */
    i18n.format = function(str) {
        if (arguments.length == 1) return str;
        var args = Array.prototype.slice.call(arguments, 1);
        return String(str).replace(/\{(\d+)\}/g, function(m, i) {
            return args[i]
        })
    };

    i18n.render = function(option) {
        if (option === 'en' || option === 'cn') {
            lang = eval(option)
        }
    
        $('select option').removeAttr('checked')
        $('select').val(lang._lang)
        // $(`select option[value='${lang._lang}']`).attr('selected','true')

        setTimeout(function() {
            // $('*').each(function () {
            var a = document.getElementsByTagName('*'),
                t, s;
            for (var i in a) {
                t = a[i];
                if (t && t.getAttribute) {
                    s = t.getAttribute('i18n');
                    if (s && i18n(s) && !t.getAttribute('i18n-loaded')) {
                        t.innerHTML = i18n(s);
                        // t.setAttribute('i18n-loaded', true);
                    }
                }
            }
            // });
        }, 10);
    };

    document.body.addEventListener('DOMNodeInserted', function(e) {
        i18n.render();
    });
    
    G.i18n = i18n;
})(this);