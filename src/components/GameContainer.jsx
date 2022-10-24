
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

                //creates a row - column index
                const row = Math.floor(Math.random() * state)
                const column = Math.floor(Math.random() * state)

                //if index are already inside the container skip the current iteration, else push the index inside the container and decrease the counter
                if (bombContainer.some(element => element?.row === row && element?.column === column)) continue;
                bombContainer.push({ row, column })
                nOfBombs -= 1;

            }
            return bombContainer;
        })()

        const checkifHaveBomb = (row, column) => {
            return generateBombs.some(element => element.row === row && element.column === column)
        }

        //counter the bombs adjiacent to the current square
        const nOfBombNearby = (row, column) => {
            const [rowStart, rowEnd, columnStart, columnEnd] = obtainMinMaxCoordinates(row, column,state);

            let counter = 0
            for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
                for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex++) {
                    if (!(row === rowIndex && column === columnIndex) && generateBombs.some(element => element.row === rowIndex && element.column === columnIndex)) {
                        counter = counter + 1;
                    }
                }
            }
            return counter
        }
        //create a grid where every single cell carrying all the necessary information 
        for (let rowIndex = 0; rowIndex < state; rowIndex++) {
            arrayEmpty.push([])
            for (let columnIndex = 0; columnIndex < state; columnIndex++) {
                arrayEmpty[rowIndex].push({
                    row: rowIndex,
                    column: columnIndex,
                    cellSpotted: false,
                    haveBomb: checkifHaveBomb(rowIndex, columnIndex),
                    bombNearby: nOfBombNearby(rowIndex, columnIndex),
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
    const updateAllCleanCells = (row, column, stateTmp) => {
        const [rowStart, rowEnd, columnStart, columnEnd] = obtainMinMaxCoordinates(row, column,state);
        if (stateTmp[row][column].bombNearby === 0 && stateTmp[row][column].flag === false) {
            stateTmp[row][column].flag = false;
            for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
                for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex++) {
                    if (stateTmp[rowIndex][columnIndex].cellSpotted === false) {
                        stateTmp[rowIndex][columnIndex].cellSpotted = true;
                        updateAllCleanCells(rowIndex, columnIndex, stateTmp)
                    } else
                    stateTmp[rowIndex][columnIndex].cellSpotted = true;
                    stateTmp[rowIndex][columnIndex].flag = false;
                }
            }
        }
    }

    /* Create a copy of the grid with different reference*/
    const updateRefGrid = (gridTmp) => {
        if (refPreviousGrid.current.length === 4) refPreviousGrid.current.shift();
        let tmpArray = []
        for (let indexRow = 0; indexRow < state; indexRow++) {
            tmpArray.push([])
            for (let indexColumn = 0; indexColumn < state; indexColumn++) {
                tmpArray[indexRow].push(Object.assign([], gridTmp[indexRow][indexColumn]))
            }
        }
        if (tmpArray.length !== 0) refPreviousGrid.current.push(tmpArray)
    }

    /* Update Grid */
    const updateGrid = (row, column) => {
        let stateTmp = [...grid]
        if (stateTmp[row][column].cellSpotted !== true) {
            if (setNewTimeLine) {
                refPreviousGrid.current.splice(reverseGrid({ type: "DEFAULT" }), refPreviousGrid.current.length - reverseGrid({ type: "DEFAULT" }))
                updateRefGrid(grid)
                setNewTimeLine = false
            }
            stateTmp[row][column].cellSpotted = true;
            stateTmp[row][column].setFlag = false;
            if (stateTmp[row][column].haveBomb !== true) {
                updateAllCleanCells(row, column, stateTmp)
            } else {
                refPreviousGrid.current = [];
            }

            setGameStatus(prevState => ({
                currentLives: stateTmp[row][column].haveBomb === true ? prevState.currentLives - 1 : prevState.currentLives, gameWon: stateTmp.every(row => row.every(element => {
                    return element.haveBomb === true || element.cellSpotted === true
                }))
            }))
            setGrid(stateTmp);
            updateRefGrid(stateTmp);
            reverseGrid({ type: "SET", value: refPreviousGrid.current.length - 1 })

        }
    }
    const setFlag = (row, column) => { 
            let stateTmp = [...grid]
            stateTmp[row][column].flag = !stateTmp[row][column].flag;
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
        <div className={`game-screen ${state === null && 'mediaquery-menu'}`} >
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
                                <button className={`button-timeline ${reverseGrid({ type: "DEFAULT" }) === 0 && 'buttons-unevaiable'}`} onClick={() => {
                                    setGrid(refPreviousGrid.current[reverseGrid({ type: "DECREMENT" })])
                                    setNewTimeLine = true;
                                }}>Indietro</button>
                                <button className={`button-timeline ${reverseGrid({ type: "DEFAULT" }) === refPreviousGrid.current.length - 1 && 'buttons-unevaiable'}`} onClick={() => {
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
                        {grid.map((_, indexRow) => {
                            return (<div key={indexRow} className='row'>
                                {grid[indexRow].map((element, indexColumn)  => {
                                    return (
                                        <div key={indexColumn} className={`cell-container ${indexColumn !== state - 1 && 'cell-container-no-right-border'} ${indexRow !== state - 1 && 'cell-container-no-bot-border'}`}>
                                            <div key={indexColumn} onContextMenu={(e) => {
                                                e.preventDefault()
                                                if (!checkifGameisFinished() && element.cellSpotted === false)
                                                    setFlag(indexRow, indexColumn)
                                            }} onClick={() => {
                                                if (flagButton) {
                                                    if (!checkifGameisFinished() && element.cellSpotted === false)
                                                        setFlag(indexRow, indexColumn)
                                                } else {
                                                    if (!checkifGameisFinished() && element.flag === false) updateGrid(indexRow, indexColumn)
                                                }
                                            }} className={`game-cell ${state === MID && "game-cell-mediaquery"} ${element.flag && "tmpFlag"} ${element.haveBomb && element.cellSpotted && "tmpBomb"} ${state === MID && "tmpBomb-mediaquery"} ${element.cellSpotted === false && element.flag === false ? "house-bg" : ""}`}>{`${element.cellSpotted && !element.haveBomb && !element.flag ? element.bombNearby : ""}`}</div>
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