/**
 * @author Drew Noakes https://drewnoakes.com
 */

/// <reference path="./jasmine.d.ts" />

import biggus = require('../biggus');

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
});
