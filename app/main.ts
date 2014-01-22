/**
 * @author Drew Noakes
 * @date 22 Jan 2014
 */

//
// Domain model
//

enum Side
{
    Buy,
    Sell
}

interface ITrade
{
    id: number;
    instrument: string;
    iso2: string;
    side: Side;
    quantity: number;
    filledQuantity: number;
}

var trades: ITrade[] = [
    {id:1, instrument:'VOD LN', iso2:'GB', side: Side.Buy, quantity: 1234, filledQuantity:800},
    {id:2, instrument:'IBM US', iso2:'US', side: Side.Sell, quantity: 12.56, filledQuantity: 3.2}
];

//
// Grid construction
//

import gridModule = require("grid");

var table = <HTMLTableElement>document.querySelector('table');

var flagColumn = (trade: ITrade) => {
    var img = document.createElement('img');
    img.src = 'img/flags/' + trade.iso2.toLowerCase() + '.png';
    return img;
};

var filledPercentageColumn = (trade: ITrade) => {
    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = (100*trade.filledQuantity/trade.quantity) + '%';
    return bar;
};

var sideColumn = (trade: ITrade) => trade.side == Side.Buy ? "BUY" : "SELL";

var columnSpecs: gridModule.IColumnSpecification[] = [
    {title:'ID', field:'id'},
    {className: 'iso2', field:flagColumn},
    {title:'Instrument', field:'instrument'},
    {title:'Side', className: 'side', field:sideColumn},
    {title:'Quantity', field:'quantity'},
    {title:'Filled', field:'filledQuantity'},
    {title:'% Filled', className:'fill-bar', field:filledPercentageColumn}
];

var grid = new gridModule.Grid(table, {columns: columnSpecs, rowDataId:(trade: ITrade) => trade.id.toString()});

grid.addRows(trades);

setInterval(() => {
    grid.update({id:1, instrument:'VOD LN', iso2:'GB', side: Side.Buy, quantity: 1234, filledQuantity:Math.round(Math.random() * 1234)});
    grid.update({id:2, instrument:'IBM US', iso2:'US', side: Side.Sell, quantity: 14, filledQuantity:Math.round(Math.random() * 12.56)});
}, 20);
