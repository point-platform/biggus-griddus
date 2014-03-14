/**
 * @author Drew Noakes
 * @date 22 Jan 2014
 */

function dereferencePath(obj: Object, pathParts: string[])
{
    var i = 0;
    while (obj && i < pathParts.length)
        obj = obj[pathParts[i++]];
    return obj;
}

export interface IColumn<TRow>
{
    /** Populate and style the column's header element. */
    styleHeader(th: HTMLTableHeaderCellElement): void;
    /** Populate and style a column cell element. */
    styleCell(td: HTMLTableCellElement, row: TRow): void;
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
    value?: (row: TRow)=>string;
}

export class ColumnBase<TRow> implements IColumn<TRow>
{
    constructor(private optionsBase: IColumnOptions<TRow>)
    {}

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
}

export class TextColumn<TRow> extends ColumnBase<TRow>
{
    private pathParts: string[];

    constructor(private options: ITextColumnOptions<TRow>)
    {
        super(options);

        if (!options.path == !options.value)
            throw new Error("Must provide one of path or value properties.");

        if (options.path)
            this.pathParts = options.path.split('.');
    }

    public styleCell(td: HTMLTableCellElement, row: TRow)
    {
        if (this.pathParts)
        {
            var value = dereferencePath(row, this.pathParts);
            if (value != null)
                td.textContent = value.toString();
        }
        else
        {
            console.assert(!!this.options.value);
            td.textContent = this.options.value(row);
        }

        super.styleCell(td, row);
    }
}

export interface IImageColumnOptions<TRow> extends IColumnOptions<TRow>
{
    /** A dot-separated path to the value on the row object. */
    url?: string;
    lowerCase?: boolean;
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
}

export class ActionColumn<TRow> extends ColumnBase<TRow>
{
    constructor(private options: IActionColumnOptions<TRow>)
    {
        super(options);
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

export class Grid<TRow>
{
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private headerRow: HTMLTableRowElement;
    private rowModelById: {[s:string]: IRowModel<TRow> } = {};

    constructor(public table: HTMLTableElement, public options: IGridOptions<TRow>)
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

        for (var c = 0; c < this.options.columns.length; c++)
        {
            var column = this.options.columns[c];
            var th = document.createElement('th');

            column.styleHeader(th);

            this.headerRow.appendChild(th)
        }
    }

    /** Insert or update the provided rows in the table. */
    public setRows(rows: TRow[])
    {
        for (var r = 0; r < rows.length; r++)
            this.setRow(rows[r]);
    }

    /** Insert or update the provided row in the table. */
    public setRow(row: TRow)
    {
        var rowId = this.options.rowDataId(row);

        var rowModel = this.rowModelById[rowId];

        if (typeof(rowModel) !== "undefined")
        {
            // row previously known
            rowModel.row = row;

            var tr = rowModel.tr;

            this.clearRow(tr);
            this.bindRow(rowModel);

            // Flash the row that changed
            tr.classList.add('highlight-delta');
            setTimeout(function() { tr.classList.remove('highlight-delta'); }, 100);
        }
        else
        {
            // row unknown
            var tr = this.createRow();
            rowModel = {row: row, tr: tr};
            this.rowModelById[rowId] = rowModel;
            this.bindRow(rowModel);
            this.tbody.appendChild(tr);
        }
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
    private bindRow(rowModel: IRowModel<TRow>)
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
    private clearRow(tr: HTMLTableRowElement)
    {
        tr.className = null;

        for (var c = 0; c < this.options.columns.length; c++)
        {
            var td = <HTMLTableCellElement>tr.children[c];
            td.className = null;
            td.textContent = null;
            while (td.firstChild) {
                td.removeChild(td.firstChild);
            }
        }
    }
}
