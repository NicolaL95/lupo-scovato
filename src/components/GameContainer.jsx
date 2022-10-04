import React, { useEffect, useState } from 'react'
import { useReducer } from 'react'
import "./GameContainer.css"
import woodcutter from '../assets/img/woodcutter.jpg'
import farmer from '../assets/img/farmer.jpg'
import hunter from '../assets/img/hunter.jpg'
import { useCallback } from 'react'
import { useRef } from 'react'
import { useMediaQuery } from 'react-responsive';
import { useLongPress } from 'use-long-press';

let setNewTimeLine = false;
let addReverseGrid = false;

let doubleTapFix = true;

const arrayOfBackGround = [hunter, woodcutter, farmer]
const initialStateGameStatus = {
    currentLives: 2,
    gameWon: false,
}
export default function GameContainer() {

    const refPreviousGrid = useRef([]);
    const globalCounter = useRef(0)

    const isMobile = useMediaQuery({ query: `(max-width: 760px)` });
    const longPressFlagMobile = useLongPress((event, content) => {
        const column = content.context[0].column
        const key = Object.keys(event.target)
        const row = parseInt(event.target[key[0]].key)
        if (!checkifGameisFinished() && grid[column][row].cellSpotted === false) setFlag2(column, row)
    }, {
        onFinish: event => doubleTapFix = false
    })

    const easy = 4
    const mid = 8
    const hard = 12


    const [state, dispatch] = useReducer(reducer, null)

    const [gameStatus, setGameStatus] = useState(initialStateGameStatus)

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
            case "RESET":
                return null

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
        updateRefGrid(arrayEmpty)

    }, [state])

    /*    useEffect(() => {
           if (addReverseGrid) {
               updateRefGrid(grid)
               addReverseGrid = false;
           }
       }, [grid]) */
    useEffect(() => {
        doubleTapFix = true;
    }, [grid])


    console.log("mi sto aggiornando", refPreviousGrid.current, globalCounter.current);

    useEffect(() => {
        return () => { refPreviousGrid.current = [] }
    }, [])


    const arrayDifficuilt = [{
        action: "EASY",
        name: "Easy"
    }, {
        action: "MID",
        name: "Normal"
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
                refPreviousGrid.current.splice(globalCounter, refPreviousGrid.current.length - globalCounter)
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
            /*  reverseGrid({ type: "RESET" }) */
            globalCounter.current = refPreviousGrid.current.length - 1
        }
    }
    const setFlag = (column, row) => {
        if (doubleTapFix === true) {
            let stateTmp = [...grid]
            stateTmp[column][row].flag = !stateTmp[column][row].flag;
            setGrid(stateTmp);
        }
    }
    const setFlag2 = (column, row) => {
        console.log('flag2');
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
    /*   const reverseGrid = useCallback(() => {
          let counter = 3
          const updateCounter = ({ type }) => {
              switch (type) {
                  case "INCREMENT":
                      return counter === refPreviousGrid.current.length ? refPreviousGrid.current.length : ++counter;
                  case "DECREMENT":
                      return counter === 0 ? 0 : --counter;
                  case "RESET":
                      counter = 3;
                      break;
              }
          }
          return updateCounter;
      })()
   */

    return (
        <div className={`game-screen ${state === null ? 'mediaquery-menu' : ""}`} >
            {state === null ? [...new Array(isMobile ? 2 : 3).keys()].map(index =>
                <button key={index} className='difficuilt-button' style={{
                    backgroundImage: `url(${arrayOfBackGround[index]})`, backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }} onClick={() => {
                    dispatch({ type: arrayDifficuilt[index].action })
                }}>{arrayDifficuilt[index].name
                    }</button>) :
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
                                <button className={`button-timeline ${globalCounter.current === 0 ? 'buttons-unevaiable' : ""}`} onClick={() => {
                                    setGrid(refPreviousGrid.current[globalCounter.current === 0 ? 0 : --globalCounter.current])
                                    setNewTimeLine = true;
                                    if (refPreviousGrid.current.length > 0) addReverseGrid = true;
                                }}>Indietro</button>
                                <button className={`button-timeline ${globalCounter.current === refPreviousGrid.current.length - 1 ? 'buttons-unevaiable' : ""}`} onClick={() => {
                                    console.log(globalCounter.current)
                                    setGrid(refPreviousGrid.current[globalCounter.current === refPreviousGrid.current.length - 1 ? refPreviousGrid.current.length - 1 : ++globalCounter.current])
                                }}>Avanti</button>
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
                                            <div {...longPressFlagMobile(_, indexRow)} key={indexRow} onContextMenu={(e) => {
                                                e.preventDefault()

                                                if (!checkifGameisFinished() && element.cellSpotted === false)
                                                    setFlag(indexColumn, indexRow)
                                            }} onClick={() => { if (!checkifGameisFinished() && element.flag === false) updateGrid(indexColumn, indexRow) }} className={`game-cell ${state === mid ? "game-cell-mediaquery" : ""} ${element.flag ? "tmpFlag" : ""} ${element.haveBomb && element.cellSpotted ? "tmpBomb" : ""} ${state === mid ? "tmpBomb-mediaquery" : ''} ${element.cellSpotted === false && element.flag === false ? "house-bg" : ""}`}>{`${element.cellSpotted && !element.haveBomb && !element.flag ? element.bombNearby : ""}`}</div>
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
