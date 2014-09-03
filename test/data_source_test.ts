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
                expect(events).toEqual([biggus.CollectionChange.insert("A", "A", 0)]);
            });

            expect(source.getAllItems()).toEqual(["A"]);

            source.changed.collect(events =>
            {
                source.add("B");
                expect(events).toEqual([biggus.CollectionChange.insert("B", "B", 1)]);
            });

            expect(source.getAllItems()).toEqual(["A", "B"]);

            source.changed.collect(events =>
            {
                source.addRange(["1", "2", "3"]);
                expect(events).toEqual([
                    biggus.CollectionChange.insert("1", "1", 2),
                    biggus.CollectionChange.insert("2", "2", 3),
                    biggus.CollectionChange.insert("3", "3", 4)
                ]);
            });

            expect(source.getAllItems()).toEqual(["A", "B", "1", "2", "3"]);
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
});
