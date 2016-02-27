'use strict';

/* jasmine specs for directives go here */

describe('directives', function () {
    var $compile,
        $rootScope;

    // Load the myApp module, which contains the directive
    beforeEach(module('scienceAlchemy'));
    // beforeEach(module('Rules'));

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$compile_, _$rootScope_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    it('Replaces the element with the appropriate content', function () {
        // define a rule for testing
        $rootScope.rule = Rules.rules[0];

        // Compile a piece of HTML containing the directive
        var element = $compile('<div cfs-rule="rule" ng-model="rule"></div>')($rootScope);

        // fire all the watches, so the scope expressions will be evaluated
        // $rootScope.$digest();
        $rootScope.$apply();

        // Check that the compiled element contains the templated content
        var html = element.html();
        expect(html).toContain("<select");
        expect(html).toContain("<option");
        expect(html).toContain("Next card must not have the same");
    });
});
