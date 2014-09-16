/**
 * @author Drew Noakes https://drewnoakes.com
 */

/// <reference path="./jasmine.d.ts" />

import biggus = require('../biggus');

// TODO test filter updated in response to object updating

describe("filter view", () =>
{
    var source: biggus.DataSource<string>;
    var filterView: biggus.FilterView<string>;

    beforeEach(() =>
    {
        source = new biggus.DataSource<string>(i => i);
        filterView = new biggus.FilterView<string>(source);
    });

    it("appends correctly when no predicate specified", () =>
    {
        filterView.changed.collect(events =>
        {
            source.add("A");
            source.add("B");
            source.add("C");
            source.add("D");
            source.add("E");
            source.add("F");

            expect(events.length).toEqual(6);

            for (var i = 0; i < events.length; i++)
            {
                expect(events[i].type).toEqual(biggus.CollectionChangeType.Insert);
                expect(events[i].itemId).toEqual(events[i].item);
                expect(events[i].newIndex).toEqual(i);
            }

            expect(filterView.getAllItems()).toEqual(["A","B","C","D","E","F"]);
        });
    });

    it("appends correctly when no predicate specified", () =>
    {
        filterView.changed.collect(events =>
        {
            source.add("A");
            source.add("BB");
            source.add("CCC");
            source.add("D");
            source.add("EE");
            source.add("FFF");

            expect(events.length).toEqual(6);

            events.splice(0);

            expect(events.length).toEqual(0);

            filterView.setPredicate(s => s.length < 3);

            expect(events.length).toEqual(2);
            expect(events[0]).toEqual(biggus.CollectionChange.remove("CCC", "CCC", 2));
            expect(events[1]).toEqual(biggus.CollectionChange.remove("FFF", "FFF", 4));

            expect(filterView.getAllItems()).toEqual(["A", "BB", "D", "EE"]);
        });
    });

    it("reinserts items when filter removed", () =>
    {
        filterView.setPredicate(s => s.length < 3);

        source.add("A");
        source.add("BB");
        source.add("CCC");
        source.add("D");
        source.add("EE");
        source.add("FFF");

        expect(filterView.getAllItems().length).toEqual(4);

        filterView.changed.collect(events =>
        {
            filterView.setPredicate(null);

            expect(events.length).toEqual(2);
            expect(events[0]).toEqual(biggus.CollectionChange.insert("CCC", "CCC", 4, false));
            expect(events[1]).toEqual(biggus.CollectionChange.insert("FFF", "FFF", 5, false));
        });
    });

    it("propagates reset events", () =>
    {
        filterView.setPredicate(s => s.length < 3);

        source.add("A");
        source.add("BB");
        source.add("CCC");

        filterView.changed.collect(events =>
        {
            (<any>source).items.push("a");
            (<any>source).items.push("bbb");
            (<any>source).items.push("c");

            source.reset();

            expect(events).toEqual([biggus.CollectionChange.reset<string>()]);

            expect(filterView.getAllItems()).toEqual(["A", "BB", "a", "c"]);
        })
    });
});
