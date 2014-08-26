/**
 * @author Drew Noakes https://drewnoakes.com
 */

import biggus = require("./biggus");

var compare = (a, b) => a === b ? 0 : a < b ? -1 : 1;
var length = (a: string, b:string) => a.length === b.length
    ? compare(a, b)
    : compare(a.length, b.length);

function assertEqual<T>(expected: T, actual: T)
{
    if (expected !== actual)
    {
        console.error("Expected " + expected + " but got " + actual);
        //throw new Error();
    }
    else
    {
        console.info("Expected " + expected);
    }
}

assertEqual(0, biggus.findInsertionIndex([],  1, biggus.SortDirection.Ascending, compare));
assertEqual(0, biggus.findInsertionIndex([2], 1, biggus.SortDirection.Ascending, compare));
assertEqual(1, biggus.findInsertionIndex([1], 2, biggus.SortDirection.Ascending, compare));

assertEqual(0, biggus.findInsertionIndex([1,2,3], 1, biggus.SortDirection.Ascending, compare));
assertEqual(1, biggus.findInsertionIndex([1,2,3], 2, biggus.SortDirection.Ascending, compare));
assertEqual(2, biggus.findInsertionIndex([1,2,3], 3, biggus.SortDirection.Ascending, compare));

assertEqual(3, biggus.findInsertionIndex([1,4,3], 4, biggus.SortDirection.Ascending, compare));
assertEqual(3, biggus.findInsertionIndex([4,2,3], 4, biggus.SortDirection.Ascending, compare));

assertEqual(0, biggus.findInsertionIndex(["a","bb","ccc"], "a", biggus.SortDirection.Ascending, length));
assertEqual(1, biggus.findInsertionIndex(["a","bb","ccc"], "bb", biggus.SortDirection.Ascending, length));
assertEqual(2, biggus.findInsertionIndex(["a","bb","ccc"], "ccc", biggus.SortDirection.Ascending, length));

assertEqual(2, biggus.findInsertionIndex(["a","bb","cc"], "cc", biggus.SortDirection.Ascending, length));
assertEqual(1, biggus.findInsertionIndex(["a","b","ccc"], "b", biggus.SortDirection.Ascending, length));
assertEqual(1, biggus.findInsertionIndex(["a","bbb","ccc"], "bbb", biggus.SortDirection.Ascending, length));
assertEqual(0, biggus.findInsertionIndex(["aa","bb","ccc"], "aa", biggus.SortDirection.Ascending, length));

assertEqual(1, biggus.findInsertionIndex(["a","b","ccc"], "b", biggus.SortDirection.Ascending, length));

assertEqual(3, biggus.findInsertionIndex(["e","c","d","f"], "e", biggus.SortDirection.Ascending, length));
assertEqual(4, biggus.findInsertionIndex(["e","b","c","d"], "e", biggus.SortDirection.Ascending, length));
