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
    getTitleText(): string;
    getHeaderClassName(): string;
    getCellClassName(row: TRow): string;
    getCellContent(row: TRow): any; // Node added as child, other values converted to string, undefined/null ignored
}

export interface IColumnOptions<TRow>
{
    /** Text to show in the column's header. */
    title?: string;
    /** A function that returns the CSS class name for the header (th) of the column. */
    thClassName?: string;
    /** A function that returns the CSS class name for all td elements in the column. */
    tdClassName?: (row:TRow)=>string;
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

    public getTitleText() { return this.options.title; }
    public getHeaderClassName() { return this.options.thClassName; }

    public getCellClassName(row?: TRow)
    {
        return this.options.tdClassName ? this.options.tdClassName(row) : undefined;
    }

    public getCellContent(row: TRow)
    {
        if (this.pathParts)
            return dereferencePath(row, this.pathParts);

        return this.options.value(row);
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

    public getTitleText() { return this.options.title; }
    public getHeaderClassName() { return this.options.thClassName; }

    public getCellClassName(row?: TRow)
    {
        return this.options.tdClassName ? this.options.tdClassName(row) : undefined;
    }

    public getCellContent(row: TRow)
    {
        var data = dereferencePath(row, this.pathParts);
        var img = new Image();
        var src = this.urlPrefix + data + this.urlSuffix;
        if (this.options.lowerCase)
            src = src.toLowerCase();
        img.src = src;
        return img;
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

            var titleText = column.getTitleText();
            if (titleText)
                th.textContent = titleText;

            var className = column.getHeaderClassName();
            if (className)
                th.className = className;

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

            var className = column.getCellClassName(rowModel.row);
            if (className)
                td.className = className;

            var cellContent = column.getCellContent(rowModel.row);

            if (cellContent == null)
                continue;

            if (cellContent instanceof Node)
            {
                td.appendChild(<Node>cellContent);
            }
            else
            {
                td.textContent = <string>cellContent;
            }
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
