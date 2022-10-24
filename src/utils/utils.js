export const obtainMinMaxCoordinates = (row, column,state) => {
    const rowStart = row <= 0 ? 0 : row - 1
    const rowEnd = row >= (state - 1) ? state - 1 : row + 1

    const columnStart = column <= 0 ? 0 : column - 1
    const columnEnd = column >= (state - 1) ? state - 1 : column + 1

    return [rowStart, rowEnd, columnStart, columnEnd]
}