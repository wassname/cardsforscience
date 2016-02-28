'use strict';

/* jasmine specs for controllers go here */
describe('cardsForScience controllers', function () {
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
    beforeEach(module('cardsForScience'));
    beforeEach(inject(function (_$controller_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $controller = _$controller_;
    }));

    describe('CardController', function () {
        var $scope, controller;

        beforeEach(function () {
            $scope = {};
            controller = $controller('CardController',{$scope:$scope});
        });

        it('should have cards', function () {
            expect(controller.cards).toBeDefined();
        });

        it('should be visible', function () {
            var item = controller.cards[0];
            expect(controller.isVisible(item)).toBeDefined();
        });

        it('should be isAvailable', function () {
            var item = controller.cards[0];
            expect(controller.isAvailable(item)).toBeDefined();
        });

        // onDrop
    });

});
