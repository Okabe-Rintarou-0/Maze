var leftCanvas;
var rightCanvas;
var inputWidth;
var inputHeight;
var gridSize = 3;
var Mazes;
var mouseX;
var mouseY;
var startPoint;
var targetPoint;
var presentPoint;
var startX;
var startY;
var targetX;
var targetY;
var visitedPoints = [];
var setPoint_Counter = 0;
var presentCanvasWidth;
var presentCanvasHeight;
var presentReqId = [];
var direction = [[0, -gridSize], [0, gridSize], [-gridSize, 0], [gridSize, 0],
    [-gridSize, -gridSize], [gridSize, -gridSize], [-gridSize, gridSize], [gridSize, gridSize]];
var lastState = true;
var Animated = true;
var diagonalLosses = 14;
var verticalLosses = 10;
var horizontalLosses = 10;
var G = [];
var select;

function toggle() {
    let animationRadio = document.getElementsByClassName('AnimationRadio');
    if (animationRadio[0].checked === lastState)
        animationRadio[0].checked = !animationRadio[0].checked;
    lastState = animationRadio[0].checked;
    Animated = lastState;
}

function ResetMaze() {
    // alert(1);
    let totalStep = document.getElementsByClassName('totalStep');
    totalStep[0].innerHTML = 'totalStep:null';
    totalStep[1].innerHTML = 'totalStep:null';
    for (let index = 0; index < 2; index++)
        cancelAnimationFrame(presentReqId[index]);
    for (let index = 0; index < 2; index++)
        while (visitedPoints[index].length)
            visitedPoints[index].pop();
    copyMaze(2, 0);
    copyMaze(2, 1);
    setDomain(0, startX, startY, 1, gridSize);
    setDomain(1, startX, startY, 1, gridSize);
    setDomain(0, targetX, targetY, 1, gridSize);
    setDomain(1, targetX, targetY, 1, gridSize);
    setPoint_Counter = 0;
    drawMaze(leftCanvas, 0);
    drawMaze(rightCanvas, 1);
    startPoint.innerText = 'targetPoint: (null,null)';
    targetPoint.innerText = 'targetPoint: (null,null)';
}

function onClick() {
    for (let index = 0; index <= 1; index++) {
        clearMaze(index);
    }

    changeCanvasSize();

    initMaze();

    setPoint_Counter = 0;
    startPoint.innerText = 'targetPoint: (null,null)';
    targetPoint.innerText = 'targetPoint: (null,null)';

    let totalStep = document.getElementsByClassName('totalStep');
    totalStep[0].innerHTML = 'totalStep:null';
    totalStep[1].innerHTML = 'totalStep:null';
    for (let index = 0; index < 2; index++)
        cancelAnimationFrame(presentReqId[index]);
    for (let index = 0; index < 2; index++)
        while (visitedPoints[index].length)
            visitedPoints[index].pop();
    let delta = Math.floor(gridSize / 2);

    formMaze(0, delta, delta);
    copyMaze(0, 1);
    drawMaze(leftCanvas, 0);
    drawMaze(rightCanvas, 1);
}

function copyMaze(index_s, index_t) {
    for (let i = 0; i < presentCanvasWidth; i++)
        for (let j = 0; j < presentCanvasHeight; j++)
            Mazes[index_t][i][j] = Mazes[index_s][i][j];
}

function getCordinate(event) {
    var rect = leftCanvas.getBoundingClientRect();
    mouseX = Math.ceil(event.clientX - rect.x + 0.5);
    mouseY = Math.ceil(event.clientY - rect.y + 0.5);
    presentPoint = document.getElementById('presentPoint');
    presentPoint.innerText = 'presentPoint: ' + '(' + mouseX.toString() + ',' + mouseY.toString() + ')';
}

function clearCordinate() {
    presentPoint.innerText = 'presentPoint: (null,null)';
}

//TODO:update this fucking function;
function normalize(x_or_y) {
    if (x_or_y % 3 === 0) x_or_y += 1;
    else if (x_or_y >= 2 && (x_or_y - 2) % 3 === 0)
        x_or_y -= 1;
    return x_or_y;
}

function drawStartAndTargetPoint() {
    if (setPoint_Counter >= 2) return;
    mouseX = normalize(mouseX);
    mouseY = normalize(mouseY);
    if (!isBlock(0, mouseX, mouseY)) {
        setPoint_Counter++;
        setDomain(0, mouseX, mouseY, setPoint_Counter + 1, gridSize);
        setDomain(1, mouseX, mouseY, setPoint_Counter + 1, gridSize);
    } else return;
    if (setPoint_Counter === 1) {
        startX = mouseX;
        startY = mouseY;
        startPoint.innerHTML = 'startPoint: (' + startX.toString() + ',' + startY.toString() + ')';
    } else {
        targetX = mouseX;
        targetY = mouseY;
        targetPoint.innerHTML = 'targetPoint: (' + targetX.toString() + ',' + targetY.toString() + ')';
        copyMaze(0, 2);
    }

    initG();

    drawMaze(leftCanvas, 0);
    drawMaze(rightCanvas, 1);
    if (setPoint_Counter === 2) {
        for (let index = 0; index < 2; index++) {
            // alert(select[index].selectedIndex)
            switch (select[index].selectedIndex) {
                case 0:
                    searchForPath_AStar(index, startX, startY, Animated);
                    break;
                case 1:
                    searchForPath_DFS(index, startX, startY, Animated);
                    break;
                case 2:
                    searchForPath_DFS_NEW(index, startX, startY, Animated);
                    break;
            }
        }

        let totalStep = document.getElementsByClassName('totalStep');
        for (let index = 0; index < 2; index++) {
            totalStep[index].innerHTML = 'totalStep:' + (visitedPoints[index].length / 3).toString();
            if (Animated) {
                copyMaze(2, index);
                drawPath(index, 0);
            } else {
                drawMaze(leftCanvas, 0);
                drawMaze(rightCanvas, 1);
            }
        }
    }
}


function chebyshevDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function canApproach(index, tgtx, tgty, dir) {
    switch (dir) {
        case 4:
            return !isBlock(index, tgtx + gridSize, tgty) && !isBlock(index, tgtx, tgty - gridSize);
        case 5:
            return !isBlock(index, tgtx, tgty - gridSize) && !isBlock(index, tgtx - gridSize, tgty);
        case 6:
            return !isBlock(index, tgtx + gridSize, tgty) && !isBlock(index, tgtx, tgty - gridSize);
        case 7:
            return !isBlock(index, tgtx, tgty - gridSize) && !isBlock(index, tgtx - gridSize, tgty);
        default:
            return true;
    }
}

//当前存在的问题 没有处理好回溯 回溯之后应走其他次优的解
function searchForPath_AStar(index, presentX, presentY, Animated = true) {
    if (presentX === targetX && presentY === targetY) {
        setDomain(index, targetX, targetY, 5, gridSize);
        visitedPoints[index].push(presentX);
        visitedPoints[index].push(presentY);
        visitedPoints[index].push(5);
        return true;
    }
    setDomain(index, presentX, presentY, 4, gridSize);
    visitedPoints[index].push(presentX);
    visitedPoints[index].push(presentY);
    visitedPoints[index].push(4);
    while (1) {
        let bestNextX = -1;
        let bestNextY = -1;
        let MIN = Number.MAX_VALUE;
        for (let i = 0; i < 8; i++) {
            let nextX = presentX + direction[i][0];
            let nextY = presentY + direction[i][1];
            // alert(nextX.toString() + ',' + nextY.toString());
            if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY) && !hasVisited(index, nextX, nextY) && canApproach(index, nextX, nextY, i)) {
                let g = G[presentX][presentY] = i >= 4 ? diagonalLosses : horizontalLosses;
                let h = chebyshevDistance(nextX, nextY, targetX, targetY);
                let losses = g + h;
                // alert(i);
                if (losses <= MIN) {
                    bestNextX = nextX;
                    bestNextY = nextY;
                    MIN = losses;
                }
            }
        }
        if (bestNextX === -1) break;
        // alert(bestNextX.toString() + ' , ' + bestNextY.toString());
        G[bestNextX][bestNextY] += MIN;
        // drawMaze(rightCanvas, 1);
        // alert('f');
        if (searchForPath_AStar(index, bestNextX, bestNextY, Animated)) {
            if (Animated) setDomain(index, bestNextX, bestNextX, 1, gridSize);
            return true;
        }
        G[bestNextX][bestNextY] -= MIN;
        // drawMaze(rightCanvas, 1);
    }
    // setDomain(index, presentX, presentY, 1);
    visitedPoints[index].push(presentX);
    visitedPoints[index].push(presentY);
    visitedPoints[index].push(1);
    return false;
    // alert(presentX.toString() + ',' + presentY.toString() + '  ' + bestNextX.toString() + ',' + bestNextY.toString());
    // alert('finished');

}


function searchForPath_DFS_NEW(index, presentX, presentY, Animated = true) {
    if (presentX === targetX && presentY === targetY) {
        setDomain(index, targetX, targetY, 5, gridSize);
        visitedPoints[index].push(presentX);
        visitedPoints[index].push(presentY);
        visitedPoints[index].push(5);
        return true;
    }
    setDomain(index, presentX, presentY, 4, gridSize);
    visitedPoints[index].push(presentX);
    visitedPoints[index].push(presentY);
    visitedPoints[index].push(4);
    var dirList = [];
    dirList.push(targetX - presentX > 0 ? 3 : 2);
    dirList.push(targetY - presentY > 0 ? 1 : 0);
    dirList.push(targetX - presentX > 0 ? 2 : 3);
    dirList.push(targetY - presentY > 0 ? 0 : 1);
    for (let i = 0; i < 4; i++) {
        let nextX = presentX + direction[dirList[i]][0];
        let nextY = presentY + direction[dirList[i]][1];
        if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY) && !hasVisited(index, nextX, nextY)) {
            // alert(presentX.toString() + ',' + presentY.toString());
            // drawMaze(leftCanvas, 0);
            if (searchForPath_DFS_NEW(index, nextX, nextY, Animated)) {
                if (Animated) setDomain(index, presentX, presentY, 1, gridSize);
                return true;
            }
        }
    }
    setDomain(index, presentX, presentY, 1, gridSize);
    visitedPoints[index].push(presentX);
    visitedPoints[index].push(presentY);
    visitedPoints[index].push(1);
}

function searchForPath_DFS(index, presentX, presentY, Animated = true) {

    // console.log(visitedPoints.length);
    if (presentX === targetX && presentY === targetY) {
        setDomain(index, targetX, targetY, 5, gridSize);
        visitedPoints[index].push(presentX);
        visitedPoints[index].push(presentY);
        visitedPoints[index].push(5);
        return true;
    }
    setDomain(index, presentX, presentY, 4, gridSize);
    visitedPoints[index].push(presentX);
    visitedPoints[index].push(presentY);
    visitedPoints[index].push(4);
    for (let dir = 0; dir < 4; dir++) {
        let nextX = presentX + direction[dir][0];
        let nextY = presentY + direction[dir][1];
        if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY) && !hasVisited(index, nextX, nextY)) {
            // alert(presentX.toString() + ',' + presentY.toString());
            // drawMaze(leftCanvas, 0);
            if (searchForPath_DFS(index, nextX, nextY, Animated)) {
                if (Animated) setDomain(index, presentX, presentY, 1, gridSize);
                return true;
            }
        }
    }
    if (Animated)
        setDomain(index, presentX, presentY, 1, gridSize);
    visitedPoints[index].push(presentX);
    visitedPoints[index].push(presentY);
    visitedPoints[index].push(1);
}

async function sleep(interval) {
    return new Promise(resolve => {
        setTimeout(resolve, interval);
    })
}


function drawPath(canvasIndex, drawIndex, method = 1) {
    if (drawIndex === visitedPoints[canvasIndex].length / 3) return;
    let x = visitedPoints[canvasIndex][drawIndex * 3];
    let y = visitedPoints[canvasIndex][drawIndex * 3 + 1];
    let colorValue = visitedPoints[canvasIndex][drawIndex * 3 + 2];
    // alert(x.toString() + ',' + y.toString() + ',' + colorValue.toString());
    setDomain(canvasIndex, x, y, colorValue, gridSize);
    if (canvasIndex === 0)
        drawMaze(leftCanvas, canvasIndex);
    else
        drawMaze(rightCanvas, canvasIndex);
    presentReqId[canvasIndex] = requestAnimationFrame(function () {
        drawPath(canvasIndex, drawIndex + 1);
    });
}

function initCanvas(canvas, canvasColor = 'white') {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function initMaze() {
    Mazes = new Array(3);
    for (let i = 0; i < 3; i++) {
        Mazes[i] = new Array(presentCanvasWidth);
        for (let j = 0; j < presentCanvasWidth; j++)
            Mazes[i][j] = new Array(presentCanvasHeight);
    }
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < presentCanvasWidth; j++)
            for (let k = 0; k < presentCanvasHeight; k++)
                Mazes[i][j][k] = 0;
}

function changeCanvasSize() {
    presentCanvasWidth = inputWidth.value;
    presentCanvasHeight = inputHeight.value;
    if (isNaN(presentCanvasWidth) || isNaN(presentCanvasHeight))
        alert('非法输入！请输入数字');
    if (presentCanvasHeight % 3 !== 0 || presentCanvasWidth % 3 !== 0)
        alert('请输入3的倍数！');

    setCanvasSize(leftCanvas, presentCanvasWidth, presentCanvasHeight);
    setCanvasSize(rightCanvas, presentCanvasWidth, presentCanvasHeight);
    initCanvas(leftCanvas);
    initCanvas(rightCanvas);
}

function setCanvasSize(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
}

function drawRect(canvas, x, y, color, size = 3) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    // alert(isPath(leftCanvas, x, y));
}

function isBlock(index, x, y) {
    return Mazes[index][x][y] === 0;
}

function hasVisited(index, x, y) {
    return Mazes[index][x][y] === 4;
}

function getPixelData(canvas, x, y) {
    var ctx = canvas.getContext('2d');
    var pixel = ctx.getImageData(x, y, 1, 1);
    return pixel.data;
}

function drawLines(index, x, y, dir) {
    if (dir === 0)//横向
        for (let i = x; i < presentCanvasWidth; i += gridSize)
            setDomain(index, i, y, 0, gridSize);
    else
        for (let j = y; j < presentCanvasHeight; j += gridSize)
            setDomain(index, x, j, 0, gridSize);
}


function inRange(x, y) {
    return !(x >= presentCanvasWidth || y >= presentCanvasHeight || x < Math.floor(gridSize / 2) || y < Math.floor(gridSize / 2));
}

function drawMaze(canvas, index) {
    for (let i = 0; i < presentCanvasWidth; i++)
        for (let j = 0; j < presentCanvasHeight; j++) {
            if (Mazes[index][i][j] === 1)
                drawRect(canvas, i, j, 'white', 1);
            else if (Mazes[index][i][j] === 0)
                drawRect(canvas, i, j, '#585858', 1);
            else if (Mazes[index][i][j] === 2)//start
                drawRect(canvas, i, j, 'yellow', 1);
            else if (Mazes[index][i][j] === 3)//end
                drawRect(canvas, i, j, 'green', 1);
            else if (Mazes[index][i][j] === 4)
                drawRect(canvas, i, j, 'pink', 1);
            else drawRect(canvas, i, j, 'orange', 1);
        }
}

function setDomain(index, x, y, value, gridSize) {
    let delta = Math.floor(gridSize / 2);
    // alert(delta);
    for (let i = -delta; i <= delta; i++)
        for (let j = -delta; j <= delta; j++) {
            let X = x + i;
            let Y = y + j;
            if (X <= presentCanvasWidth && Y <= presentCanvasHeight && X >= 0 && Y >= 0)
                Mazes[index][X][Y] = value;
        }
}

function clearMaze(index) {
    for (let i = 0; i < presentCanvasWidth; i++)
        for (let j = 0; j < presentCanvasHeight; j++)
            Mazes[index][i][j] = 0;
}

function reverseDir(dir) {
    let b = Boolean(dir & 1);
    // alert('b ' + b.toString());
    let a = (dir >> 1) & 1;
    // alert('a ' + a.toString());
    // alert((a << 1) + Number(!b));
    return (a << 1) + Number(!b);
}

function drawGrid(index) {
    for (let i = 1; i < presentCanvasWidth; i += gridSize << 1)
        drawLines(index, i, 1, 1);
    for (let j = 1; j < presentCanvasHeight; j += gridSize << 1)
        drawLines(index, 1, j, 0);
}

function canBePlaced(index, x, y, dir) {
    switch (dir) {
        case 0: //up
            for (let i = -gridSize; i <= gridSize; i += gridSize)
                for (let j = -gridSize; j <= 0; j += gridSize) {
                    let nextX = x + i;
                    let nextY = y + j;
                    if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY)) return false;
                }
            break;
        case 1://down
            for (let i = -gridSize; i <= gridSize; i += gridSize)
                for (let j = 0; j <= gridSize; j += gridSize) {
                    let nextX = x + i;
                    let nextY = y + j;
                    if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY)) return false;
                }
            break;
        case 2://left
            for (let i = -gridSize; i <= 0; i += gridSize)
                for (let j = -gridSize; j <= gridSize; j += gridSize) {
                    let nextX = x + i;
                    let nextY = y + j;
                    if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY)) return false;
                }
            break;
        case 3://right
            for (let i = 0; i <= gridSize; i += gridSize)
                for (let j = -gridSize; j <= gridSize; j += gridSize) {
                    let nextX = x + i;
                    let nextY = y + j;
                    if (inRange(nextX, nextY) && !isBlock(index, nextX, nextY)) return false;
                }
            break;
    }
    return true;
}

function randomSort(arr) {
    arr.sort(function () {
        return Math.random() - 0.5;
    });
}

var times = 0;

function formMaze(index, x, y) {
    times++;
    // if (times % 5000 === 0) {
    //     drawMaze(leftCanvas, 0)
    // }
    setDomain(index, x, y, 1, gridSize);
    let nextX;
    let nextY;
    // alert(x.toString() + ' ' + y.toString());
    // drawMaze(leftCanvas, 0);
    while (1) {
        let availableDir = [];
        for (let dir = 0; dir < 4; dir++) {
            nextX = x + direction[dir][0];
            nextY = y + direction[dir][1];
            if (inRange(nextX, nextY) && canBePlaced(index, nextX, nextY, dir))
                availableDir.push(dir);
        }
        if (availableDir.length === 0) return;
        randomSort(availableDir);
        nextX = x + direction[availableDir[0]][0];
        nextY = y + direction[availableDir[0]][1];
        formMaze(index, nextX, nextY);
    }

}

function closeModal() {
    document.getElementById('modal-id').classList.remove('active');
}

function initG() {
    for (let i = 0; i < presentCanvasWidth; i++)
        for (let j = 0; j < presentCanvasHeight; j++)
            G[i][j] = 0;
}

function init() {
    leftCanvas = document.getElementById("leftCanvas");
    rightCanvas = document.getElementById("rightCanvas");
    inputWidth = document.getElementById("inputWidth");
    inputHeight = document.getElementById("inputHeight");
    leftCanvas.height = leftCanvas.width = 360;
    rightCanvas.height = rightCanvas.width = 360;
    inputWidth.value = leftCanvas.width;
    inputHeight.value = leftCanvas.height;
    presentCanvasWidth = leftCanvas.width;
    presentCanvasHeight = leftCanvas.height;

    document.getElementById("ModalButton").addEventListener("click", function () {
        document.getElementById('modal-id').classList.add('active');
    });

    presentPoint = document.getElementById('presentPoint');
    presentPoint.innerText = 'presentPoint: (null,null)';

    startPoint = document.getElementById('startPoint');
    startPoint.innerText = 'targetPoint: (null,null)';

    targetPoint = document.getElementById('targetPoint');
    targetPoint.innerText = 'targetPoint: (null,null)';

    visitedPoints[0] = [];
    visitedPoints[1] = [];

    for (let i = 0; i < presentCanvasWidth; i++) {
        G[i] = new Array(presentCanvasHeight);
    }
    initG();

    let animationRadio = document.getElementsByClassName('AnimationRadio');
    animationRadio[0].checked = true;

    initCanvas(leftCanvas);
    initCanvas(rightCanvas);

    select = document.getElementsByClassName("form-select");

    initMaze();

    let delta = Math.floor(gridSize / 2);

    formMaze(0, delta, delta);
    copyMaze(0, 1);
    copyMaze(0, 2);
    drawMaze(leftCanvas, 0);
    drawMaze(rightCanvas, 1);
}

$('body').ready(function () {
    $('#MazeIcon').fadeIn(1000, function () {
        let b = $('b.animated');
        b.animate({left: '-=220px', opacity: '1'});
        b.animate({left: '+=40px'});
        b.animate({left: '-=20px'});
    });
});