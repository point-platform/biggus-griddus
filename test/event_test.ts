/**
 * @author Drew Noakes https://drewnoakes.com
 */

/// <reference path="./jasmine.d.ts" />

import biggus = require('../biggus');

describe("event", () =>
{
    var callbackItems: number[],
        event: biggus.Event<number>,
        cancelSubscription: ()=>void;

    beforeEach(() =>
    {
        callbackItems = [];
        event = new biggus.Event<number>();
        cancelSubscription = event.subscribe(item => callbackItems.push(item));
        expect(callbackItems).toEqual([]);
    });

    it("subscriber should receive events", () =>
    {
        event.raise(100);

        expect(callbackItems).toEqual([100]);

        event.raise(200);
        event.raise(300);

        expect(callbackItems).toEqual([100,200,300]);
    });

    it("supports multiple subscribers", () =>
    {
        var callbackItems2 = [];
        event.subscribe(item => callbackItems2.push(item));

        event.raise(100);
        event.raise(200);
        event.raise(300);

        expect(callbackItems).toEqual([100,200,300]);
        expect(callbackItems2).toEqual([100,200,300]);
    });

    it("stops calling cancelled subscribers", () =>
    {
        event.raise(100);

        expect(callbackItems).toEqual([100]);

        cancelSubscription();

        event.raise(200);
        event.raise(300);

        expect(callbackItems).toEqual([100]);
    });

    it("allows test code to collect events within some scope", () =>
    {
        event = new biggus.Event<number>();

        expect(event.getSubscriberCount()).toEqual(0);

        event.collect(events =>
        {
            expect(event.getSubscriberCount()).toEqual(1);

            expect(events).toEqual([]);

            event.raise(100);

            expect(events).toEqual([100]);

            event.raise(200);

            expect(events).toEqual([100,200]);
        });

        expect(event.getSubscriberCount()).toEqual(0);
    });
});
