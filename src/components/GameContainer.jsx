import React, { useEffect, useState } from 'react'
import { useReducer } from 'react'
import "./GameContainer.css"
import hunter from '../assets/img/hunter.jpg'
import woodcutter from '../assets/img/woodcutterc.jpg'
import farmer from '../assets/img/farmer.jpg'


const arrayOfBackGround = [hunter, woodcutter, farmer]

export default function GameContainer() {

    const easy = 4
    const mid = 8
    const hard = 12

    const [state, dispatch] = useReducer(reducer, null)

    const [gameStatus, setGameStatus] = useState({
        currentLives: 2,
        gameWon: false,
    })

    //initial grid state
    const [grid, setGrid] = useState([])

    function reducer(_, { type }) {
        switch (type) {
            case "EASY":
                return easy
            case "MID":
                return mid
            case "HARD":
                return hard
            default:
                return easy
        }
    }


    useEffect(() => {
        let arrayEmpty = []

        //generates N bombs based on difficuilt
        const generateBombs = () => {

            let bombContainer = []
            let nOfBombos = 0

            switch (state) {
                case easy:
                    nOfBombos = 3;
                    break;
                case mid:
                    nOfBombos = 10;
                    break;
                case hard:
                    nOfBombos = 18;
                    break;
                default:
                    nOfBombos = 0;
            }


            while (nOfBombos > 0) {

                //creates a column - row index
                const column = Math.floor(Math.random() * state)
                const row = Math.floor(Math.random() * state)

                //if index are already inside the container skip the current iteration, else push the index inside the container and decrease the counter
                if (bombContainer.some(element => element?.column === column && element?.row === row)) continue;
                bombContainer.push({ column, row })
                console.log(bombContainer)
                nOfBombos -= 1;

            }
            return bombContainer;
        }

        const activeBombContainer = generateBombs();


        const checkifHaveBomb = (column, row) => {
            return activeBombContainer.some(element => element.column === column && element.row === row)
        }

        //counter the bombs adjiacent to the current square
        const nOfBombNearby = (column, row) => {
            const [columnStart, columnend, rowStart, rowEnd] = obtainMinMaxCoordinates(column, row);

            let counter = 0
            for (let columnIndex = columnStart; columnIndex <= columnend; columnIndex++) {
                for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
                    if (!(column === columnIndex && row === rowIndex) && activeBombContainer.some(element => element.column === columnIndex && element.row === rowIndex)) {
                        counter = counter + 1;
                    }
                }
            }
            return counter
        }
        //create a grid where every single cell carrying all the necessary information 
        for (let columnIndex = 0; columnIndex < state; columnIndex++) {
            arrayEmpty.push([])
            for (let rowIndex = 0; rowIndex < state; rowIndex++) {
                arrayEmpty[columnIndex].push({
                    column: columnIndex,
                    row: rowIndex,
                    cellSpotted: false,
                    haveBomb: checkifHaveBomb(columnIndex, rowIndex),
                    bombNearby: nOfBombNearby(columnIndex, rowIndex),
                    flag: false,
                }
                )
            }
        }
        setGrid(arrayEmpty)

    }, [state])


    const arrayDifficuilt = [{
        action: "EASY",
        name: "Easy"
    }, {
        action: "MID",
        name: "Mid"
    }, {
        action: "HARD",
        name: "Hard"
    }]

    const obtainMinMaxCoordinates = (column, row) => {
        const columnStart = column <= 0 ? 0 : column - 1
        const columnend = column >= (state - 1) ? state - 1 : column + 1

        const rowStart = row <= 0 ? 0 : row - 1
        const rowEnd = row >= (state - 1) ? state - 1 : row + 1

        return [columnStart, columnend, rowStart, rowEnd]
    }

    //If counter of adjacent bombs is 0 reveal all adjacent cells. 
    //If one of this cells has adjacent bombs = 0, recall itself
    const updateAllCleanCells = (column, row, stateTmp) => {

        const [columnStart, columnend, rowStart, rowEnd] = obtainMinMaxCoordinates(column, row);

        if (stateTmp[column][row].bombNearby === 0) {
            for (let columnIndex = columnStart; columnIndex <= columnend; columnIndex++) {
                for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
                    if (stateTmp[columnIndex][rowIndex].cellSpotted === false) {
                        stateTmp[columnIndex][rowIndex].cellSpotted = true;
                        stateTmp[columnIndex][rowIndex].setFlag = false;
                        updateAllCleanCells(columnIndex, rowIndex, stateTmp)
                    } else
                        stateTmp[columnIndex][rowIndex].cellSpotted = true;
                    stateTmp[columnIndex][rowIndex].setFlag = false;
                }
            }
        }
    }

    const updateGrid = (column, row) => {
        let stateTmp = [...grid]
        stateTmp[column][row].cellSpotted = true;
        stateTmp[column][row].setFlag = false;
        if (stateTmp[column][row].haveBomb !== true) {
            updateAllCleanCells(column, row, stateTmp)
        }
        setGameStatus(prevState => ({
            currentLives: stateTmp[column][row].haveBomb === true ? prevState.currentLives - 1 : prevState.currentLives, gameWon: stateTmp.every(column => column.every(element => {
                return element.haveBomb === true || element.cellSpotted === true
            }))
        }))
        setGrid(stateTmp);


    }

    const setFlag = (column, row) => {
        let stateTmp = [...grid]
        if (stateTmp[column][row].cellSpotted === false) stateTmp[column][row].flag = !stateTmp[column][row].flag;
        setGrid(stateTmp);
    }


    const checkifGameisFinished = () => {
        return gameStatus.currentLives === 0 || gameStatus.gameWon === true
    }

    const endGameMessage = () => {
        if (gameStatus.gameWon) return <p>Complimenti, hai vinto!</p>
        return <p>Mi dispiace, hai perso!</p>
    }

    return (
        <div className='game-screen'>

            {state === null ? [...new Array(3).keys()].map(index =>
                <button key={index} className='difficuilt-button' style={{
                    backgroundImage: `url(${arrayOfBackGround[index]})`, backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }} onClick={() => {
                    dispatch({ type: arrayDifficuilt[index].action })
                }}>{arrayDifficuilt[index].name
                    }</button>) :
                <div className='game-container-screen'>
                    {checkifGameisFinished() ? endGameMessage() : <p>{`Tentativi rimasti: ${gameStatus.currentLives}`}</p>}
                    <div className='game-container'>
                        {grid.map((_, indexColumn) => {
                            return (<div key={indexColumn} className='column'>
                                {grid[indexColumn].map((element, indexRow) => {
                                    return (
                                        <div key={indexRow} onContextMenu={(e) => {
                                            e.preventDefault()
                                            if (!checkifGameisFinished())
                                                setFlag(indexColumn, indexRow)
                                        }} onClick={() => { if (!checkifGameisFinished()) updateGrid(indexColumn, indexRow) }} className={`game-cell ${element.flag ? "tmpFlag" : ""} ${element.haveBomb && element.cellSpotted ? "tmpBomb" : ""} ${element.cellSpotted === false && element.flag === false ? "house-bg" : ""}`}>{`${element.cellSpotted && !element.haveBomb ? element.bombNearby : ""}`}</div>
                                    )
                                })}
                            </div>
                            )
                        })}
                    </div>
                </div>}
        </div >
    )
}
