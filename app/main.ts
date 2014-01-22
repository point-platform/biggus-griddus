/**
 * @author Drew Noakes
 * @date 22 Jan 2014
 */

import gridModule = require("grid");

var table = <HTMLTableElement>document.querySelector('table');
var spec = {
    columns: [
        {title:'instrument', field:'instrument'},
        {title:'iso2', className: 'iso2', field:'iso2'},
        {title:'side', className: 'side', field:'side'},
        {title:'quantity', field:'quantity'}
    ]
};

var grid = new gridModule.Grid(table, spec);

enum Side
{
    Buy,
    Sell
}

interface ITrade
{
    instrument: string;
    iso2: string;
    side: Side;
    quantity: number;
}

var trades: ITrade[] = [
    {instrument:'VOD LN', iso2:'GB', side: Side.Buy, quantity: 1234},
    {instrument:'IBM US', iso2:'US', side: Side.Sell, quantity: 12.56}
];

grid.addRows(trades);