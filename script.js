/**
 * Sebastian Fojcik
 */
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

const width = document.getElementById("myCanvas").width;
const height = document.getElementById("myCanvas").height;
const PI = Math.PI;
cos = Math.cos;
sin = Math.sin;

document.addEventListener("keydown", keyPressed, false);
document.addEventListener("keyup", keyReleased, false);
document.addEventListener("mousedown", mousePressed, false);
document.addEventListener("mouseup", mouseReleased, false);
canvas.addEventListener("mousemove", mouseMoved, false);
document.addEventListener("wheel", wheel, false);

const myConsole = document.getElementById("console");
myConsole.addEventListener("focus", function() { document.removeEventListener("keydown", keyPressed, false); });
myConsole.addEventListener("focusout", function() { document.addEventListener("keydown", keyPressed, false); });

let RIGHT, LEFT, UP, DOWN, PLUS, MINUS, CLICK = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Klasa pomicnicza. 
 */
class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    mul(n) {
        return new Vector3(this.x*n, this.y*n, this.z*n);
    }
    add(a) {
        return new Vector3(this.x+a.x, this.y+a.y, this.z+a.z);
    }
    copy() {
        return new Vector3(this.x, this.y, this.z);
    }
    assign(a) {
        this.x = a.x;
        this.y = a.y;
        this.z = a.z;
    }
    equals(a) {
        return this.x==a.x && this.y==a.y && this.z==a.z;
    }
}
/**
 * Abstrakcyjna bryła składająca się z tablicy odcinków
 */
class Shape {
    constructor(v = []) {
        this.v = v;             // tablica z odcinkami (krawędziami)
        this.origins = [];      // punkty charakterystyczne tworzące figurę
    }

    addLine(x1, y1, z1, x2, y2, z2, color="black", size=1) {
        this.v.push({p1: new Vector3(x1, y1, z1), p2: new Vector3(x2, y2, z2), color:color, size:size});
    }
}

/**
 * Graniastosłup od punktu 'a' do 'b' (boki wzdłuż osi)
 */
class Prism extends Shape {
    constructor(a, b) {
        super();
        this.origins = [a, new Vector3(a.x, a.y, b.z), new Vector3(b.x, a.y, b.z), new Vector3(b.x, a.y, a.z),
                        b, new Vector3(a.x, b.y, b.z), new Vector3(a.x, b.y, a.z), new Vector3(b.x, b.y, a.z)];
        this.a = a;
        this.b = b;
        // linie z punktu 'a'
        this.addLine(a.x, a.y, a.z, b.x, a.y, a.z);
        this.addLine(a.x, a.y, a.z, a.x, b.y, a.z);
        this.addLine(a.x, a.y, a.z, a.x, a.y, b.z);
        // linie z punktu nad 'a'
        this.addLine(a.x, b.y, a.z, b.x, b.y, a.z);
        this.addLine(a.x, b.y, a.z, a.x, b.y, b.z);
        // linie z punktu 'b'
        this.addLine(b.x, b.y, b.z, a.x, b.y, b.z);
        this.addLine(b.x, b.y, b.z, b.x, a.y, b.z);
        this.addLine(b.x, b.y, b.z, b.x, b.y, a.z);
        // linie spod punktu 'b'
        this.addLine(b.x, a.y, b.z, a.x, a.y, b.z);
        this.addLine(b.x, a.y, b.z, b.x, a.y, a.z);
        // pozostałe linie
        this.addLine(a.x, a.y, b.z, a.x, b.y, b.z);
        this.addLine(b.x, a.y, a.z, b.x, b.y, a.z);
    }
}

/**
 * Klasa świata gry, przechowująca wszystkie rysowane bryły.
 */
class World {
    constructor(center) {
        this.shapes = [];
        this.center = new Vector3(0, 0, 0); // środek świata (względem którego obraca się kamera)
        this.rot = new Vector3(0, 0, 0);    // Obrót względem konkretnych osi
    }
    addShape( shape ) {
        this.shapes.push(shape);
    }
    render() {
        this.shapes.forEach( render );
    }
}

/**
 * Turtle
 */
class Turtle extends Shape {
    constructor() {
        super()
        this.reset();
    }
    reset() {
        this.v = []
        this.pos = new Vector3(0, 0, 0);
        this.rot = new Vector3(0, -1, 0); // wektor kierunku patrzenia żółwia (jednostkowy)
        this.penDown = true;
        this.penColor = "black";
        this.penSize = 1;
        this.hidden = false;
        this.trim = true;
    }
}

// Świat
const world = new World();
const turtle = new Turtle();
world.addShape(turtle);

/**
 * Tworzenie terrarium
 */
terrarium = new Prism(new Vector3(-500, -500, -500), new Vector3(500, 500, 500), false)
world.addShape(terrarium);

let d = 1000;                   // odległość od ekranu (wpływa na FOV).
let t = new Vector3(0,0,1800);  // przemieszczenie kamery od swojej początkowej pozycji.
let mouseX, mouseY;             // współrzędne kursora w poprzedniej klatce
/**
 * UWAGA dotycząca obrotu kamery i przemieszczenia kamery.
 * W rzeczywistości kamera zawsze znajduje się w punkcie (0,0,-d), a ekran w (0,0,0).
 * Obrót kamery polega na obrocie wszystkich obiektów świata względem niej.
 * Przemieszczenie kamery również polega na przemieszczeniu wszystkich obiektów świata.
 * (kamera zawsze pozostaje bez zmian w (0,0,-d) i nadal "patrzy" wzdłuż osi OZ+)
 */

/**
 * Funkcja uruchamiana przy uruchomieniu gry.
 */
function setup() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    draw();
}

/* RESETOWANIE WSZYSTKIEGO */
function reset(){
    location.reload();
};

var commands = []
function run() {
    const code = document.getElementById("console").value;
    const lines = code.split(/\r?\n/);
    commands.push(...lines);
    executeAll(commands);
}

async function executeAll(commands) {
    restore();
    for(cmd of commands) {
        cmd = cmd.split(' ');
        await execute(cmd);
    }
}

function restore() {
    turtle.reset();
}

function getTurtleModel() {
    if(turtle.hidden) return new Shape();
    const tur = new Shape();
    const rot = turtle.rot;
    let n = 25;
    let newPos = new Vector3(turtle.pos.x + n*rot.x, turtle.pos.y + n*rot.y, turtle.pos.z + n*rot.z);
    tur.addLine(turtle.pos.x, turtle.pos.y, turtle.pos.z, newPos.x, newPos.y, newPos.z, "#00FF00", 4);
    n = 10;
    newPos2 = new Vector3(newPos.x + n*rot.x, newPos.y + n*rot.y, newPos.z + n*rot.z);
    tur.addLine(newPos.x, newPos.y, newPos.z, newPos2.x, newPos2.y, newPos2.z, "#FF0000", 6);
    return tur;
}

async function execute(cmd) {
    switch(cmd[0].toLowerCase()) {
        case 'goto':          goTo(cmd);     break;
        case 'forward':       forward(cmd);  break;
        case 'rotx':          rotX(cmd);     break;
        case 'roty':          rotY(cmd);     break;
        case 'rotz':          rotZ(cmd);     break;
        case 'setrot':        setRot(cmd);   break;
        case 'down':          down(cmd);     break;
        case 'repeat':  await repeat(cmd);   break;
        case 'wait':    await wait(cmd);     break;
        case 'penup':         penup(cmd);    break;
        case 'pendown':       pendown(cmd);  break;
        case 'pensize':       pensize(cmd);  break;
        case 'pencolor':      pencolor(cmd); break;
        case 'clear':          clear(cmd);   break;
        case 'show':          show(cmd);     break;
        case 'hide':          hide(cmd);     break;
        case 'trim':          trim(cmd);     break;
    }
}

function goTo(cmd) {
    const x = parseInt(cmd[1]);
    const y = parseInt(cmd[2]);
    const z = parseInt(cmd[3]);
    const newPos = new Vector3(x, y, z);
    const pos = turtle.pos;
    turtle.pos = newPos.copy();
    drawLine(pos, newPos);
}

function forward(cmd) {
    const n = parseInt(cmd[1]);
    const alphaX = (turtle.rot.x) * PI/180;
    const alphaY = (turtle.rot.y) * PI/180;
    const alphaZ = (turtle.rot.z) * PI/180;

    const pos = turtle.pos;
    const rot = turtle.rot;
    let newPos = new Vector3(pos.x + n*rot.x, pos.y + n*rot.y, pos.z + n*rot.z);
    turtle.pos = newPos.copy();
    drawLine(pos, newPos);
}

/**
 * Dodaje linię narysowaną przez żółwia
 */
function drawLine(pos, newPos) {
    let segmentVisible = true;
    if(turtle.trim)
        segmentVisible = trimSegmentToTerrarium(pos, newPos);

    if(turtle.penDown && segmentVisible)
        turtle.addLine(pos.x, pos.y, pos.z, newPos.x, newPos.y, newPos.z, turtle.penColor, turtle.penSize);
}

/**
 * Przytnij odcinek a, b do granic terrarium.
 * Terrarium jest prostopadłościanem, w którym wierzchołki są ponumerowane następująco:
 * Załóżny kostkę narysowaną wzdłuż osi od punktu [-1,-1,-1] do [1,1,1] wtedy:
 * 0:[-1,-1,-1], 1:[-1,-1,1], 2:[1,-1,1], 3:[1,-1,-1]  <- górna podstawa
 * 4:[1,1,1], 5:[-1,1,1], 6:[-1,1,-1], 7:[1,1,-1]      <- dolna podstawa
 * Oś X jest skierowana od lewej do prawej.
 * Oś Y jest skierowana od góry w dół.
 * Oś Z jest skierowana od kamery w dal.
 */
function trimSegmentToTerrarium(a, b) {
    let p1, p2, p3, p4;
    const origins = terrarium.origins;
    let result = 0;
    // Góra
    p1 = origins[0];
    p2 = origins[1];
    p3 = origins[2];
    p4 = origins[3];
    result += trimSegmentToPlane(a, b, p1, p2, p3, p4);
    // Dół
    p1 = origins[4];
    p2 = origins[5];
    p3 = origins[6];
    p4 = origins[7];
    result += trimSegmentToPlane(a, b, p1, p2, p3, p4);
    // Prawo
    p1 = origins[4];
    p2 = origins[7];
    p3 = origins[3];
    p4 = origins[2];
    result += trimSegmentToPlane(a, b, p1, p2, p3, p4);
    // Lewo
    p1 = origins[0];
    p2 = origins[6];
    p3 = origins[5];
    p4 = origins[1];
    result += trimSegmentToPlane(a, b, p1, p2, p3, p4);
    // Przód
    p1 = origins[0];
    p2 = origins[3];
    p3 = origins[7];
    p4 = origins[6];
    result += trimSegmentToPlane(a, b, p1, p2, p3, p4);
    // // Tył
    p1 = origins[1];
    p2 = origins[5];
    p3 = origins[4];
    p4 = origins[2];
    result += trimSegmentToPlane(a, b, p1, p2, p3, p4);

    // Jeśli jedna z metod przycinających uzna, że odcinek leży w całości na zewnętrznej stronie
    // płaszczyzny, to zwróci 1. Wtedy wiemy, że na pewno odcinek leży poza terrarium.
    return result == 0;
}

/**
 * Przycina odcinek do fragmentu płaszczyzny wyznaczonej przez punkty p1,p2,p3,p4 
 */
function trimSegmentToPlane(a, b, p1, p2, p3, p4) {
    const p1p2 = vectorBetween(p1, p2);
    const p1p3 = vectorBetween(p1, p3);
    const n = crossProcuct(p1p2, p1p3); // wektor prostopadły do powierzchni, skierowany do wnętrza terrarium
    const ab = vectorBetween(a,b);

    const p1a = vectorBetween(p1, a);
    const p1b = vectorBetween(p1, b);

    /**
     * Jeśli płaszczyzna jest wyznaczona przez punkty p1, p2, p3, to wnętrze terrarium
     * jest wyznaczane przez wektor n, zgodnie z regułą prawej dłoni po trzech kolejnych punktach.
     * Oznacza to, że jeśli p1, p2, p3 są w płaszczyźnie poziomej ustawione zgodnie z ruchem
     * wskazówek zegara, to WNĘTRZE będzie POD płaszczyzną (kciuk skierowany w dół)
     */
    const sideA = Math.sign(dotProduct(n, p1a)); // strona płaszczyzny, po której leży punkt
    const sideB = Math.sign(dotProduct(n, p1b)); // strona płaszczyzny, po której leży punkt

    // odcinek ab równoległy do płaszczyzny
    if(dotProduct(n, ab) == 0) {
        if(sideA == -1 && sideB == -1) {
            // console.log("odcinek równoległy do płaszczyzny i poza płaszczyzną")
            return 1;
        }
        // console.log("odcinek równoległy do płaszczyzny");
        // Odcinka leżącego na płaszczyźnie nie trzeba przycinać do płaszczyzna, bo
        // zostanie on i tak przycięty przez pozostałe płaszczyzny prostopadłościanu.
        return 0;
    }


    if(sideA == sideB) {
        if(sideA == -1 && sideB == -1) {
            // console.log("odcinek nie przecina płaszczyzny i poza płaszczyzną")
            return 1;
        }
        // console.log("odcinek nie przecina płaszczyzny")
        return 0;
    }

    // Wyznaczanie punktu przecięcia
    const t = -dotProduct(n, p1a) / dotProduct(n, ab);
    const p0 = ab.mul(t).add(a);

    /**
     * Ucinamy odcinek do punktu przecięcia.
     * Nie sprawdzamy, czy punkt należy do wycinka płaszczyzny. (ważne!)
     */
    if(sideA == -1) {
        a.assign(p0);
    }
    if(sideB == -1) {
        b.assign(p0);
    }

    return 0;
}

/**
 * Sprawdzenie czy punkt 'p' leży wewnątrz prostokąta a,b,c,d
 */
function isInRect(p, a, b, c, d) {
    const ap = vectorBetween(a,p);
    const ab = vectorBetween(a,b);
    const ad = vectorBetween(a,d);
    const apab = dotProduct(ap, ab);
    const abab = dotProduct(ab, ab);
    const apad = dotProduct(ap, ad);
    const adad = dotProduct(ad, ad);
    return 0 <= apab && apab <= abab && 0 <= apad && apad <= adad;
}

/**
 * Wyznaczenie wektora od punktu 'a' do 'b'
 */
function vectorBetween(a, b) {
    return new Vector3(b.x-a.x, b.y-a.y, b.z-a.z);
}
/**
 * Iloczyn skalarny wektorów a * b
 */
function dotProduct(a, b) {
    return a.x*b.x + a.y*b.y + a.z*b.z;
}
/**
 * Iloczyn wektorowy wektorów a x b
 */
function crossProcuct(a, b) {
    return new Vector3(det2(a.y, a.z, b.y, b.z), -det2(a.x, a.z, b.x, b.z), det2(a.x, a.y, b.x, b.y) );
}
/**                     
 * Wyznacznik macierzy  |a1 a2|
 *                      |b1 b2|
 */
function det2(a1, a2, b1, b2) {
    return a1*b2 - a2*b1;
}

function rotX(cmd) {
    const n = parseInt(cmd[1]);
    const angle = n * PI/180;
    turtle.rot = rotateX(turtle.rot, angle, new Vector3(0,0,0));
}
function rotY(cmd) {
    const n = parseInt(cmd[1]);
    const angle = n * PI/180;
    turtle.rot = rotateY(turtle.rot, angle, new Vector3(0,0,0));
}
function rotZ(cmd) {
    const n = parseInt(cmd[1]);
    const angle = n * PI/180;
    turtle.rot = rotateZ(turtle.rot, angle, new Vector3(0,0,0));
}
function setRot(cmd) {
    const x = parseInt(cmd[1]);
    const y = parseInt(cmd[2]);
    const z = parseInt(cmd[3]);
    const rot = new Vector3(x,y,z);
    turtle.rot = norm(rot);
}
function norm(a) {
    const len = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
    return new Vector3(a.x/len, a.y/len, a.z/len);
}

async function wait(cmd) {
    await sleep(cmd[1]);
}

// repeat [any commands]
async function repeat(cmd) {
    const n = cmd[1];

    for(var i = 0; i < n; i++) {
        for(var j = 2; j < cmd.length; j++) {
            await execute(cmd.slice(j, cmd.length));
        }
    }
}
// penup
function penup(cmd) {
    turtle.penDown = false;
}
// pendown
function pendown(cmd) {
    turtle.penDown = true;
}
// pencolor [color]
function pencolor(cmd) {
    turtle.penColor = cmd[1];
}
// pensize [size]
function pensize(cmd) {
    turtle.penSize = cmd[1];
}
function clear(cmd) {
    turtle.v = [];
}
// show
function show(cmd) {
    turtle.hidden = false;
}
// hide
function hide(cmd) {
    turtle.hidden = true;
}
// trim [on|off]
function trim(cmd) {
    const n = cmd[1];
    if(n == "on") turtle.trim = true;
    if(n == "off") turtle.trim = false;
}

/**
 * Główna pętla gry.
 */
function draw() {
    window.requestAnimationFrame(draw);
    // Wyczyść ekran.
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(width/2, height/2);

    evalKeys();
    world.render();
    const turtleModel = getTurtleModel();
    render(turtleModel);

    ctx.restore();
    showCredits();
}

function showCredits() {
    ctx.save();
    ctx.font = "12px Lucida Console";
    ctx.fillStyle = "black"
    ctx.fillText("Wersja 1.0   Sebastian Fojcik", 5, 15);
    ctx.restore();
}

/**
 * Wykonanie akcji, gdy klawisz jest wciśnięty
 */
function evalKeys() {
    if(PLUS) {
        t.z -= 10;
    }
    if(MINUS) {
        t.z += 10;
    }
    if(LEFT) {
        world.rot.y -= PI/180;
    }
    if(RIGHT) {
        world.rot.y += PI/180;
    }
    if(UP) {
        world.rot.x -= PI/180;
    }
    if(DOWN) {
        world.rot.x += PI/180;
    }
}
function keyPressed(e) {
    switch(e.key) {
        case "ArrowRight": RIGHT = true; break;
        case "ArrowLeft":  LEFT = true; break;
        case "ArrowUp":    UP = true; break;
        case "ArrowDown":  DOWN = true; break;
        case "+":          PLUS = true; break;
        case "-":          MINUS = true; break;
    }
}
function keyReleased(e) {
    switch(e.key) {
        case "ArrowRight": RIGHT = false; break;
        case "ArrowLeft":  LEFT = false; break;
        case "ArrowUp":    UP = false; break;
        case "ArrowDown":  DOWN = false; break;
        case "+":          PLUS = false; break;
        case "-":          MINUS = false; break;
    }
}
function mousePressed(e) {
    CLICK = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
}
function mouseReleased(e) {
    CLICK = false;
}
function mouseMoved(e) {
    if(CLICK) {
        const x = e.clientX;
        const y = e.clientY;
        world.rot.x += (y - mouseY) * PI/360;
        world.rot.y += (x - mouseX) * PI/360;
        mouseX = x;
        mouseY = y;
    }
}
function wheel(e) {
    const delta = Math.sign(e.deltaY);
    t.z += 80 * delta;
}

function perspectiveAll(v) {
    const v2 = [];
    for(let i = 0; i < v.length; i++) {
        const p = perspective(v[i]);
        if( p != null ) {
            v2.push(p);
        }
    }

    return v2;
}
/**
 * Funkcja rzutuje oba końce odcinka na ekran stosując rzut perspektywiczny.
 */
function perspective(line) {
    // Klonuję dwa punkty
    const p1 = new Vector3(line.p1.x, line.p1.y, line.p1.z);
    const p2 = new Vector3(line.p2.x, line.p2.y, line.p2.z);
    // ---------------------------------------------------
    // Eliminuje anomalie, gdy punkt jest za kamerą.
    // Wyznaczam punkt przecięcia prostej przechodzącej przez p1 i p2 z płaszczyzną z = -d.
    // Punkt, który jest za kamerą ustawiam 1 punkt przed nią, aby nie było anomalii. 
    /* Równanie (1). Przecięcie p1(x1,y1,z1) i p2(x2,y2,z2) z płaszczyzną z = -d. Szukamy (x', y', z')
       { x' = x1 + t*(x2-x1)
       { y' = y1 + t*(y2-y1)
       { z' = z1 + t*(z2-z1)
       { z' = -d
    */

    // p1 za kamerą
    if(p1.z <= -d) {
        const t = (-d-p1.z)/(p2.z-p1.z);
        p1.x = p1.x + t*(p2.x-p1.x);
        p1.y = p1.y + t*(p2.y-p1.y);
        p1.z = -d + 1;
    }
    // p2 za kamerą
    if(p2.z <= -d) {
        const t = (-d-p2.z)/(p1.z-p2.z);
        p2.x = p2.x + t*(p1.x-p2.x);
        p2.y = p2.y + t*(p1.y-p2.y);
        p2.z = -d + 1;
    }
    // ---------------------------------------------------

    // Nowe wartości (prim) po zrzutowaniu
    const p1p = new Vector3(0,0,0);
    const p2p = new Vector3(0,0,0);

    // Obserwator znajduje się w punkcie (0,0,-d)
    // Rzutuję punkt (x,y,z) na ekran mnożąc przez macierz
    // |1  0   0   0|   |x|   |  x  | normalizacja   |x*d/(z+d)| <-- x
    // |0  1   0   0| * |y| = |  y  | -------------> |y*d/(z+d)| <-- y
    // |0  0   0   0|   |z|   |  0  |                |    0    |
    // |0  0  1/d  0|   |1|   |z/d+1|                |    1    |

    // Rzutuję p1 na ekran
    p1p.x = p1.x*d/(p1.z+d);
    p1p.y = p1.y*d/(p1.z+d);

    // Rzutuję p2 na ekran
    p2p.x = p2.x*d/(p2.z+d);
    p2p.y = p2.y*d/(p2.z+d);

    return {p1: p1p, p2: p2p};
}

function translateAll(shape) {
    for(let i = 0; i < shape.v.length; i++)
        shape.v[i] = {p1: translate(shape.v[i].p1), p2: translate(shape.v[i].p2)};

    for(let i = 0; i < shape.origins.length; i++)
        shape.origins[i] = translate(shape.origins[i]);
}
/**
 * Przesuwa punkt p o zadany wektor t.
 */
function translate(p) {
    return new Vector3(p.x+t.x, p.y+t.y, p.z+t.z);
}

function rotateAll(shape) {
    for(let i = 0; i < shape.v.length; i++) {
        shape.v[i] = {p1: rotateY(shape.v[i].p1), p2: rotateY(shape.v[i].p2)};
        shape.v[i] = {p1: rotateX(shape.v[i].p1), p2: rotateX(shape.v[i].p2)};
    }

    for(let i = 0; i < shape.origins.length; i++) {
        shape.origins[i] = rotateY(shape.origins[i]);
        shape.origins[i] = rotateX(shape.origins[i]);
    }
}

/**
 * Obraca punkt 'p' o kąt 'angle' (w radianach) względem kamery (i osi poziomej OX)
 * x', y', z' - współrzędne punktu po obrocie
 * x, z - współrzędne punktu przed obrotem
 * x0, y0, z0 - punkt względem którego obracam
 * |x'|   |  1    0         0    |   |   x    |   |0 |
 * |y'| = |  0  cos(a)   -sin(a) | * |(y - y0)| + |y0|
 * |z'|   |  0  sin(a)   cos(a)  |   |(z - z0)|   |z0|
 */
function rotateX(p, angle, p0) {
    const p2 = new Vector3(0,0,0);
    p0 = p0 || new Vector3(0,0,0);
    angle = angle || world.rot.x;

    p2.x = p.x;
    p2.y = (p.y - p0.y)*cos(angle) - (p.z - p0.z)*sin(angle) + p0.y;
    p2.z = (p.y - p0.y)*sin(angle) + (p.z - p0.z)*cos(angle) + p0.z;

    return p2;
}
/**
 * Obraca punkt 'p' o kąt 'angle' (w radianach) względem kamery (i osi pionowej OY)
 * x', y', z' - współrzędne punktu po obrocie
 * x, z - współrzędne punktu przed obrotem
 * x0, y0, z0 - punkt względem którego obracam
 * |x'|   |cos(a)  0  -sin(a)|   |(x - x0)|   |x0|
 * |y'| = |   0    1     0   | * |   y    | + |0 |
 * |z'|   |sin(a)  0   cos(a)|   |(z - z0)|   |z0|
 */
function rotateY(p, angle, p0) {
    const p2 = new Vector3(0,0,0);    
    p0 = p0 || new Vector3(0,0,0);
    angle = angle || world.rot.y;

    p2.x = (p.x - p0.x)*cos(angle) - (p.z - p0.z)*sin(angle) + p0.x;
    p2.y = p.y;
    p2.z = (p.x - p0.x)*sin(angle) + (p.z - p0.z)*cos(angle) + p0.z;

    return p2;
}
/**
 * Obraca punkt 'p' o kąt 'angle' (w radianach) względem kamery (i osi głębokości OZ)
 * x', y', z' - współrzędne punktu po obrocie
 * x, z - współrzędne punktu przed obrotem
 * x0, y0, z0 - punkt względem którego obracam
 * |x'|   |cos(a) -sin(a)   0  |   |(x - x0)|   |x0|
 * |y'| = |sin(a)  cos(a)   0  | * |(y - y0)| + |y0|
 * |z'|   |  0       0      1  |   |   z    |   |0 |
 */
function rotateZ(p, angle, p0) {
    const p2 = new Vector3(0,0,0);
    p0 = p0 || new Vector3(0,0,0);
    angle = angle || world.rot.z;

    p2.x = (p.x - p0.x)*cos(angle) - (p.y - p0.y)*sin(angle) + p0.x;
    p2.y = (p.x - p0.x)*sin(angle) + (p.y - p0.y)*cos(angle) + p0.y;
    p2.z = p.z;

    return p2;
}

/**
 * Rysuje figurę składającą się z prostych odcinków na ekranie.
 * Funkcja wykonuje renderowanie w 4 krokach:
 * (1) Aplikuje wektor przemieszczenia do wszystkich punktów (jeśli gracz się przemieścił)
 * (2) Aplikuje obrót do wszystkich punktów (jeśli gracz obrócił kamerą)
 * (3) Wykonuje rzut perspektywiczny wszystkich punktów na ekran (ta operacja nie zmienia współrzędnych w figurze) 
 * (4) Rysuje odcinki zrzutowane do dwóch wymiarów (x,y) na ekranie.
 */
function render(shape) {
    const copy = JSON.parse(JSON.stringify(shape))
    rotateAll(copy);
    translateAll(copy);

    vv = perspectiveAll(copy.v);
    for( let i = 0; i < vv.length; i++ ) {
        ctx.lineWidth = shape.v[i].size;
        ctx.strokeStyle = shape.v[i].color;
        line( vv[i].p1.x, vv[i].p1.y, vv[i].p2.x, vv[i].p2.y );
    }
}

/**
 * Rysuje odcinek na ekranie (canvasie), od (x1,y1) do (x2,y2).
 */
function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

setup();

function ex1() {
    document.getElementById("console").value = `rotx 45
pencolor #FF0000
repeat 180 forward 300 rotz 30 forward 100 rotz -60 forward 150 rotz 30 penup goto 0 0 0 pendown rotz 2
setrot 0 -1 0
penup
goto 0 0 -200
pendown
rotx -30
pencolor #0000FF
repeat 180 forward 300 rotz 30 forward 100 rotz -60 forward 150 rotz 30 penup goto 0 0 -200 pendown rotz 2`;
}

function ex2() {
    document.getElementById("console").value = `trim off
pencolor #0000FF
repeat 50 forward 1000 rotz 123
setrot 0 -1 0
rotx -90
pencolor #FF0000
trim on
repeat 50 forward 1000 rotx -123`;
}
function ex3() {
    document.getElementById("console").value = `pencolor #0000FF
repeat 10000 wait 10 clear rotx 1 repeat 180 forward 300 rotz 30 forward 150 rotz -60 forward 150 rotz 30 penup goto 0 0 0 pendown rotz 2`;
}