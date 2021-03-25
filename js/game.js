'use strict'

const FLAG = '🚩';
const EMPTY = '';
const MINE = '<img class="mine" src="/img/mine.png"/>';
const COVERED = '';
const LIFE = '❤️';
const SMILEY = ['😄', '😟', '🤯', '😎'];

var gBoard;

var gGame = {
    isGameOver: false,
    isFirstClick: true,
    correctMarkCount: 0,
    shownCellCount: 0,
    startTime: 0,
    timerInterval: 0,
    bestTime: 0,
    life: 3,
    level: 1,
    hint: 3,
    isHintActive: false
};

var gLevels = [
    { SIZE: 4, MINES: 2 },
    { SIZE: 8, MINES: 12 },
    { SIZE: 12, MINES: 30 }
];

function init() {
    startGame();
}

function startGame() {
    gBoard = buildBoard();
    renderBoard('.game-container');
    var elRecord = document.querySelector('.record')
    elRecord.innerText = `Best Time: ${localStorage.getItem('bestTime')}`;
}

function buildBoard() {
    var SIZE = gLevels[gGame.level].SIZE;
    var board = [];

    for (var i = 0; i < SIZE; i++) {
        board.push([]);
        for (var j = 0; j < SIZE; j++) {

            board[i].push({
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            });
        }
    }

    return board;
}

function clickedFlag(elBtn) {
    if (gGame.isGameOver) return;
    var location = getCoordById(elBtn.id);
    var cell = gBoard[location.i][location.j]

    if (gGame.isFirstClick && !gGame.startTime) {
        gGame.startTime = Date.now();
        gGame.timerInterval = setInterval(function () { timeUpdater() }, 500);
    }

    // right click, not shown , and not marked
    if (!cell.isShown && !cell.isMarked) {
        cell.isMarked = true;
        if (cell.isMine) gGame.correctMarkCount++
        renderCell(location, FLAG);
        // right click, not shown, and marked
    } else if (!cell.isShown && cell.isMarked) {
        cell.isMarked = false;
        if (cell.isMine) gGame.correctMarkCount--
        renderCell(location, getSpanHTML('none', getMineNegCount(location)));
    }

    if (checkWin()) victory();
}

function clickedButton(elBtn) {
    var location = getCoordById(elBtn.id);
    var cell = gBoard[location.i][location.j]

    var elSmiley = document.querySelector('.smiley');

    if (gGame.isGameOver) return;
    if (gGame.isFirstClick) {
        if (!gGame.startTime) {
            gGame.startTime = Date.now();
            gGame.timerInterval = setInterval(function () { timeUpdater() }, 500);
        }
        expandShown(location);
        setMines();
        setMineNegCounts(gBoard);
        renderBoard('.game-container');
        gGame.isFirstClick = false;
    }


    //if mine, left click , not marked, and not shown
    if (cell.isMine && !cell.isMarked && !cell.isShown) {
        /* if life is not 0 then */
        gGame.life--;
        renderLifes();
        cell.isShown = true;
        elBtn.classList.remove('covered');
        elBtn.classList.add('shown');
        elSmiley.innerText = SMILEY[1];
        renderCell(location, MINE);

        /*if life is 0 then */
        if (gGame.life === 0) {
            elSmiley.innerText = SMILEY[2]
            revealMines(location);
            console.log('BOOM');
            gameOver();
        }
    }

    // left click, not shown, not a mine ,and not marked
    if (!cell.isShown && !cell.isMine && !cell.isMarked) {
        var elSpan = elBtn.querySelector('span');
        elSmiley.innerText = SMILEY[0];
        if (elSpan.innerText === EMPTY) {
            expandShown(location);
        } else {
            elBtn.classList.remove('covered');
            elBtn.classList.add('shown');
            cell.isShown = true
            elSpan.style.display = 'block';
            gGame.shownCellCount++;
        }
    }

    if (checkWin()) victory();
}

function getCoordById(strId) {
    var coordArray = strId.split('-');
    var location = {
        i: +coordArray[1],
        j: +coordArray[2]
    };
    return location;
}

function setMines() {
    var mineCoords = []
    var randomCoord;
    for (var i = 0; i <= gLevels[gGame.level].MINES - 1; i++) {
        // checking if this random location has already been used
        randomCoord = getRandomCoord();

        if (gBoard[randomCoord.i][randomCoord.j].isShown) {
            i -= 1;
            continue;
        }
        gBoard[randomCoord.i][randomCoord.j].isMine = true;
        mineCoords.push(randomCoord);

        for (var j = 0; j < mineCoords.length - 1; j++) {
            if (mineCoords.length === 1) continue;
            if (mineCoords[j].i === randomCoord.i
                && mineCoords[j].j === randomCoord.j) {
                mineCoords.splice(j, 1);
                i -= 1;
                break;
            }
        }
    }
}

function getMineNegCount(location) {
    var mineCount = 0;
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue; // if i is out of mat
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue; // if j is out of mat
            if (i === location.i && j === location.j) continue; // if on clicked location

            var currNeg = gBoard[i][j]
            if (currNeg.isMine) mineCount++
        }
    }
    return mineCount;
}

function setMineNegCounts(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currCell = board[i][j];
            if (currCell.isMine) continue
            var location = {
                i,
                j,
            }
            var minesAround = getMineNegCount(location)
            if (!minesAround) continue; // deleting 0
            currCell.minesAroundCount = minesAround;
        }
    }
}

function expandShown(location) {
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue; // if i is out of mat
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue; // if j is out of mat

            var cell = gBoard[i][j];

            if (cell.isMine || cell.isMarked) continue; // if on clicked location

            if (!cell.isShown) {
                cell.isShown = true
                var elCell = document.querySelector(`#cell-${i}-${j}`);
                elCell.classList.remove('covered');
                elCell.classList.add('shown');
                elCell.querySelector('span').style.display = 'block';
                gGame.shownCellCount++;
            }
            // clickedButton(elCell);
        }
    }
}

function gameOver() {
    clearInterval(gGame.timerInterval);
    gGame.isGameOver = true;
}

function victory() {
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = SMILEY[3]
    gameOver();
    console.log('Victory');
    var elTimer = document.querySelector('.timer');
    var elRecord = document.querySelector('.record')
    if (checkIsBestTime(elTimer.innerText)) {
        localStorage.setItem('bestTime', `${elTimer.innerText}`)
        elRecord.innerText = `Best Time: ${localStorage.getItem('bestTime')}`;
    }
}

function revealMines(locationOfClick) {
    // debugger
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j];
            var elCell = document.querySelector(`#cell-${i}-${j}`);
            if (i === locationOfClick.i && j === locationOfClick.j) { // at clicked spot
                elCell.classList.remove("shown");
                elCell.classList.add("blown");
                elCell.innerHTML = MINE;
            } else {
                if (currCell.isShown) continue;
                if (currCell.isMine && !currCell.isShown) { // at mine and not shown
                    currCell.isShown = true;
                    elCell.classList.remove("covered");
                    elCell.classList.add('shown')
                    elCell.innerHTML = MINE;
                }
            }
        }
    }
}

function checkWin() {
    var SIZE = gLevels[gGame.level].SIZE;
    var MINES = gLevels[gGame.level].MINES;
    if (gGame.correctMarkCount === gLevels[gGame.level].MINES &&
        gGame.shownCellCount === (SIZE * SIZE) - MINES)
        return true;
    else return false;
}

function resetGame() {
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = SMILEY[0]

    var elTimer = document.querySelector('.timer');
    elTimer.innerText = '000';

    gGame.isGameOver = false;
    gGame.isFirstClick = true;
    gGame.correctMarkCount = 0;
    gGame.shownCellCount = 0;
    gGame.startTime = 0;
    gGame.timerInterval = 0;
    gGame.bestTime = 0;
    gGame.hint = 3;
    if (gGame.level === 0) gGame.life = 2;
    else gGame.life = 3;
    startGame();
    renderLifes()
}

function timeUpdater() {
    var elTimer = document.querySelector('.timer');

    if (gGame.startTime === 0) return 0;
    var diff = Date.now() - gGame.startTime; // milliseconds since start
    var output = (Math.floor(diff / 1000)); // in seconds

    if (output < 10) {
        elTimer.innerText = '00' + output;
    } else if (output < 100) {
        elTimer.innerText = '0' + output;
    } else if (output > 100) {
        elTimer.innerText = output;
    }
}

function checkIsBestTime(num) {
    var bestTime = localStorage.getItem(bestTime);
    if (bestTime === null) bestTime = Infinity;
    if (num < bestTime) return true;
    else return false;
}

function renderLifes() {
    var elLifesSpan = document.querySelector('.lifes');
    if (gGame.life === 3) {
        elLifesSpan.innerHTML = '❤️ ❤️ ❤️';
    } else if (gGame.life === 2) {
        elLifesSpan.innerHTML = '❤️ ❤️';
    } else if (gGame.life === 1) {
        elLifesSpan.innerHTML = '❤️';
    } else {
        elLifesSpan.innerHTML = ''
    }
}

function checkLevel(elBtn) {
    if (elBtn.innerText === 'Easy') {
        gGame.level = 0;
        resetGame();
    } else if (elBtn.innerText === 'Normal') {
        gGame.level = 1;
        resetGame();
    } else if (elBtn.innerText === 'Hard') {
        gGame.level = 2;
        resetGame();
    }
}

// function useHint(elImg){
//     if (gGame.isFirstClick) return;
//     if (!gGame.isHintActive) elImg.src('../img/normalBulb');
// }
