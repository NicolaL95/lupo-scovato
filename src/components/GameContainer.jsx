
import React, { useEffect, useState } from 'react'
import { useReducer } from 'react'
import "./GameContainer.css"
import { useRef } from 'react'
import { useMediaQuery } from 'react-responsive';
import { useMemo } from 'react'
import { obtainMinMaxCoordinates } from '../utils/utils.js'
import DifficuiltButton from './UI/DifficuiltButton'

let setNewTimeLine = false;

const initialStateGameStatus = {
    currentLives: 2,
    gameWon: false,
}

const EASY = 4
const MID = 8
const HARD = 12

const arrayDifficuilt = [{
    action: "EASY",
    name: "Easy",
}, {
    action: "MID",
    name: "Normal"
}, {
    action: "HARD",
    name: "Hard"
}]

export default function GameContainer() {

   
    const refPreviousGrid = useRef([]);
    const [state, dispatch] = useReducer(reducer, null)
    const [gameStatus, setGameStatus] = useState(initialStateGameStatus)
    const [flagButton, setFlagButton] = useState(false)

    //initial grid state
    const [grid, setGrid] = useState([])


    const isMobile = useMediaQuery({ query: `(max-width: 760px)` });

    function reducer(_, { type }) {
        switch (type) {
            case "EASY":
                return EASY
            case "MID":
                return MID
            case "HARD":
                return HARD
            case "RESET":
                return null

            default:
                return EASY
        }
    }

    useEffect(() => {
        let arrayEmpty = []
        //generates N bombs based on difficuilt
        const generateBombs = (() => {

            let bombContainer = []
            let nOfBombs = 0

            switch (state) {
                case EASY:
                    nOfBombs = 3;
                    break;
                case MID:
                    nOfBombs = 10;
                    break;
                case HARD:
                    nOfBombs = 18;
                    break;
                default:
                    nOfBombs = 0;
            }


            while (nOfBombs > 0) {

                //creates a column - row index
                const column = Math.floor(Math.random() * state)
                const row = Math.floor(Math.random() * state)

                //if index are already inside the container skip the current iteration, else push the index inside the container and decrease the counter
                if (bombContainer.some(element => element?.column === column && element?.row === row)) continue;
                bombContainer.push({ column, row })
                nOfBombs -= 1;

            }
            return bombContainer;
        })()

        const checkifHaveBomb = (column, row) => {
            return generateBombs.some(element => element.column === column && element.row === row)
        }

        //counter the bombs adjiacent to the current square
        const nOfBombNearby = (column, row) => {
            const [columnStart, columnend, rowStart, rowEnd] = obtainMinMaxCoordinates(column, row,state);

            let counter = 0
            for (let columnIndex = columnStart; columnIndex <= columnend; columnIndex++) {
                for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
                    if (!(column === columnIndex && row === rowIndex) && generateBombs.some(element => element.column === columnIndex && element.row === rowIndex)) {
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
        updateRefGrid(arrayEmpty)

    }, [state])

    useEffect(() => {
        return () => { refPreviousGrid.current = [] }
    }, [])

    //If counter of adjacent bombs is 0 reveal all adjacent cells. 
    //If one of this cells has adjacent bombs = 0, recall itself
    const updateAllCleanCells = (column, row, stateTmp) => {
        const [columnStart, columnend, rowStart, rowEnd] = obtainMinMaxCoordinates(column, row,state);
        if (stateTmp[column][row].bombNearby === 0 && stateTmp[column][row].flag === false) {
            stateTmp[column][row].flag = false;
            for (let columnIndex = columnStart; columnIndex <= columnend; columnIndex++) {
                for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
                    if (stateTmp[columnIndex][rowIndex].cellSpotted === false) {
                        stateTmp[columnIndex][rowIndex].cellSpotted = true;
                        updateAllCleanCells(columnIndex, rowIndex, stateTmp)
                    } else
                    stateTmp[columnIndex][rowIndex].cellSpotted = true;
                    stateTmp[columnIndex][rowIndex].flag = false;
                }
            }
        }
    }

    /* Create a copy of the grid with different reference*/
    const updateRefGrid = (gridTmp) => {
        if (refPreviousGrid.current.length === 4) refPreviousGrid.current.shift();
        let tmpArray = []
        for (let indexCol = 0; indexCol < state; indexCol++) {
            tmpArray.push([])
            for (let indexRow = 0; indexRow < state; indexRow++) {
                tmpArray[indexCol].push(Object.assign([], gridTmp[indexCol][indexRow]))
            }
        }
        if (tmpArray.length !== 0) refPreviousGrid.current.push(tmpArray)
    }

    const updateGrid = (column, row) => {

        let stateTmp = [...grid]
        if (stateTmp[column][row].cellSpotted !== true) {
            
            if (setNewTimeLine) {
                refPreviousGrid.current.splice(reverseGrid({ type: "DEFAULT" }), refPreviousGrid.current.length - reverseGrid({ type: "DEFAULT" }))
                updateRefGrid(grid)
                setNewTimeLine = false
            }
            stateTmp[column][row].cellSpotted = true;
            stateTmp[column][row].setFlag = false;
            if (stateTmp[column][row].haveBomb !== true) {
                updateAllCleanCells(column, row, stateTmp)
            } else {
                refPreviousGrid.current = [];
            }

            setGameStatus(prevState => ({
                currentLives: stateTmp[column][row].haveBomb === true ? prevState.currentLives - 1 : prevState.currentLives, gameWon: stateTmp.every(column => column.every(element => {
                    return element.haveBomb === true || element.cellSpotted === true
                }))
            }))
            setGrid(stateTmp);
            updateRefGrid(stateTmp);
            reverseGrid({ type: "SET", value: refPreviousGrid.current.length - 1 })

        }
    }
    const setFlag = (column, row) => { 
            let stateTmp = [...grid]
            stateTmp[column][row].flag = !stateTmp[column][row].flag;
            setGrid(stateTmp);        
    }

    const checkifGameisFinished = () => {
        return gameStatus.currentLives === 0 || gameStatus.gameWon === true
    }

    const endGameMessage = () => {
        refPreviousGrid.current = []
        return <p className='statusMessage'>{gameStatus.gameWon ? "Complimenti, hai vinto!" : "Mi dispiace, hai perso!"}</p>
    }


    //closure
    const reverseGrid = useMemo((() => {
        let counter = 0
        const updateCounter = ({ type, value = null }) => {
            switch (type) {
                case "INCREMENT":
                    return counter === refPreviousGrid.current.length - 1 ? refPreviousGrid.current.length - 1 : ++counter;
                case "DECREMENT":
                    return counter === 0 ? 0 : --counter;
                case "RESET":
                    counter = 0;
                    break;
                case "SET":
                    if (parseInt(value) !== NaN) counter = value;
                    return counter;
                default:
                    return counter;
            }
        }
        return updateCounter;
    }), [])


    return (
        <div className={`game-screen ${state === null ? 'mediaquery-menu' : ""}`} >
            {state === null ? [...new Array(isMobile ? 2 : 3).keys()].map(index =><DifficuiltButton 
            index={index}
            key={index}
            callback={ () => {
                dispatch({ type: arrayDifficuilt[index].action })
            } }
            name={arrayDifficuilt[index].name}
            />) :
                <div className='game-container-screen'>
                    {checkifGameisFinished() ?
                        <>
                            {endGameMessage()}
                            <button className='button-timeline' onClick={() => {
                                dispatch({ type: "RESET" })
                                setGameStatus(initialStateGameStatus)
                                refPreviousGrid.current = []
                            }}>Ricomincia</button></> :

                        <><p className='statusMessage'>{`Tentativi rimasti: ${gameStatus.currentLives}`}</p>
                            <div className='buttons-container'>
                                <button className={`button-timeline ${reverseGrid({ type: "DEFAULT" }) === 0 ? 'buttons-unevaiable' : ""}`} onClick={() => {
                                    setGrid(refPreviousGrid.current[reverseGrid({ type: "DECREMENT" })])
                                    setNewTimeLine = true;
                                }}>Indietro</button>
                                <button className={`button-timeline ${reverseGrid({ type: "DEFAULT" }) === refPreviousGrid.current.length - 1 ? 'buttons-unevaiable' : ""}`} onClick={() => {
                                    setGrid(refPreviousGrid.current[reverseGrid({ type: "INCREMENT" })])
                                }}>Avanti</button>
                                {isMobile && <button onClick={() => {
                                    setFlagButton(!flagButton)
                                }
                                } className='button-timeline'>{`Flag: ${flagButton ? "ON" : "OFF"}`}</button>}

                            </div>
                        </>}

                    <div className='game-container' onContextMenu={(e) => {
                        e.preventDefault();
                    }}>
                        {grid.map((_, indexColumn) => {
                            return (<div key={indexColumn} className='column'>
                                {grid[indexColumn].map((element, indexRow) => {
                                    return (
                                        <div key={indexRow} className={`cell-container ${indexRow !== state - 1 ? 'cell-container-no-right-border' : ""} ${indexColumn !== state - 1 ? 'cell-container-no-bot-border' : ""}`}>
                                            <div key={indexRow} onContextMenu={(e) => {
                                                e.preventDefault()
                                                if (!checkifGameisFinished() && element.cellSpotted === false)
                                                    setFlag(indexColumn, indexRow)
                                            }} onClick={() => {
                                                if (flagButton) {
                                                    if (!checkifGameisFinished() && element.cellSpotted === false)
                                                        setFlag(indexColumn, indexRow)
                                                } else {
                                                    if (!checkifGameisFinished() && element.flag === false) updateGrid(indexColumn, indexRow)
                                                }
                                            }} className={`game-cell ${state === MID ? "game-cell-mediaquery" : ""} ${element.flag ? "tmpFlag" : ""} ${element.haveBomb && element.cellSpotted ? "tmpBomb" : ""} ${state === MID ? "tmpBomb-mediaquery" : ''} ${element.cellSpotted === false && element.flag === false ? "house-bg" : ""}`}>{`${element.cellSpotted && !element.haveBomb && !element.flag ? element.bombNearby : ""}`}</div>
                                        </div>
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