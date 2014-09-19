/**
 * @author Drew Noakes https://drewnoakes.com
 */

/// <reference path="./jasmine.d.ts" />

import biggus = require('../biggus');

describe("data source", () =>
{
    var source: biggus.DataSource<string>;

    beforeEach(() =>
    {
        source = new biggus.DataSource<string>(i => i);
    });

    describe("on add", () =>
    {
        it("adds items and raises change event", () =>
        {
            source.changed.collect(events =>
            {
                source.add("A");
                expect(events).toEqual([biggus.CollectionChange.insert("A", "A", 0, true)]);
            });

            expect(source.getAllItems()).toEqual(["A"]);

            source.changed.collect(events =>
            {
                source.add("B");
                expect(events).toEqual([biggus.CollectionChange.insert("B", "B", 1, true)]);
            });

            expect(source.getAllItems()).toEqual(["A", "B"]);
        });
    });

    describe("on add range", () =>
    {
        it("adds items and raises change event", () =>
        {
            source.add("A");

            source.changed.collect(events =>
            {
                source.addRange(["1", "2", "3"]);
                expect(events).toEqual([
                    biggus.CollectionChange.reset<string>(),
                    biggus.CollectionChange.scroll<string>()
                ]);
            });

            expect(source.getAllItems()).toEqual(["A", "1", "2", "3"]);
        });
    });

    describe("on remove", () =>
    {
        it("removes items and raises event", () =>
        {
            source.addRange(["1", "2", "3"]);

            source.changed.collect(events =>
            {
                source.removeAt(1);

                expect(events).toEqual([
                    biggus.CollectionChange.remove("2", "2", 1)
                ]);
            });

            expect(source.getAllItems()).toEqual(["1", "3"]);
        });
    });

    describe("on move", () =>
    {
        it("moves item and raises event", () =>
        {
            source.addRange(["1", "2", "3"]);

            source.changed.collect(events =>
            {
                source.move(0, 1);
                expect(events).toEqual([biggus.CollectionChange.move("1", "1", 0, 1)]);
            });

            expect(source.getAllItems()).toEqual(["2", "1", "3"]);
        });
        it("moves item and raises event (inverse)", () =>
        {
            source.addRange(["1", "2", "3"]);

            source.changed.collect(events =>
            {
                source.move(1, 0);
                expect(events).toEqual([biggus.CollectionChange.move("2", "2", 1, 0)]);
            });

            expect(source.getAllItems()).toEqual(["2", "1", "3"]);
        });
    });

    describe("on reset", () =>
    {
        it("raises reset event", () =>
        {
            source.changed.collect(events =>
            {
                source.reset();

                expect(events).toEqual([biggus.CollectionChange.reset<string>()]);
            })
        });
    });
});
