/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// List All children - Node, int

var OUTPUT_DIR = "D:/METHODE/turf" ;
var reunion = new Object();

// Create a reunion instance
function createReunion(doc) {
    var reunion = new Object();

    var node = doc.query("//REUNION").get(0);
    var value = getValue(node, "INFOREUNION/NUMREUN") ;

    if ( value == "" ) {
        _print("Impossible de trouver la réunion");
        return null ;
    }
    reunion.number = value ;
    reunion.classe = "reunion" ;
    reunion.course = createCourse(doc) ;

    return reunion ;
}

// Create a course instance
function createCourse(doc) {
    var course = new Object();

    var node = doc.query("//COURSE").get(0);
    var value0 = getValue(node, "DESCRIPTION/CONDITION/PARI/TYPEPARI") ;
    var value1 = getValue(node, "DESCRIPTION/ENTETE/NUMCOUR") ;
    var value2 = getValue(node, "DESCRIPTION/ENTETE/NOMCOUR") ;
    var value3 = getValue(node, "DESCRIPTION/DISCIPLINE") ;
    var value4 = getValue(node, "DESCRIPTION/LIBDISCIPL") ;
    var value5 = getValue(node, "DESCRIPTION/CONDITION/CATEGORIE") ;
    var value6 = getValue(node, "DESCRIPTION/ENTETE/MONPRIX").replace(".", " ") + " €" ;
    var value7 = getValue(node, "DESCRIPTION/CONDITION/DISTANCE").replace(".", " ") + " m" ; ;
    var value8 = getValue(node, "DESCRIPTION/CONDITION/PARCOURS") ;
    var value9 = getValue(node, "DESCRIPTION/CONDITION/TCNCOND") ;


    if ( value0 == "" ) {
        _print("Impossible de trouver le nom de la course");
    }
    course.type = value0 ;
    course.number = value1 + ( (value1.equals("1")) ? "re" : "e" ) ;
    course.name = value2 ;
    course.classe = value3 ;
    course.discipline = value4 ;
    course.category = value5 ;
    course.price = value6 ;
    course.distance = value7 ;
    course.lap = value8 ;
    course.condition = value9 ;
    course.starters = createStarters(doc, value3) ;

    return course ;
}

// Create a starter instance
function createStarters(doc, value) {
    var node = doc.query("//CHEVAUX").get(0);

    var horses = new Array() ;
    var nods = node.query("//CHEVAL") ;
    for (var i = 0; i < nods.size(); i++) {
        var nod = nods.get(i);
        var horse = new Object();
        horse.number = getValue(nod, "NUMORDRE") ;
        horse.name = getValue(nod, "NOMCHEV") ;
        horse.sexRobe = getValue(nod, "SEXECHEV") + getValue(nod, "ROBECHEV") ;
        horse.age = getValue(nod, "AGECHEVA") ;
        horse.handicap = getValue(nod, "HANDICAP") ;
        horse.driver = getValue(nod, "JOCKEY/INITIALEJOCK") + " " + getValue(nod, "JOCKEY/NOMJOCK") ;
        horse.coach = getValue(nod, "ENTRAINEUR/INITIALEENTR") + " " + getValue(nod, "ENTRAINEUR/NOMENTR") ;
        horse.lane = getValue(nod, "POSCORDE") ;
        horse.owner = getValue(nod, "PROPRIETAIRE/INITIALEPROP") + " " + getValue(nod, "PROPRIETAIRE/NOMPROP") ;
        if (value.equals("P")) {
            horse.gains = getValue(nod, "GVICPLAT") ;
        } else if (value.equals("H")||value.equals("S")) {
            horse.gains = getValue(nod, "GTOTHAIE") ;
        } else if (value.equals("A")) {
            horse.gains = getValue(nod, "GTOTTROT") ;
        }
        horse.origin = getValue(nod, "ORIGINES/PERE") + " - " + getValue(nod, "ORIGINES/MERE") ;
        horse.music = getValue(nod, "MUSIQUES/MUSIQUE") ;
        horse.bet = getValue(nod, "COTEPROB") ;
        horse.records = getValue(nod, "HIPPREDUCCH") + " - " + getValue(nod, "HANDREDUCCH") + " - " + getValue(nod, "REDUCCH") ;

        if ( horse.number != "" )
            horses.push(horse) ;
    }

    return horses;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

function createXML() {

    var root = new Element("doc");
    var article = new Element("article");
    var ch = "................................" ;

    // Create a table for Reunion & Course display
    var tectableau0 = new Element("tectableau");

    // Display a table of header first
    var table00 = new Element("table");
    table00.addAttribute(new Attribute("class", "header_TQQ" )) ;

    // Create Reunion & Course Header
    if (reunion.numero != "") {
        var tr00 = new Element("tr");
        tr00.addAttribute(new Attribute("class", reunion.classe + "_" + reunion.course.classe + "_header0" )) ;
        var td00 = new Element("td");
        td00.addAttribute(new Attribute("class", "TQQ")) ;
        td00.appendChild(reunion.course.type ) ;
        tr00.appendChild(td00);
        table00.appendChild(tr00);

        var tr0 = new Element("tr");
        tr0.addAttribute(new Attribute("class", reunion.classe + "_" + reunion.course.classe + "_header1" )) ;
        var td01 = new Element("td");
        td01.addAttribute(new Attribute("class", reunion.course.classe)) ;
        td01.appendChild("REUNION " + reunion.number + " - " + reunion.course.number + " COURSE - " ) ;
        tr0.appendChild(td01);
        var td02 = new Element("td");
        td02.addAttribute(new Attribute("class", "courseName")) ;
        td02.appendChild(reunion.course.name) ;
        tr0.appendChild(td02);
        table00.appendChild(tr0);

        var tr1 = new Element("tr");
        tr1.addAttribute(new Attribute("class", reunion.classe + "_" + reunion.course.classe + "_header2" )) ;
        var td1 = new Element("td");
        td1.addAttribute(new Attribute("class", "courseCaracteristics")) ;
        td1.appendChild(reunion.course.discipline + " - " + reunion.course.category + " - " + reunion.course.price + " - " + reunion.course.distance + " - " + reunion.course.lap + " - " ) ;
        tr1.appendChild(td1);
        table00.appendChild(tr1);
    }
    tectableau0.appendChild(table00);
    article.appendChild(tectableau0);


    // Create a table for horses display
    var tectableau1 = new Element("tectableau");

    // Display a table of header first
    var table10 = new Element("table");
    table10.addAttribute(new Attribute("class", reunion.course.classe + "_header_starters" )) ;

    var tr2 = new Element("tr");
    tr2.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters" )) ;

    var td20 = new Element("td");
    td20.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_number")) ;
//    td20.addAttribute(new Attribute("colspan", "2")) ;
    td20.appendChild("N°") ;
    tr2.appendChild(td20) ;
    var td21 = new Element("td");
    td21.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_horse")) ;
    td21.appendChild("CHEVAUX") ;
    tr2.appendChild(td21) ;
    var td22 = new Element("td");
    td22.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_sexRobe")) ;
    td22.appendChild("S.R.") ;
    tr2.appendChild(td22) ;
    var td23 = new Element("td");
    td23.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_age")) ;
    td23.appendChild("AGE") ;
    tr2.appendChild(td23) ;
    var td24 = new Element("td");
    td24.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_handicap")) ;
    ( (reunion.course.classe.equals("A")) ? td24.appendChild("DIST.") : td24.appendChild("POIDS") ) ;
    tr2.appendChild(td24) ;
    var td25 = new Element("td");
    td25.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_drivers")) ;
    if (reunion.course.classe.equals("A")) td25.appendChild("DRIVERS"); else td25.appendChild("JOCKEYS") ;
    tr2.appendChild(td25) ;
    var td26 = new Element("td");
    td26.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_coachs")) ;
    td26.appendChild("ENTRAINEURS") ;
    tr2.appendChild(td26) ;
    if (reunion.course.classe.equals("P")) {
        var td27 = new Element("td");
        td27.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_lane")) ;
        td27.appendChild("CDE") ;
        tr2.appendChild(td27) ;
    }
    var td28 = new Element("td");
    td28.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_owner")) ;
    td28.appendChild("PROPRIETAIRES") ;
    tr2.appendChild(td28) ;
    var td29 = new Element("td");
    td29.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_gains")) ;
    td29.appendChild("GAINS") ;
    tr2.appendChild(td29) ;
    var td210 = new Element("td");
    td210.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_origin")) ;
    td210.appendChild("ORIGINES") ;
    tr2.appendChild(td210) ;
    var td211 = new Element("td");
    td211.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_music")) ;
    if (reunion.course.classe.equals("A")) td211.appendChild("TEMPS RECORDS") ; else td211.appendChild("DERNIERES PERFORMANCES") ;
    tr2.appendChild(td211) ;
    var td212 = new Element("td");
    td212.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_bet")) ;
    td212.appendChild("Cotes") ;
    tr2.appendChild(td212) ;

    table10.appendChild(tr2);
    tectableau1.appendChild(table10);

    var table11 = new Element("table") ;
    table11.addAttribute(new Attribute("class", reunion.course.classe + "_starters" )) ;

    for (var k in reunion.course.starters) {
        var starter = reunion.course.starters[k] ;
        var tr3 = new Element("tr");
        tr3.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters" )) ;

        var td30 = new Element("td");
        td30.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_number" )) ;
        td30.appendChild(starter.number) ;
        tr3.appendChild(td30) ;
        var td31 = new Element("td");
        td31.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_name" )) ;
        td31.appendChild(starter.name) ;
        tr3.appendChild(td31) ;
        var td32 = new Element("td");
        td32.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_sexRobe" )) ;
        td32.appendChild(starter.sexRobe) ;
        tr3.appendChild(td32) ;
        var td33 = new Element("td");
        td33.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_age" )) ;
        td33.appendChild(starter.age) ;
        tr3.appendChild(td33) ;
        var td34 = new Element("td");
        td34.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_handicap" )) ;
        td34.appendChild(starter.handicap) ;
        tr3.appendChild(td34) ;
        var td35 = new Element("td");
        td35.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_driver" )) ;
        td35.appendChild(starter.driver) ;
        tr3.appendChild(td35) ;
        var td36 = new Element("td");
        td36.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_coach" )) ;
        td36.appendChild(starter.coach) ;
        tr3.appendChild(td36) ;
        if (reunion.course.classe.equals("P")) {
            var td37 = new Element("td");
            td37.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_lane")) ;
            td37.appendChild(starter.lane) ;
            tr3.appendChild(td37) ;
        }
        var td38 = new Element("td");
        td38.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_owner" )) ;
        td38.appendChild(starter.owner) ;
        tr3.appendChild(td38) ;
        var td39 = new Element("td");
        td39.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_gains" )) ;
        td39.appendChild(starter.gains) ;
        tr3.appendChild(td39) ;
        var td310 = new Element("td");
        td310.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_origin" )) ;
        td310.appendChild(starter.origin) ;
        tr3.appendChild(td310) ;
        var td311 = new Element("td");
        td311.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_music" )) ;
        if (reunion.course.classe.equals("A")) td311.appendChild(starter.records) ; else td311.appendChild(starter.music) ;
        tr3.appendChild(td311) ;
        var td312 = new Element("td");
        td312.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_bet" )) ;
        td312.appendChild(starter.bet) ;
        tr3.appendChild(td312) ;

        table11.appendChild(tr3) ;
    }

    tectableau1.appendChild(table11);
    article.appendChild(tectableau1);

    // Create a table for conditions display
    var tectableau2 = new Element("tectableau");

    // Display a table of comments display
    var table20 = new Element("table");
    table20.addAttribute(new Attribute("class", reunion.course.classe + "_tab_conditions" )) ;

    // Create comments display if exists
    var tr20 = new Element("tr");
    tr20.addAttribute(new Attribute("class", reunion.course.classe + "_tab_head_conditions" )) ;
    var td20 = new Element("td");
    td20.addAttribute(new Attribute("class", reunion.course.classe + "_conditions" )) ;
    td20.appendChild(reunion.course.condition) ;
    tr20.appendChild(td20);
    table20.appendChild(tr20);

    tectableau2.appendChild(table20);
    article.appendChild(tectableau2);

    root.appendChild(article);
    return new Document(root);
}

function printXML(){
    _print("Reunion N° : " +  reunion.number );

    _print("=> Course - type : " + reunion.course.type) ;
    _print("=> Course - number : " + reunion.course.number) ;
    _print("=> Course - name : " + reunion.course.name) ;
    _print("=> Course - discipline : " + reunion.course.discipline) ;
    _print("=> Course - category : " + reunion.course.category) ;
    _print("=> Course - price : " + reunion.course.price) ;
    _print("=> Course - distance : " + reunion.course.distance) ;
    _print("=> Course - lap : " + reunion.course.lap) ;
    _print("=> Course - condition : " + reunion.course.condition) ;


     for ( var j in reunion.course.starters ) {
        var horse = reunion.course.starters[j] ;
        _print("=> Horse - numéro : " + horse.number + ", " + horse.name + ", " + horse.sexRobe + ", " + horse.age + ", " +
                horse.handicap + ", " + horse.driver + ", " + horse.coach + ", " + horse.lane + ", " + horse.owner + ", " +
                horse.gains + ", " + horse.origin + ", " + horse.music + ", " + horse.bet + ", " + horse.records) ;
     }
    _print("") ;
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "ISO-8859-1");
    serializer.setIndent(4);
    serializer.setMaxLength(64);
    serializer.write(document);
    os.close() ;
}

// Main
function main() {

    var file = _srcFile.getFile() ;

//    try {

    _print("Creating builder");
    var builder = new Builder();
    var doc = builder.build(file);
    
    _print("Parsing document");
    reunion = createReunion(doc);

//    _print("Printing xml");
//    printXML() ;

    _print("Creating xml");
    var document = createXML() ;

    _print("Writing xml");
    var file = new File(OUTPUT_DIR, _srcFile.getName().replace("ok","xml")) ;
    writeXML(document, file) ;

//    }
//    catch(e) {
//        _print(e) ;
//        return _FAIL ;
//    }

    return _OK ;
    //return _KEEP ;
}

// start & exit
_exit = main() ;

