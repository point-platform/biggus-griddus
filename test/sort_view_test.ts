/**
 * @author Drew Noakes https://drewnoakes.com
 */

/// <reference path="./jasmine.d.ts" />

import biggus = require('../biggus');

// TODO test values are sorted when they are updated
// TODO add tests that make guarantees about stability of ordering on updates

describe("sort view", () =>
{
    it("inserts items at the correct location", () =>
    {
        var compare = (a, b) => a === b ? 0 : a < b ? -1 : 1;
        var length = (a: string, b:string) => a.length === b.length
            ? compare(a, b)
            : compare(a.length, b.length);

        var asc = biggus.SortDirection.Ascending;

        expect(biggus.findInsertionIndex([],  1, asc, compare)).toEqual(0);
        expect(biggus.findInsertionIndex([2], 1, asc, compare)).toEqual(0);
        expect(biggus.findInsertionIndex([1], 2, asc, compare)).toEqual(1);

        expect(biggus.findInsertionIndex([1,2,3], 1, asc, compare)).toEqual(0);
        expect(biggus.findInsertionIndex([1,2,3], 2, asc, compare)).toEqual(1);
        expect(biggus.findInsertionIndex([1,2,3], 3, asc, compare)).toEqual(2);

        expect(biggus.findInsertionIndex([1,4,3], 4, asc, compare)).toEqual(3);
        expect(biggus.findInsertionIndex([4,2,3], 4, asc, compare)).toEqual(3);

        expect(biggus.findInsertionIndex(["a","bb","ccc"], "a", asc, length)).toEqual(0);
        expect(biggus.findInsertionIndex(["a","bb","ccc"], "bb", asc, length)).toEqual(1);
        expect(biggus.findInsertionIndex(["a","bb","ccc"], "ccc", asc, length)).toEqual(2);

        expect(biggus.findInsertionIndex(["a","bb","cc"], "cc", asc, length)).toEqual(2);
        expect(biggus.findInsertionIndex(["a","b","ccc"], "b", asc, length)).toEqual(1);
        expect(biggus.findInsertionIndex(["a","bbb","ccc"], "bbb", asc, length)).toEqual(1);
        expect(biggus.findInsertionIndex(["aa","bb","ccc"], "aa", asc, length)).toEqual(0);

        expect(biggus.findInsertionIndex(["a","b","ccc"], "b", asc, length)).toEqual(1);

        expect(biggus.findInsertionIndex(["e","c","d","f"], "e", asc, length)).toEqual(3);
        expect(biggus.findInsertionIndex(["e","b","c","d"], "e", asc, length)).toEqual(4);
    });

    it("appends correctly", () =>
    {
        var source = new biggus.DataSource<string>(i => i);
        var sortView = new biggus.SortView<string>(source);
        var column = new biggus.TextColumn<string>({value: i => i});

        sortView.setSortColumn(column);

        sortView.changed.collect(events =>
        {
            source.add("B");
            source.add("D");
            source.add("F");
            source.add("C");
            source.add("E");
            source.add("A");

            expect(events.length).toEqual(6);

            for (var i = 0; i < events.length; i++)
            {
                expect(events[i].type).toEqual(biggus.CollectionChangeType.Insert);
                expect(events[i].itemId).toEqual(events[i].item);
            }

            expect(events[0].newIndex).toEqual(0); // B
            expect(events[1].newIndex).toEqual(1); // BD
            expect(events[2].newIndex).toEqual(2); // BDF
            expect(events[3].newIndex).toEqual(1); // BCDF
            expect(events[4].newIndex).toEqual(3); // BCDEF
            expect(events[5].newIndex).toEqual(0); // ABCDEF
        });
    });

    it("getAllItems returns sorted items", () =>
    {
        var source = new biggus.DataSource<string>(i => i);
        var sortView = new biggus.SortView<string>(source);
        var column = new biggus.TextColumn<string>({value: i => i});

        source.add("B");
        source.add("D");
        source.add("F");
        source.add("C");
        source.add("E");
        source.add("A");

        sortView.setSortColumn(column);

        expect(sortView.getAllItems()).toEqual(["A","B","C","D","E","F"]);
    });

    it("resets when column changed", () =>
    {
        var source = new biggus.DataSource<string>(i => i);
        var sortView = new biggus.SortView<string>(source);
        var column1 = new biggus.TextColumn<string>({value: i => i});
        var column2 = new biggus.TextColumn<string>({value: i => i});

        source.add("B");
        source.add("D");
        source.add("F");
        source.add("C");
        source.add("E");
        source.add("A");

        sortView.changed.collect(events =>
        {
            sortView.setSortColumn(column1);

            expect(events.length).toEqual(1);
            expect(events[0].type).toEqual(biggus.CollectionChangeType.Reset);

            sortView.setSortColumn(column2);

            expect(events.length).toEqual(2);
            expect(events[1].type).toEqual(biggus.CollectionChangeType.Reset);
        });
    });

    it("alternates sort direction when same column set", () =>
    {
        var source = new biggus.DataSource<string>(i => i);
        var sortView = new biggus.SortView<string>(source);
        var column = new biggus.TextColumn<string>({value: i => i});

        source.add("B");
        source.add("D");
        source.add("F");
        source.add("C");
        source.add("E");
        source.add("A");

        expect(sortView.getSortDirection()).toEqual(biggus.SortDirection.Ascending);

        sortView.setSortColumn(column);

        expect(sortView.getSortDirection()).toEqual(biggus.SortDirection.Ascending);

        sortView.setSortColumn(column);

        expect(sortView.getSortDirection()).toEqual(biggus.SortDirection.Descending);

        expect(sortView.getAllItems()).toEqual(["F","E","D","C","B","A"]);
    });
});
