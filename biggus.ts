/**
 * @author Drew Noakes
 * @date 22 Jan 2014
 */

export interface IColumnSpecification
{
    title?: string;
    hideHeader?: boolean;
    className?: string;
    /** Either a property name to dereference, or a function that operates on the row's data object */
    field?: any;
}

export interface ITableSpecification<TRow>
{
    columns: IColumnSpecification[];
    rowDataId: (rowData: TRow) => string;
}

interface IRowModel<TRow>
{
    data: TRow;
    element: HTMLTableRowElement;
}

export class Grid<TRow>
{
    private headerGroup: HTMLTableSectionElement;
    private bodyGroup: HTMLTableSectionElement;
    private headerRow: HTMLTableRowElement;
    private rowModelById: {[s:string]: IRowModel<TRow> } = {};

    constructor(public table: HTMLTableElement, public spec: ITableSpecification<TRow>)
    {
        //
        // Create table sections
        //

        this.headerGroup = document.createElement('thead');
        this.bodyGroup = document.createElement('tbody');

        this.table.appendChild(this.headerGroup);
        this.table.appendChild(this.bodyGroup);

        //
        // Create header
        //

        this.headerRow = document.createElement('tr');
        this.headerGroup.appendChild(this.headerRow);

        for (var c = 0; c < this.spec.columns.length; c++)
        {
            var columnSpec = this.spec.columns[c];

            var columnHeader = document.createElement('th');

            if (columnSpec.title)
                columnHeader.textContent = columnSpec.title;
            if (columnSpec.className)
                columnHeader.className = columnSpec.className;

            this.headerRow.appendChild(columnHeader)
        }
    }

    public setRows(rows: TRow[])
    {
        for (var r = 0; r < rows.length; r++)
            this.setRow(rows[r]);
    }

    public setRow(rowData: TRow)
    {
        var rowId = this.spec.rowDataId(rowData);

        var rowModel = this.rowModelById[rowId];

        if (typeof(rowModel) !== "undefined")
        {
            // row previously known
            rowModel.data = rowData;

            var tr = rowModel.element;

            this.clearRow(tr);
            this.bindRow(rowModel);

            // Flash the row that changed
            tr.classList.add('highlight-delta');
            setTimeout(function() { tr.classList.remove('highlight-delta'); }, 100);
        }
        else
        {
            // row unknown
            var row = this.createRow();
            rowModel = {data: rowData, element: row};
            this.rowModelById[rowId] = rowModel;
            this.bindRow(rowModel);
            this.bodyGroup.appendChild(row);
        }
    }

    private createRow(): HTMLTableRowElement
    {
        var row = document.createElement('tr');
        for (var c = 0; c < this.spec.columns.length; c++)
            row.appendChild(document.createElement('td'))
        return row;
    }

    private bindRow(rowModel: IRowModel<TRow>)
    {
        for (var c = 0; c < this.spec.columns.length; c++)
        {
            var columnSpec = this.spec.columns[c];
            var cell = <HTMLTableCellElement>rowModel.element.children[c];

            if (columnSpec.className)
                cell.className = columnSpec.className;
            else
                cell.className = '';

            if (typeof(columnSpec.field) === 'string')
            {
                var str = rowModel.data[columnSpec.field];
                if (typeof(str) !== 'undefined')
                    cell.textContent = str;
            }
            else
            {
                console.assert(typeof(columnSpec.field) === 'function');

                var result = columnSpec.field(rowModel.data, columnSpec);

                if (result instanceof HTMLElement)
                    cell.appendChild(result);
                else if (typeof(result) !== 'undefined')
                    cell.textContent = result;
            }
        }
    }

    private clearRow(row: HTMLTableRowElement)
    {
        for (var c = 0; c < this.spec.columns.length; c++)
        {
            var cell = <HTMLTableCellElement>row.children[c];
            cell.className = null;
            cell.textContent = null;
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
        }
    }
}
