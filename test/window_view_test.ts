/**
 * @author Drew Noakes https://drewnoakes.com
 */

/// <reference path="./jasmine.d.ts" />

import biggus = require('../biggus');

describe("window view", () =>
{
    var source: biggus.DataSource<string>,
        windowView: biggus.WindowView<string>,
        sourceItems = ["A", "B", "C", "D", "E", "F"];

    beforeEach(() =>
    {
        source = new biggus.DataSource<string>(i => i);
        windowView = new biggus.WindowView<string>(source, 3);
    });

    it("appends correctly, up to the window size", () =>
    {
        expect(windowView.getWindowSize()).toEqual(3);
        expect(windowView.getWindowOffset()).toEqual(0);

        windowView.changed.collect(events =>
        {
            source.addRange(sourceItems);

            expect(events.length).toEqual(3);

            for (var i = 0; i < events.length; i++)
            {
                expect(events[i].item).toEqual(sourceItems[i]);
                expect(events[i].type).toEqual(biggus.CollectionChangeType.Insert);
                expect(events[i].itemId).toEqual(sourceItems[i]);
                expect(events[i].newIndex).toEqual(i);
            }
        });

        expect(windowView.getAllItems()).toEqual(["A", "B", "C"]);
    });

    it("maintains correct offset while values are added", () =>
    {
        expect(windowView.getWindowOffset()).toEqual(0);
        source.addRange(sourceItems);
        windowView.setWindowOffset(2);
        source.addRange(sourceItems);
        expect(windowView.getWindowOffset()).toEqual(2);
    });

    it("deals with an offset greater than the number of items present", () =>
    {
        expect(windowView.getWindowOffset()).toEqual(0);
        windowView.setWindowOffset(2);
        source.addRange(sourceItems);
        expect(windowView.getWindowOffset()).toEqual(2);
    });

    it("raises correct events when offset increased", () =>
    {
        source.addRange(sourceItems);

        windowView.changed.collect(events =>
        {
            windowView.setWindowOffset(1);

            expect(events.length).toEqual(2);

            expect(events[0].item).toEqual("A");
            expect(events[0].oldIndex).toEqual(0);
            expect(events[0].type).toEqual(biggus.CollectionChangeType.Remove);

            expect(events[1].item).toEqual("D");
            expect(events[1].newIndex).toEqual(2);
            expect(events[1].type).toEqual(biggus.CollectionChangeType.Insert);
        });

        expect(windowView.getAllItems()).toEqual(["B", "C", "D"]);
    });

    it("raises correct events when offset decreased", () =>
    {
        windowView.setWindowOffset(1);

        source.addRange(sourceItems);

        expect(windowView.getWindowOffset()).toEqual(1);

        windowView.changed.collect(events =>
        {
            windowView.setWindowOffset(0);

            expect(events.length).toEqual(2);

            expect(events[0].item).toEqual("A");
            expect(events[0].newIndex).toEqual(0);
            expect(events[0].type).toEqual(biggus.CollectionChangeType.Insert);

            expect(events[1].item).toEqual("D");
            expect(events[1].oldIndex).toEqual(2);
            expect(events[1].type).toEqual(biggus.CollectionChangeType.Remove);
        });

        expect(windowView.getAllItems()).toEqual(["B", "C", "D"]);
    });

    it("resets when offset moved such that there is no overlap between old and new windows", () =>
    {
        windowView.setWindowOffset(0);
        windowView.setWindowSize(2);

        source.addRange(sourceItems);

        windowView.changed.collect(events =>
        {
            windowView.setWindowOffset(2);

            expect(events.length).toEqual(1);

            expect(events[0].type).toEqual(biggus.CollectionChangeType.Reset);
        });

        expect(windowView.getAllItems()).toEqual(["C", "D"]);
    });

    it("ignores updates for items not in the window", () =>
    {
        source.addRange(sourceItems);

        windowView.setWindowOffset(2);
        windowView.setWindowSize(2);

        windowView.changed.collect(events =>
        {
            source.changed.raise(biggus.CollectionChange.update("A", "A", 0));
            source.changed.raise(biggus.CollectionChange.update("B", "B", 1));
            source.changed.raise(biggus.CollectionChange.update("E", "E", 4));
            source.changed.raise(biggus.CollectionChange.update("F", "F", 5));

            expect(events.length).toEqual(0);
        });
    });
});
