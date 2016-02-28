/** Custom google analystics events **/
var Helpers = require("js/helpers");


var analytics = module.exports =
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

        ga('create', Helpers.analytics,'auto');
        ga('set', { 'appName': 'Cards For Science', 'appId': '', 'appVersion': '0.6' });
        ga('set', 'anonymizeIp', true);


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

        ga('send', 'screenview', { 'screenName': type });
    },

    sendEvent: function(category, action, label, value)
    {
        if (!analytics.enabled || typeof category === 'undefined' || typeof action === 'undefined' || typeof label === 'undefined' || typeof value === 'undefined') {
            return;
        }

        //ga('send', 'event', category, action, label, value, {'screenName': analytics.screens.main });
    }
};