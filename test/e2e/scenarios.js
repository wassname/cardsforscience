'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('cards for science', function() {


  describe('Phone list view', function() {

    beforeEach(function() {
      browser.get('index.html');
    });


    // it('should filter the phone list as a user types into the search box', function() {
    //
    //   var lastCards = element.all(by.css('#lastCards .card'));
    //   expect(lastCards.count()).toBe(3);
    //
    //   var query = element(by.repeater('r in rc.cards'));
    //   query.click();
    //   expect(lastCards.count()).toBe(4);
    // });
  });
});
