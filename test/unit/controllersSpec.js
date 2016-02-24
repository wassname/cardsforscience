'use strict';

/* jasmine specs for controllers go here */
describe('scienceAlchemy controllers', function () {
    var $controller;

    beforeEach(function () {
        jasmine.addMatchers({
            toEqualData: function(util, customEqualityTesters) {
                return {
                    compare: function(actual, expected) {
                      var passed =  angular.equals(actual, expected);
                      return {
                        pass: passed,
                        message: 'Expected "' + actual + '"' + (passed ? '' : ' not') + ' to angular.equals "' + expected + '"'
                      };
                    }
                };
            }
        });
    });
    beforeEach(module('scienceAlchemy'));
    beforeEach(inject(function (_$controller_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $controller = _$controller_;
    }));

    describe('ElementController', function () {
        var $scope, controller;

        beforeEach(function () {
            $scope = {};
            controller = $controller('ElementController',{$scope:$scope});
        });

        it('should have elements', function () {
            expect(controller.elements).toBeDefined();
        });

        it('should be visible', function () {
            var item = controller.elements[0];
            expect(controller.isVisible(item)).toBeDefined();
        });

        it('should be isAvailable', function () {
            var item = controller.elements[0];
            expect(controller.isAvailable(item)).toBeDefined();
        });

        // onDrop
    });

});
