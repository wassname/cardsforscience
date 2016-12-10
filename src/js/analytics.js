/** Custom google analystics events **/
import Helpers from "js/helpers";

// google analystics async code
(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

var analytics = 
{
    enabled: true,

    screens:
    {
        main: 'Main screen',
        about: 'About',
        achievements: 'Achievements',
        info: 'Physics information'
    },

    events:
    {
        categoryResearch: 'Research',
        categoryHR: 'HR',
        categoryUpgrades: 'Upgrades',

        actionResearch: 'Research',
        actionHire: 'Hire',
        actionBuy: 'Buy'
    },

    init: function()
    {
        if (typeof Helpers.analytics === 'undefined' || Helpers.analytics == '') {
            analytics.enabled = false;
            return;
        }

        // TODO replace with angular analtcs
        if(ga){
            ga('create', Helpers.analytics,'auto');
            ga('set', { 'appName': 'Cards For Science', 'appId': '', 'appVersion': '0.6' });
            ga('set', 'anonymizeIp', true);
            // ga('send','pageview');// angulartics
        }


        $('#myModal').on('show.bs.modal', function (e) {
            analytics.sendScreen(analytics.screens.about);
        });
        $('#myModal').on('hide.bs.modal', function (e) {
            analytics.sendScreen(analytics.screens.main);
        });

        $('#achievements-modal').on('show.bs.modal', function (e) {
            analytics.sendScreen(analytics.screens.achievements);
        });
        $('#achievements-modal').on('hide.bs.modal', function (e) {
            analytics.sendScreen(analytics.screens.main);
        });

        $('#infoBox').on('show.bs.modal', function (e) {
            analytics.sendScreen(analytics.screens.info);
        });
        $('#infoBox').on('hide.bs.modal', function (e) {
            analytics.sendScreen(analytics.screens.main);
        });
    },

    sendScreen: function(type)
    {
        if (!analytics.enabled || typeof type === 'undefined') {
            return;
        }
        if(ga){
            ga('send', 'screenview', { 'screenName': type });
        }
    },

    sendEvent: function(category, action, label, value)
    {
        if (!analytics.enabled || typeof category === 'undefined' || typeof action === 'undefined' || typeof label === 'undefined' || typeof value === 'undefined') {
            return;
        }
        if(ga){
            ga('send', 'event', category, action, label, value, {'screenName': analytics.screens.main });
        }
    }
};

export default analytics
