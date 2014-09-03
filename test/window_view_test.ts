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

        expect(windowView.getWindowSize()).toEqual(3);
        expect(windowView.getWindowOffset()).toEqual(0);
    });

    describe("on insert", () =>
    {
        it("appends correctly, up to the window size", () =>
        {
            var windowSize = 3;

            windowView.setWindowSize(windowSize);

            windowView.changed.collect(events =>
            {
                source.addRange(sourceItems);

                expect(events.length).toEqual(windowSize);

                for (var i = 0; i < windowSize; i++)
                    expect(events[i])
                        .toEqual(biggus.CollectionChange.insert(sourceItems[i], sourceItems[i], i));
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
            expect(source.getAllItems()).toEqual([]);
            source.addRange(sourceItems);
            expect(windowView.getWindowOffset()).toEqual(2);
        });
    });

    describe("on remove", () =>
    {
        beforeEach(() =>
        {
            windowView.setWindowOffset(2);
            windowView.setWindowSize(3);
            source.addRange(sourceItems);

            expect(windowView.getAllItems()).toEqual(["C", "D", "E"]);
        });

        it("handles item within window being removed, with more items after window", () =>
        {
            windowView.changed.collect(events =>
            {
                source.removeAt(2);

                expect(events).toEqual([
                    biggus.CollectionChange.remove("C", "C", 0),
                    biggus.CollectionChange.insert("F", "F", 2)
                ]);
            });
        });

        it("handles item within window being removed, with no items after window", () =>
        {
            windowView.setWindowOffset(3);
            expect(windowView.getAllItems()).toEqual(["D", "E", "F"]);

            windowView.changed.collect(events =>
            {
                source.removeAt(3);

                expect(events).toEqual([biggus.CollectionChange.remove("D", "D", 0)]);
            });

            expect(windowView.getWindowOffset()).toEqual(3);
        });

        it("handles item after window being removed", () =>
        {
            windowView.changed.collect(events =>
            {
                source.removeAt(5);

                expect(events).toEqual([]);
            });

            expect(windowView.getWindowOffset()).toEqual(2);
        });

        it("handles item before window being removed", () =>
        {
            windowView.changed.collect(events =>
            {
                expect(windowView.getWindowOffset()).toEqual(2);

                source.removeAt(0);

                // Window appears same, but has shifted up one unit relative to the source (offset decremented)
                expect(events).toEqual([]);
                expect(windowView.getWindowOffset()).toEqual(1);
            });
        });
    });

    describe("on reset", () =>
    {
        it("maintains window parameters", () =>
        {
            windowView.changed.collect(events =>
            {
                windowView.setWindowOffset(2);
                windowView.setWindowSize(3);

                source.changed.raise(biggus.CollectionChange.reset<string>());

                expect(events).toEqual([biggus.CollectionChange.reset<string>()]);
                expect(windowView.getWindowOffset()).toEqual(2);
                expect(windowView.getWindowSize()).toEqual(3);
            });
        });
    });

    describe("on update", () =>
    {
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

        it("propagates updates for items within the window", () =>
        {
            source.addRange(sourceItems);

            windowView.setWindowOffset(2);
            windowView.setWindowSize(2);

            windowView.changed.collect(events =>
            {
                source.changed.raise(biggus.CollectionChange.update("C", "C", 2));
                source.changed.raise(biggus.CollectionChange.update("D", "D", 3));

                expect(events).toEqual([
                    biggus.CollectionChange.update("C", "C", 0),
                    biggus.CollectionChange.update("D", "D", 1)
                ]);
            });
        });
    });

    describe("on move", () =>
    {
        beforeEach(() =>
        {
            windowView.setWindowOffset(2);
            windowView.setWindowSize(3);
            source.addRange(sourceItems);

            expect(source.getAllItems()).toEqual(["A", "B", "C", "D", "E", "F"]);
            expect(windowView.getAllItems()).toEqual(["C", "D", "E"]);
        });

        it("forward within window", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(2, 4);

                expect(source.getAllItems()).toEqual(["A", "B", "D", "E", "C", "F"]);
                expect(windowView.getAllItems()).toEqual(["D", "E", "C"]);

                expect(events).toEqual([biggus.CollectionChange.move("C", "C", 2, 0)]);
            });
        });

        it("backward within window", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(4, 2);

                expect(source.getAllItems()).toEqual(["A", "B", "E", "C", "D", "F"]);
                expect(windowView.getAllItems()).toEqual(["E", "C", "D"]);

                expect(events).toEqual([biggus.CollectionChange.move("E", "E", 0, 2)]);
            });
        });

        it("before -> after", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(0, 5);

                expect(source.getAllItems()).toEqual(["B", "C", "D", "E", "F", "A"]);
                expect(windowView.getAllItems()).toEqual(["D", "E", "F"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("C", "C", 0));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("F", "F", 2));
            });
        });

        it("after -> before", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(5, 0);

                expect(source.getAllItems()).toEqual(["F", "A", "B", "C", "D", "E"]);
                expect(windowView.getAllItems()).toEqual(["B", "C", "D"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("E", "E", 2));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("B", "B", 0));
            });
        });

        it("after -> inside", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(5, 2);

                expect(source.getAllItems()).toEqual(["A", "B", "F", "C", "D", "E"]);
                expect(windowView.getAllItems()).toEqual(["F", "C", "D"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("E", "E", 2));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("F", "F", 0));
            });
        });

        it("before -> inside (top)", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(0, 2);

                expect(source.getAllItems()).toEqual(["B", "C", "A", "D", "E", "F"]);
                expect(windowView.getAllItems()).toEqual(["A", "D", "E"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("C", "C", 0));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("A", "A", 0));
            });
        });

        it("before -> inside (mid)", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(0, 3);

                expect(source.getAllItems()).toEqual(["B", "C", "D", "A", "E", "F"]);
                expect(windowView.getAllItems()).toEqual(["D", "A", "E"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("C", "C", 0));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("A", "A", 1));
            });
        });

        it("inside -> before", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(3, 1);

                expect(source.getAllItems()).toEqual(["A", "D", "B", "C", "E", "F"]);
                expect(windowView.getAllItems()).toEqual(["B", "C", "E"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("D", "D", 1));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("B", "B", 0));
            });
        });

        it("inside -> after", () =>
        {
            windowView.changed.collect(events =>
            {
                source.move(3, 5);

                expect(source.getAllItems()).toEqual(["A", "B", "C", "E", "F", "D"]);
                expect(windowView.getAllItems()).toEqual(["C", "E", "F"]);

                expect(events.length).toEqual(2);
                expect(events[0]).toEqual(biggus.CollectionChange.remove("D", "D", 1));
                expect(events[1]).toEqual(biggus.CollectionChange.insert("F", "F", 2));
            });
        });
    });

    it("raises correct events when offset increased", () =>
    {
        source.addRange(sourceItems);

        windowView.changed.collect(events =>
        {
            windowView.setWindowOffset(1);

            expect(events).toEqual([
                biggus.CollectionChange.remove("A", "A", 0),
                biggus.CollectionChange.insert("D", "D", 2)
            ]);
        });

        expect(windowView.getAllItems()).toEqual(["B", "C", "D"]);
    });

    it("raises correct events when offset decreased", () =>
    {
        windowView.setWindowOffset(2);

        source.addRange(sourceItems);

        expect(windowView.getWindowOffset()).toEqual(2);
        expect(windowView.getWindowSize()).toEqual(3);

        expect(windowView.getAllItems()).toEqual(["C", "D", "E"]);

        windowView.changed.collect(events =>
        {
            windowView.setWindowOffset(0);

            // Alternate removals and insertions to minimise O(N) copying
            // TODO investigate using removal/insertion of ranges here
            expect(events.length).toEqual(4);
            expect(events[0]).toEqual(biggus.CollectionChange.remove("E", "E", 2));
            expect(events[1]).toEqual(biggus.CollectionChange.insert("B", "B", 0));
            expect(events[2]).toEqual(biggus.CollectionChange.remove("D", "D", 2));
            expect(events[3]).toEqual(biggus.CollectionChange.insert("A", "A", 0));
        });

        expect(windowView.getAllItems()).toEqual(["A", "B", "C"]);
    });

    it("resets when offset moved such that there is no overlap between old and new windows", () =>
    {
        windowView.setWindowOffset(0);
        windowView.setWindowSize(2);

        source.addRange(sourceItems);

        windowView.changed.collect(events =>
        {
            windowView.setWindowOffset(2);

            expect(events).toEqual([biggus.CollectionChange.reset()]);
        });

        expect(windowView.getAllItems()).toEqual(["C", "D"]);
    });
});
