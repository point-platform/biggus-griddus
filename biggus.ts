/**
 * @author Drew Noakes https://drewnoakes.com
 */

function dereferencePath(obj: Object, pathParts: string[]): any
{
    var i = 0;
    while (obj && i < pathParts.length)
        obj = obj[pathParts[i++]];
    return obj;
}

function toFixedFix(n: number, prec: number): number
{
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    var k = Math.pow(10, prec);
    return Math.round(n * k) / k;
}

function formatNumber(num: number, decimals: number)
{
    var n = !isFinite(+num) ? 0 : +num,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        s = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split('.');

    if (s[0].length > 3)
    {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
    }

    if ((s[1] || '').length < prec)
    {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }

    return s.join('.');
}

export interface IColumn<TRow>
{
    /** Populate and style the column's header element. */
    styleHeader(th: HTMLTableHeaderCellElement): void;
    /** Populate and style a column cell element. */
    styleCell(td: HTMLTableCellElement, row: TRow): void;
    /** Indicates whether this column may be sorted using getSortValue. */
    isSortable: boolean;
    /** Returns a value for a given row that can be used when sorting this column. */
    getSortValue(row: TRow): any;
}

export interface IColumnOptions<TRow>
{
    /** Text to show in the column's header. */
    title?: string;
    /** A CSS class name to apply to all th/td elements in the column. */
    className?: string;
    /** A function that styles the header (th) of the column. */
    thStyle?: (th: HTMLTableHeaderCellElement)=>void;
    /** A function that styles the data cells (td) of the column. */
    tdStyle?: (td: HTMLTableCellElement, row: TRow)=>void;
}

export interface ITextColumnOptions<TRow> extends IColumnOptions<TRow>
{
    /** A dot-separated path to the value on the row object. */
    path?: string;
    /** A function that returns the text to display for this column/row. */
    value?: (row: TRow)=>any;
}

export class ColumnBase<TRow> implements IColumn<TRow>
{
    public isSortable: boolean;

    constructor(private optionsBase: IColumnOptions<TRow>)
    {
        this.isSortable = true;
    }

    public styleHeader(th: HTMLTableHeaderCellElement)
    {
        if (this.optionsBase.title)
            th.textContent = this.optionsBase.title;

        if (this.optionsBase.className)
            th.className = this.optionsBase.className;

        if (this.optionsBase.thStyle)
            this.optionsBase.thStyle(th);
    }

    /**
     * Sets the class name (if specified) and calls the styling callback (if specified.)
     * Subclasses should set text content or add child nodes as required, then call this base implementation.
     */
    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        if (this.optionsBase.className)
            td.className = this.optionsBase.className;

        if (this.optionsBase.tdStyle)
            this.optionsBase.tdStyle(td, row);
    }

    public getSortValue(row: TRow): any { return 0; }
}

export class TextColumn<TRow> extends ColumnBase<TRow>
{
    public pathParts: string[];

    constructor(private options: ITextColumnOptions<TRow>)
    {
        super(options);

        if (!options.path == !options.value)
            throw new Error("Must provide one of path or value properties.");

        if (options.path)
            this.pathParts = options.path.split('.');
    }

    public getText(row: TRow): string
    {
        if (this.pathParts)
        {
            var value = dereferencePath(row, this.pathParts);
            if (value != null)
                return value.toString();
        }
        else
        {
            console.assert(!!this.options.value);
            return this.options.value(row).toString();
        }
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        var text = this.getText(row);

        if (text != null)
            td.textContent = text;

        super.styleCell(td, row);
    }

    public getSortValue(row: TRow): any
    {
        return this.pathParts
            ? dereferencePath(row, this.pathParts)
            : this.options.value(row);
    }
}

/** A column that presents its contents in a solid tile positioned within the cell and not necessarily flush to its edges. */
export class TextTileColumn<TRow> extends TextColumn<TRow>
{
    constructor(options: ITextColumnOptions<TRow>)
    {
        super(options);
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        super.styleCell(td, row);

        var text = td.textContent;

        td.textContent = null;

        var div = document.createElement('div');
        div.textContent = text;
        div.className = 'tile';
        td.appendChild(div);
    }
}

export interface INumericColumnOptions<TRow> extends IColumnOptions<TRow>
{
    /** A dot-separated path to the value on the row object. */
    path?: string;
    /** A function that returns the text to display for this column/row. */
    value?: (row: TRow)=>number;
    /** The number of decimal places after the zero to display. */
    precision?: number;
    /** Whether to hide zero valued cells. Default to false. */
    hideZero?: boolean;
    /** Whether to hide NaN valued cells. Default to false. */
    hideNaN?: boolean;
}

export class NumericColumn<TRow> extends TextColumn<TRow>
{
    constructor(private numericOptions: INumericColumnOptions<TRow>)
    {
        super(numericOptions);
        if (this.numericOptions.precision == null) this.numericOptions.precision = 0;
        if (this.numericOptions.hideZero == null) this.numericOptions.hideZero = false;
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        super.styleCell(td, row);
        td.classList.add('numeric');
    }

    public styleHeader(th: HTMLTableHeaderCellElement)
    {
        super.styleHeader(th);
        th.classList.add('numeric');
    }

    public getText(row: TRow): string
    {
        var value = this.pathParts
            ? dereferencePath(row, this.pathParts)
            : this.numericOptions.value(row);

        if (value == null)
            return '';

        console.assert(typeof(value) === 'number');

        if (value === 0 && this.numericOptions.hideZero)
            return '';

        if (isNaN(value) && this.numericOptions.hideNaN)
            return '';

        return formatNumber(value, this.numericOptions.precision);
    }
}

export interface IImageColumnOptions<TRow> extends IColumnOptions<TRow>
{
    /** A dot-separated path to the value on the row object. */
    url?: string;
    lowerCase?: boolean;
    /** Indicates whether this column may be sorted. Defaults to false. */
    isSortable?: boolean;
}

var imagePathRegExp = new RegExp('^(.*)\\{(.*)\\}(.*)$');

export class ImageColumn<TRow> extends ColumnBase<TRow>
{
    private pathParts: string[];
    private urlPrefix: string;
    private urlSuffix: string;

    constructor(private options: IImageColumnOptions<TRow>)
    {
        super(options);

        this.isSortable = !!options.isSortable;

        if (!options.url)
            throw new Error("Must provide a url.");

        var groups = imagePathRegExp.exec(options.url);
        this.urlPrefix = groups[1];
        this.pathParts = groups[2].split('.');
        this.urlSuffix = groups[3];
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        var data = dereferencePath(row, this.pathParts);
        if (data)
        {
            var img = new Image();
            var src = this.urlPrefix + data + this.urlSuffix;
            if (this.options.lowerCase)
                src = src.toLowerCase();
            img.src = src;
            td.appendChild(img);
        }

        super.styleCell(td, row);
    }
}

export interface IBarChartColumnOptions<TRow> extends IColumnOptions<TRow>
{
    ratio: (row: TRow)=>number;
    color: (ratio: number)=>string;
}

export class BarChartColumn<TRow> extends ColumnBase<TRow>
{
    constructor(private options: IBarChartColumnOptions<TRow>)
    {
        super(options);
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        var ratio = this.options.ratio(row);

        var bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.width = (100* ratio) + '%';
        bar.style.backgroundColor = this.options.color(ratio);
        td.appendChild(bar);

        super.styleCell(td, row);
    }

    public getSortValue(row: TRow): any { return this.options.ratio(row); }
}

export enum ActionPresentationType
{
    Hyperlink,
    Button
}

export interface IActionColumnOptions<TRow> extends IColumnOptions<TRow>
{
    text: string;
    action: (row: TRow)=>void;
    type?: ActionPresentationType;
    /** Indicates whether this column may be sorted. Defaults to false. */
    isSortable?: boolean;
}

export class ActionColumn<TRow> extends ColumnBase<TRow>
{
    constructor(private options: IActionColumnOptions<TRow>)
    {
        super(options);

        this.isSortable = !!options.isSortable;
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        if (this.options.type === ActionPresentationType.Button)
        {
            var button = document.createElement('button');
            button.className = 'action';
            button.textContent = this.options.text;
            button.addEventListener('click', e => { e.preventDefault(); this.options.action(row); });
            td.appendChild(button);
        }
        else
        {
            var a = document.createElement('a');
            a.className = 'action';
            a.href = '#';
            a.textContent = this.options.text;
            a.addEventListener('click', e => { e.preventDefault(); this.options.action(row); });
            td.appendChild(a);
        }

        super.styleCell(td, row);
    }
}

export interface IGridOptions<TRow>
{
    columns: IColumn<TRow>[];
    rowDataId: (rowData: TRow) => string;
    rowClassName?: (rowData: TRow) => string;
}

interface IRowModel<TRow>
{
    row: TRow;
    tr: HTMLTableRowElement;
}

export class Event<T>
{
    private callbacks: {(item:T):void}[] = [];

    public subscribe(callback: (item: T)=>void): ()=>void
    {
        this.callbacks.push(callback);

        return () =>
        {
            var index = this.callbacks.indexOf(callback);
            if (index === -1)
                console.warn("Attempt to unsubscribe unknown subscriber");
            else
                this.callbacks.splice(index, 1);
        };
    }

    public raise(item: T)
    {
        for (var i = 0; i < this.callbacks.length; i++)
            this.callbacks[i](item);
    }
}

export function clearChildren(el: Element)
{
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

export enum SortDirection
{
    Ascending,
    Descending
}

export interface INotifyChange<T>
{
    subscribeChange(callback: (item:T)=>void): ()=>void;
    notifyChange(): void;
}

class NotifyChange
{
    private callbacks: {(item:any):void}[];

    public subscribeChange(callback: (item:any)=>void): ()=>void
    {
        if (!this.callbacks)
            this.callbacks = [];
        this.callbacks.push(callback);
        return () =>
        {
            var index = this.callbacks.indexOf(callback);
            if (index === -1)
                console.warn("Attempt to unsubscribe unknown subscriber");
            else
                this.callbacks.splice(index, 1);
        };
    }

    public notifyChange(): void
    {
        if (this.callbacks)
        {
            for (var i = 0; i < this.callbacks.length; i++)
                this.callbacks[i](this);
        }
    }
}

var notifyChangePrototype = Object.create(NotifyChange.prototype);

export function mixinNotifyChange(obj: any)
{
    obj.__proto__ = notifyChangePrototype;
}

export enum CollectionChangeType
{
    Insert,
    Update,
    Remove,
    Move
}

export class CollectionChange<T>
{
    public type: CollectionChangeType;
    public item: T;
    public newIndex: number;
    public oldIndex: number;

    public static insert<U>(item: U, index: number): CollectionChange<U>
    {
        var chg = new CollectionChange<U>();
        chg.type = CollectionChangeType.Insert;
        chg.item = item;
        chg.newIndex = index;
        chg.oldIndex = -1;
        return chg;
    }

    public static remove<U>(item: U, index: number): CollectionChange<U>
    {
        var chg = new CollectionChange<U>();
        chg.type = CollectionChangeType.Remove;
        chg.item = item;
        chg.newIndex = -1;
        chg.oldIndex = index;
        return chg;
    }

    public static update<U>(item: U, index: number): CollectionChange<U>
    {
        var chg = new CollectionChange<U>();
        chg.type = CollectionChangeType.Update;
        chg.item = item;
        chg.newIndex = index;
        chg.oldIndex = -1;
        return chg;
    }

    public static move<U>(item: U, newIndex: number, oldIndex: number): CollectionChange<U>
    {
        var chg = new CollectionChange<U>();
        chg.type = CollectionChangeType.Move;
        chg.item = item;
        chg.newIndex = newIndex;
        chg.oldIndex = oldIndex;
        return chg;
    }
}

export interface IObservableCollection<T>
{
    changed: Event<CollectionChange<T>>;
}

export interface IDataSource<T> extends IObservableCollection<T>
{
    getAllItems(): T[];
}

/**
 * A basic, observable, append-only data source.
 */
export class DataSource<T> implements IDataSource<T>
{
    public changed: Event<CollectionChange<T>> = new Event<CollectionChange<T>>();

    private items: T[] = [];

    constructor(items?: T[])
    {
        for (var i = 0; items && i < items.length; i++) {
            this.add(items[i]);
        }
    }

    public add(item: T)
    {
        var notifyItem: INotifyChange<T> = <any>item;
        if (notifyItem.subscribeChange && typeof(notifyItem.subscribeChange) === 'function') {
            notifyItem.subscribeChange(changedItem => {
                // TODO is this O(N) scan a problem?
                var index = this.items.indexOf(changedItem);
                this.changed.raise(CollectionChange.update(changedItem, index));
            });
        }
        this.items.push(item);
        var change: CollectionChange<T> = CollectionChange.insert(item, this.items.length - 1);
        this.changed.raise(change);
    }

    public get(index: number)
    {
        return this.items[index];
    }

    getAllItems(): T[]
    {
        return this.items;
    }
}

class FilterView<T> implements IObservableCollection<T>
{
    public changed: Event<CollectionChange<T>>;

    private items: T[] = [];

    constructor(private source: IObservableCollection<T>,
                private condition: (item: T)=>boolean)
    {
        source.changed.subscribe(this.onSourceChanged);
    }

    private onSourceChanged(event: CollectionChange<T>)
    {
        var passesFilter = this.condition(event.item);

        switch (event.type)
        {
            case CollectionChangeType.Insert:
            {
                if (!passesFilter)
                    return;
                this.items.push(event.item);
                this.changed.raise(CollectionChange.insert(event.item, this.items.length - 1));
                break;
            }
            case CollectionChangeType.Remove:
            {
                if (!passesFilter)
                    return;
                break;
            }
            case CollectionChangeType.Move:
            {
                console.error("Move not supported");
                debugger;
            }
        }
    }
}

export class Grid<TRow>
{
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private headerRow: HTMLTableRowElement;
    private rowModelById: {[s:string]: IRowModel<TRow> } = {};
    private sortColumn: IColumn<TRow>;
    private sortDirection: SortDirection = SortDirection.Ascending;

    constructor(private source: IDataSource<TRow>, public table: HTMLTableElement, public options: IGridOptions<TRow>)
    {
        //
        // Create table sections
        //

        this.thead = document.createElement('thead');
        this.tbody = document.createElement('tbody');

        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);

        //
        // Create header row
        //

        this.headerRow = document.createElement('tr');
        this.thead.appendChild(this.headerRow);

        var initialiseColumn = (column: IColumn<TRow>) =>
        {
            var th = document.createElement('th');

            column.styleHeader(th);

            if (column.isSortable)
            {
                th.classList.add('sortable');

                th.addEventListener('click', () =>
                {
                    // Clear any other sort hints
                    var headers = this.thead.querySelectorAll('th');
                    for (var i = 0; i < headers.length; i++)
                    {
                        var header = <HTMLTableHeaderCellElement>headers[i];
                        header.classList.remove('sort-ascending');
                        header.classList.remove('sort-descending');
                    }

                    // Determine the direction. Multiple clicks toggle the direction.
                    var direction = SortDirection.Ascending;
                    if (this.sortColumn === column && this.sortDirection === SortDirection.Ascending)
                        direction = SortDirection.Descending;

                    //this.sortByColumn(column, direction);

                    th.classList.add(direction === SortDirection.Ascending ? 'sort-descending' : 'sort-ascending');
                });
            }

            this.headerRow.appendChild(th);
        };

        for (var c = 0; c < this.options.columns.length; c++)
            initialiseColumn(this.options.columns[c]);

        this.source.changed.subscribe(this.onSourceChanged.bind(this));

        var items = this.source.getAllItems();
        for (var i = 0; i < items.length; i++)
            this.insertRow(items[i]);
    }

    private onSourceChanged(event: CollectionChange<TRow>): void
    {
        switch (event.type)
        {
            case CollectionChangeType.Insert:
            {
                this.insertRow(event.item);
                break;
            }
            case CollectionChangeType.Remove:
            {
                // TODO
                break;
            }
            case CollectionChangeType.Move:
            {
                // TODO
                break;
            }
            case CollectionChangeType.Update:
            {
                this.updateRow(event.item);
                break;
            }
        }
    }

    private insertRow(item)
    {
        var rowId = this.options.rowDataId(item);
        console.assert(typeof(this.rowModelById[rowId]) === 'undefined', "Inserted row should not have a row model");
        var tr = this.createRow();
        var rowModel = {row: item, tr: tr};
        this.rowModelById[rowId] = rowModel;
        this.bindRow(rowModel);
        this.tbody.appendChild(tr);
    }

    private updateRow(item: TRow)
    {
        var rowId = this.options.rowDataId(item);
        var rowModel = this.rowModelById[rowId];
        console.assert(typeof(rowModel) !== "undefined", "Updated row should have a row model");
        this.clearRow(rowModel.tr);
        this.bindRow(rowModel);
        this.flashRow(rowModel.tr);
    }

    ///** Insert or update the provided row in the table. */
    //private setRow(row: TRow): void
    //{
    //    var rowId = this.options.rowDataId(row);
    //
    //    var rowModel = this.rowModelById[rowId];
    //
    //    if (typeof(rowModel) !== "undefined")
    //    {
    //        // row previously known
    //        rowModel.row = row;
    //
    //        var tr = rowModel.tr;
    //
    //        this.clearRow(tr);
    //        this.bindRow(rowModel);
    //        this.flashRow(tr);
    //    }
    //    else
    //    {
    //        // row unknown
    //        var tr = this.createRow();
    //        rowModel = {row: row, tr: tr};
    //        this.rowModelById[rowId] = rowModel;
    //        this.bindRow(rowModel);
    //        this.tbody.appendChild(tr);
    //
    //        var notifyRow = (<INotifyChange<TRow>><any>row);
    //
    //        if (notifyRow.subscribeChange)
    //        {
    //            notifyRow.subscribeChange(_ =>
    //            {
    //                this.clearRow(tr);
    //                this.bindRow(rowModel)
    //            });
    //        }
    //    }
    //}

    private flashRow(tr: HTMLTableRowElement)
    {
        // Flash the row that changed
        // TODO only queue this timer if the row is visible (once we model this)
        tr.classList.add('highlight-delta');
        setTimeout(function ()
        {
            tr.classList.remove('highlight-delta');
        }, 100);
    }

    /** Create a new tr element with the correct number of td children. */
    private createRow(): HTMLTableRowElement
    {
        var tr = document.createElement('tr');
        for (var c = 0; c < this.options.columns.length; c++)
            tr.appendChild(document.createElement('td'))
        return tr;
    }

    /** Populate the tr/td elements from the row. */
    private bindRow(rowModel: IRowModel<TRow>): void
    {
        for (var c = 0; c < this.options.columns.length; c++)
        {
            var column = this.options.columns[c];
            var td = <HTMLTableCellElement>rowModel.tr.children[c];

            column.styleCell(td, rowModel.row);
        }

        if (this.options.rowClassName)
            rowModel.tr.className = this.options.rowClassName(rowModel.row);
    }

    /** Clears all state from a tr element and all child td elements. */
    private clearRow(tr: HTMLTableRowElement): void
    {
        tr.className = null;

        for (var c = 0; c < this.options.columns.length; c++)
        {
            var td = <HTMLTableCellElement>tr.children[c];
            td.removeAttribute("class");
            td.textContent = null;
            while (td.firstChild) {
                td.removeChild(td.firstChild);
            }
        }
    }

    //public sortByColumn(column: IColumn<TRow>, direction: SortDirection): void
    //{
    //    this.sortColumn = column;
    //    this.sortDirection = direction;
    //
    //    clearChildren(this.tbody);
    //
    //    var models: IRowModel<TRow>[] = [];
    //
    //    for (var id in this.rowModelById)
    //        models.push(this.rowModelById[id]);
    //
    //    var dir = direction === SortDirection.Ascending ? 1 : -1;
    //
    //    models.sort((a, b) =>
    //    {
    //        var v1 = column.getSortValue(a.row);
    //        var v2 = column.getSortValue(b.row);
    //        return dir * (v1 < v2 ? -1 : v1 === v2 ? 0 : 1);
    //    });
    //
    //    for (var i = 0; i < models.length; i++)
    //        this.tbody.appendChild(models[i].tr);
    //}
}
