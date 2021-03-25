'use strict'

function renderBoard(selector) {
    var strHTML = '<table border="0"><tbody>';
    var locationsOfFlags = []
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j];
            var minesAround = gBoard[i][j].minesAroundCount;
            if (minesAround === 0) minesAround = '';
            
            var cell =`<span>${minesAround}</span>`

            if (currCell.isMarked) {
                var locationOfFlag = {
                    i,
                    j
                };
                locationsOfFlags.push(locationOfFlag);
            }

            var cellId = `cell-${i}-${j}`;
            var className = (currCell.isShown) ? 'shown' : 'covered';

            strHTML += `<td id="${cellId}" class="cell ${className}" oncontextmenu="clickedFlag(this)" onclick="clickedButton(this)">${cell}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';

    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
    renderFlags(locationsOfFlags);
}

function renderFlags(locations) {
    for (var i = 0; i<locations.length; i++) {
        renderCell(locations[i], `${FLAG}`);
    }
}

function renderCell(location, value) {
    var elCell = document.querySelector(`#cell-${location.i}-${location.j}`);
    elCell.innerHTML = value;
}

function getSpanHTML(displayValue, minesAround) {
    if (minesAround === 0) minesAround = EMPTY;
    return `<span style="display: ${displayValue}">${minesAround}</span>`
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomCoord() {
    return {
        i: getRandomInt(0, gLevels[gGame.level].SIZE - 1),
        j: getRandomInt(0, gLevels[gGame.level].SIZE - 1)
    };
}