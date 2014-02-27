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
    styleHeader(th: HTMLTableHeaderCellElement);
    /** Populate and style a column cell element. */
    styleCell(td: HTMLTableCellElement, row: TRow);
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

export class TextColumn<TRow> implements IColumn<TRow>
{
    private pathParts: string[];

    constructor(private options: ITextColumnOptions<TRow>)
    {
        if (!options.path == !options.value)
            throw new Error("Must provide one of path or value properties.");

        if (options.path)
            this.pathParts = options.path.split('.');
    }

    public styleHeader(th: HTMLTableHeaderCellElement)
    {
        if (this.options.title)
            th.textContent = this.options.title;

        if (this.options.className)
            th.className = this.options.className;

        if (this.options.thStyle)
            this.options.thStyle(th);
    }

    public styleCell(td: HTMLTableCellElement, row?: TRow)
    {
        if (this.options.className)
            td.className = this.options.className;

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

        if (this.options.tdStyle)
            this.options.tdStyle(td, row);
    }
}

export interface IImageColumnOptions<TRow> extends IColumnOptions<TRow>
{
    /** A dot-separated path to the value on the row object. */
    url?: string;
    lowerCase?: boolean;
}

var imagePathRegExp = new RegExp('^(.*)\\{(.*)\\}(.*)$');

export class ImageColumn<TRow> implements IColumn<TRow>
{
    private pathParts: string[];
    private urlPrefix: string;
    private urlSuffix: string;

    constructor(private options: IImageColumnOptions<TRow>)
    {
        if (!options.url)
            throw new Error("Must provide a url.");

        var groups = imagePathRegExp.exec(options.url);
        this.urlPrefix = groups[1];
        this.pathParts = groups[2].split('.');
        this.urlSuffix = groups[3];
    }

    public styleHeader(th: HTMLTableHeaderCellElement)
    {
        if (this.options.title)
            th.textContent = this.options.title;

        if (this.options.className)
            th.className = this.options.className;

        if (this.options.thStyle)
            this.options.thStyle(th);
    }

    public styleCell(td: HTMLTableCellElement, row?: TRow)
    {
        if (this.options.className)
            td.className = this.options.className;

        var data = dereferencePath(row, this.pathParts);
        var img = new Image();
        var src = this.urlPrefix + data + this.urlSuffix;
        if (this.options.lowerCase)
            src = src.toLowerCase();
        img.src = src;
        td.appendChild(img);

        if (this.options.tdStyle)
            this.options.tdStyle(td, row);
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
