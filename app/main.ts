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

var instruments = [
    {name: 'VOD LN', iso2: 'GB'},
    {name: 'IBM US', iso2: 'US'},
    {name: 'RIO AU', iso2: 'AU'},
    {name: 'BER DE', iso2: 'DE'},
    {name: 'PHIL NL', iso2: 'NL'},
    {name: 'CURR IN', iso2: 'IN'}
];

var trades: ITrade[] = [];

for (var t = 1; t < 400; t++)
{
    var instrument = instruments[Math.floor(Math.random()*instruments.length)];
    trades.push({
        id: t,
        instrument: instrument.name,
        iso2: instrument.iso2,
        side: Math.random() > 0.5 ? Side.Buy : Side.Sell,
        quantity: Math.round(Math.random() * 1000 + 100),
        filledQuantity: 0
    });
}

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
    bar.style.backgroundColor = 'hsl(' + (360 * trade.filledQuantity / trade.quantity) + ',100%,50%)';
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

var grid = new gridModule.Grid<ITrade>(table, {columns: columnSpecs, rowDataId:(trade: ITrade) => trade.id.toString()});

grid.addRows(trades);

setInterval(() => {
    var trade = trades[Math.floor(Math.random()*trades.length)];
    trade.filledQuantity = Math.floor((trade.filledQuantity + Math.random()*50) % trade.quantity);
    grid.update(trade.id.toString());
}, 5);
