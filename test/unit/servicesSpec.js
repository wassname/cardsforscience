'use strict';

describe('services', function () {

    //load modules
    beforeEach(module('cardsForScience'));


    // Test service availability
    describe('game', function () {
        it('should exist', inject(function (game) {
            expect(game).toBeDefined();
        }));
    });

    // describe('detector', function () {
    //     it('should exist', inject(function (detector) {
    //         expect(detector).toBeDefined();
    //     }));
    // });

    describe('lab', function () {
        it('should exist', inject(function (lab) {
            expect(lab).toBeDefined();
        }));
    });

});
