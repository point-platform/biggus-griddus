/**
 * @author Drew Noakes
 * @date 22 Jan 2014
 */

export interface IColumnSpecification
{
    title: string;
    hideHeader?: boolean;
    className?: string;
    /** Either a property name to dereference, or a function that operates on the row's data object */
    field: any;
}

export interface ITableSpecification
{
    columns: IColumnSpecification[];
}

export class Grid
{
    private headerGroup: HTMLTableSectionElement;
    private bodyGroup: HTMLTableSectionElement;
    private headerRow: HTMLTableRowElement;

    constructor(public table: HTMLTableElement, public spec: ITableSpecification)
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

            if (columnSpec.hideHeader !== true)
                columnHeader.textContent = columnSpec.title;
            if (columnSpec.className)
                columnHeader.className = columnSpec.className;

            this.headerRow.appendChild(columnHeader)
        }
    }

    public addRows(rows: any[])
    {
        for (var r = 0; r < rows.length; r++)
        {
            var rowData = rows[r];
            var row = document.createElement('tr');

            for (var c = 0; c < this.spec.columns.length; c++)
            {
                var columnSpec = this.spec.columns[c];
                var cell = document.createElement('td');

                cell.textContent = rowData[columnSpec.field];

                row.appendChild(cell)
            }

            this.bodyGroup.appendChild(row);
        }
    }
}