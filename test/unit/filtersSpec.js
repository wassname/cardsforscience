'use strict';

/* jasmine specs for filters go here */

describe('filter', function () {

    beforeEach(
        module('scienceAlchemy')
    );

    describe('niceNumber', function () {
        it('should make numbers human readable',
            inject(function (niceNumberFilter) {
                expect(niceNumberFilter(100000000)).toBe("100.0M");
                expect(niceNumberFilter(10000)).toBe("10.0k");
                expect(niceNumberFilter(0.000000001)).toBe(1e-9);

            }));
    });

    describe('niceTime', function () {
        it('should make time human readable',
            inject(function (niceTimeFilter) {
                expect(niceTimeFilter(100000000)).toBe("1 day, 3 h, 46 min, 40 s");
                expect(niceTimeFilter(10000)).toBe("10 s");
                expect(niceTimeFilter(0.000000001)).toBe("1 s");

            }));
    });

    describe('currency', function () {
        it('should make currency human readable',
            inject(function (currencyFilter) {
                expect(currencyFilter(100000000)).toBe("JTN 100.0M");
                expect(currencyFilter(10000)).toBe("JTN 10.0k");
                expect(currencyFilter(0.000000001)).toBe('JTN 1e-9');
            }));
    });

    describe('reverse', function () {
        it('should reverse',
            inject(function (reverseFilter) {
                expect(reverseFilter([1,2,3])[0]).toBe(3);
                expect(reverseFilter([1,2,3])[1]).toBe(2);
                expect(reverseFilter([1,2,3])[2]).toBe(1);
                expect(reverseFilter([]).length).toBe(0);
                expect(reverseFilter([{i:1,2:2},{i:2},{i:3}])[0].i).toBe(3);
                expect(reverseFilter([{i:1,2:2},{i:2},{i:3}])[1].i).toBe(2);
                expect(reverseFilter([{i:1,2:2},{i:2},{i:3}])[2].i).toBe(1);

            }));
    });
});
