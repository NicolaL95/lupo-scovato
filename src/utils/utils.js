export const obtainMinMaxCoordinates = (column, row,state) => {
    const columnStart = column <= 0 ? 0 : column - 1
    const columnend = column >= (state - 1) ? state - 1 : column + 1

    const rowStart = row <= 0 ? 0 : row - 1
    const rowEnd = row >= (state - 1) ? state - 1 : row + 1

    return [columnStart, columnend, rowStart, rowEnd]
}