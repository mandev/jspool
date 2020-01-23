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

var OUTPUT_DIR = ["D:/METHODE/PROD/Turf/", "D:/METHODE/QA/Turf/", "D:/METHODE/DEV/Turf/"] ;
var reunion = new Object();

// Create a reunion instance
function createReunion(doc) {
    var reunion = new Object();

    var node = doc.query("//REUNION").get(0);
    var value0 = getValue(node, "INFOREUNION/NUMREUN") ;
    var value1 = getValue(node, "INFOREUNION/DATCOPQR/@datenum") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver la réunion");
        return null ;
    }
    reunion.number = value0 ;
    reunion.classe = "reunion" ;
    reunion.date = value1 ;
    reunion.course = createCourse(doc) ;

    return reunion ;
}

// Create a course instance
function createCourse(doc) {
    var course = new Object();

    var node = doc.query("//COURSE").get(0);
//    Variable constante
//    var value0 = getValue(node, "DESCRIPTION/CONDITION/PARI/TYPEPARI") ;
    var value0 = "Quinté plus - Quarté plus - Tiercé - 2sur4 - Couplé - Trio - Couplé ordre - Trio ordre" ;
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
    course.number = value1 ;
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
        horse.sex = getValue(nod, "SEXECHEV") ;
        horse.robe = getValue(nod, "ROBECHEV") ;
        horse.age = getValue(nod, "AGECHEVA") ;
        horse.handicap = getValue(nod, "HANDICAP") ;
        horse.driver = trim(getValue(nod, "JOCKEY/INITIALEJOCK") + " " + getValue(nod, "JOCKEY/NOMJOCK")) ;
        horse.coach = trim(getValue(nod, "ENTRAINEUR/INITIALEENTR") + " " + getValue(nod, "ENTRAINEUR/NOMENTR")) ;
        horse.lane = getValue(nod, "POSCORDE") ;
        horse.owner = trim(getValue(nod, "PROPRIETAIRE/INITIALEPROP") + " " + getValue(nod, "PROPRIETAIRE/NOMPROP")) ;
        if (value.equals("P")) {
            horse.gains = getValue(nod, "GVICPLAT") ;
        } else if (value.equals("H")||value.equals("S")) {
            horse.gains = getValue(nod, "GTOTHAIE") ;
        } else if (value.equals("A")||value.equals("M")) {
            horse.gains = getValue(nod, "GTOTTROT") ;
        }
        horse.origin = trim(getValue(nod, "ORIGINES/PERE") + " - " + getValue(nod, "ORIGINES/MERE")) ;
        horse.music = getValue(nod, "MUSIQUES/MUSIQUE") ;
        horse.bet = getValue(nod, "COTEPROB") ;
        var hippo ;
        if (getValue(nod, "HIPPREDUCCH").equals("Vincennes")) hippo = "VI" ;
        else if (getValue(nod, "HIPPREDUCCH").equals("Enghien")) hippo = "EN" ;
        else if (getValue(nod, "HIPPREDUCCH").equals("Longchamp")) hippo = "LG" ;
        else hippo = "PR" ;
        horse.records = hippo + " - " + getValue(nod, "HANDREDUCCH") + " - " + getValue(nod, "REDUCCH") ;
        horse.team = getValue(nod, "NUMECURI") ;

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

function trim (myString) {
    return myString.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

function createXML() {

    var root = new Element("doc");
    root.addAttribute(new Attribute("lang", "fr")) ;

    var doc = new Document(root);
    doc.insertChild(new DocType("doc", "/SysConfig/LP/Rules/lp.dtd"), 0);
    doc.insertChild(new ProcessingInstruction("EM-dtdExt", "/SysConfig/LP/Rules/lp.dtx"), 1);
    doc.insertChild(new ProcessingInstruction("EM-templateName", "/SysConfig/LP/Templates/Standard.xml"), 2);
    doc.insertChild(new ProcessingInstruction("xml-stylesheet", "href=\"/SysConfig/LP/Styles/base.css\" type=\"text/css\""), 3);

    var article = new Element("article");

    // Create a table for Reunion & Course display
    var tables = new Element("tables");

    // Display a table of header first
    var table0 = new Element("table");
    table0.addAttribute(new Attribute("class", "header_TQQ" )) ;

    var thead0 = new Element("thead") ;
    thead0.addAttribute(new Attribute("class", "header_TQQ" )) ;

    // Create Reunion & Course Header
    if (reunion.number != "") {
        var tr0 = new Element("tr");
        tr0.addAttribute(new Attribute("class", reunion.classe + "_" + reunion.course.classe + "_header0" )) ;
        var td01 = new Element("td");
        td01.addAttribute(new Attribute("class", "img")) ;
        td01.addAttribute(new Attribute("rowspan", "3")) ;
        tr0.appendChild(td01);
        var td02 = new Element("td");
        td02.addAttribute(new Attribute("class", "TQQ")) ;
        td02.appendChild(reunion.course.type ) ;
        tr0.appendChild(td02);
        var td03 = new Element("td");
        td03.addAttribute(new Attribute("class", "img")) ;
        td03.addAttribute(new Attribute("rowspan", "3")) ;
        tr0.appendChild(td03);
        thead0.appendChild(tr0);

        var tr1 = new Element("tr");
        tr1.addAttribute(new Attribute("class", reunion.classe + "_" + reunion.course.classe + "_header1" )) ;
        var td11 = new Element("td");
        td11.addAttribute(new Attribute("class", "courseName")) ;
        var b11 = new Element("b");
        b11.appendChild("RÉUNION " + reunion.number + " - " + reunion.course.number);
        var b110 = new Element("sup");
        b110.appendChild((reunion.course.number.equals("1")) ? "re" : "e" );
        b11.appendChild(b110) ;
        b11.appendChild( " COURSE - " ) ;
        td11.appendChild(b11);
        td11.appendChild(reunion.course.name) ;
        tr1.appendChild(td11);
        thead0.appendChild(tr1);

        var tr2 = new Element("tr");
        tr2.addAttribute(new Attribute("class", reunion.classe + "_" + reunion.course.classe + "_header2" )) ;
        var td21 = new Element("td");
        td21.addAttribute(new Attribute("class", "courseCaracteristics")) ;
        td21.appendChild(reunion.course.discipline + " - " + reunion.course.category + " - " + reunion.course.price + " - " + reunion.course.distance + " - " + reunion.course.lap + " - " ) ;
        var b21 = new Element("b");
        b21.appendChild("Horaire de départ" ) ;
        td21.appendChild(b21);
        tr2.appendChild(td21);
        thead0.appendChild(tr2);
    }
    table0.appendChild(thead0);
    tables.appendChild(table0);


    // Display a table of starters
    var table1 = new Element("table") ;
    table1.addAttribute(new Attribute("class", reunion.course.classe + "_starters" )) ;

    // Display a table of header first
    var thead1 = new Element("thead");
    thead1.addAttribute(new Attribute("class", reunion.course.classe + "_header_starters" )) ;

    var tr3 = new Element("tr");
    tr3.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters" )) ;

    var td30 = new Element("td");
    td30.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_number")) ;
    td30.appendChild("N°") ;
    tr3.appendChild(td30) ;
    var td31 = new Element("td");
    td31.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_horse")) ;
    td31.appendChild("CHEVAUX") ;
    tr3.appendChild(td31) ;
    var td32 = new Element("td");
    td32.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_sexRobe")) ;
    td32.appendChild("S.R.") ;
    tr3.appendChild(td32) ;
    var td33 = new Element("td");
    td33.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_age")) ;
    td33.appendChild("AGE") ;
    tr3.appendChild(td33) ;
    var td34 = new Element("td");
    td34.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_handicap")) ;
    ( ((reunion.course.classe.equals("A"))||(reunion.course.classe.equals("M"))) ? td34.appendChild("DIST.") : td34.appendChild("POIDS") ) ;
    tr3.appendChild(td34) ;
    var td35 = new Element("td");
    td35.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_drivers")) ;
    if (reunion.course.classe.equals("A")) td35.appendChild("DRIVERS"); else td35.appendChild("JOCKEYS") ;
    tr3.appendChild(td35) ;
    var td36 = new Element("td");
    td36.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_coachs")) ;
    td36.appendChild("ENTRAINEURS") ;
    tr3.appendChild(td36) ;
    if (reunion.course.classe.equals("P")) {
        var td37 = new Element("td");
        td37.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_lane")) ;
        td37.appendChild("CDE") ;
        tr3.appendChild(td37) ;
    }
    var td38 = new Element("td");
    td38.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_owner")) ;
    td38.appendChild("PROPRIETAIRES") ;
    tr3.appendChild(td38) ;
    var td39 = new Element("td");
    td39.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_gains")) ;
    td39.appendChild("GAINS") ;
    tr3.appendChild(td39) ;
    var td310 = new Element("td");
    td310.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_origin")) ;
    td310.appendChild("ORIGINES") ;
    tr3.appendChild(td310) ;
    var td311 = new Element("td");
    td311.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_music")) ;
    if (reunion.course.classe.equals("A")) td311.appendChild("TEMPS RECORDS") ; else td311.appendChild("DERNIERES PERFORMANCES") ;
    tr3.appendChild(td311) ;
    var td312 = new Element("td");
    td312.addAttribute(new Attribute("class", reunion.course.classe + "_tab_header_starters_bet")) ;
    td312.appendChild("Cotes") ;
    tr3.appendChild(td312) ;

    thead1.appendChild(tr3);
    table1.appendChild(thead1);

    // Display starters
    for (var k in reunion.course.starters) {
        var starter = reunion.course.starters[k] ;
        var tr4 = new Element("tr");
        tr4.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters" )) ;

        var td40 = new Element("td");
        td40.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_number" )) ;
        td40.appendChild(starter.number) ;
        tr4.appendChild(td40) ;
        var td41 = new Element("td");
        td41.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_name" )) ;
        if (starter.team != "") td41.appendChild(starter.name + " - (E" + starter.team + ")") ;
		else td41.appendChild(starter.name) ;
        tr4.appendChild(td41) ;
        var td42 = new Element("td");
        td42.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_sexRobe" )) ;
        td42.appendChild(starter.sex + starter.robe) ;
        tr4.appendChild(td42) ;
        var td43 = new Element("td");
        td43.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_age" )) ;
        td43.appendChild(starter.age) ;
        tr4.appendChild(td43) ;
        var td44 = new Element("td");
        td44.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_handicap" )) ;
        td44.appendChild(starter.handicap) ;
        tr4.appendChild(td44) ;
        var td45 = new Element("td");
        td45.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_driver" )) ;
        td45.appendChild(starter.driver) ;
        tr4.appendChild(td45) ;
        var td46 = new Element("td");
        td46.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_coach" )) ;
        td46.appendChild(starter.coach) ;
        tr4.appendChild(td46) ;
        if (reunion.course.classe.equals("P")) {
            var td47 = new Element("td");
            td47.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_lane")) ;
            td47.appendChild(starter.lane) ;
            tr4.appendChild(td47) ;
        }
        var td48 = new Element("td");
        td48.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_owner" )) ;
        td48.appendChild(starter.owner) ;
        tr4.appendChild(td48) ;
        var td49 = new Element("td");
        td49.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_gains" )) ;
        td49.appendChild(starter.gains.replace("."," ")) ;
        tr4.appendChild(td49) ;
        var td410 = new Element("td");
        td410.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_origin" )) ;
        td410.appendChild(starter.origin) ;
        tr4.appendChild(td410) ;
        var td411 = new Element("td");
        td411.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_music" )) ;
        if (reunion.course.classe.equals("A")) td411.appendChild(starter.records) ; else td411.appendChild(starter.music) ;
        tr4.appendChild(td411) ;
        var td412 = new Element("td");
        td412.addAttribute(new Attribute("class", reunion.course.classe + "_tab_starters_bet" )) ;
     //   td412.appendChild(starter.bet) ;
        tr4.appendChild(td412) ;

        table1.appendChild(tr4) ;
    }

    tables.appendChild(table1);

    // Display a table of comments display
    var table2 = new Element("table");
    table2.addAttribute(new Attribute("class", reunion.course.classe + "_conditions" )) ;

    // Create comments display if exists
    var tr5 = new Element("tr");
    tr5.addAttribute(new Attribute("class", reunion.course.classe + "_tab_head_conditions" )) ;
    var td50 = new Element("td");
    td50.addAttribute(new Attribute("class", reunion.course.classe + "_tab_conditions" )) ;
 //   td50.appendChild(reunion.course.condition) ;
    tr5.appendChild(td50);
    var td51 = new Element("td");
    td51.addAttribute(new Attribute("class", reunion.course.classe + "_tab_stars" )) ;
    tr5.appendChild(td51);
    table2.appendChild(tr5);

    tables.appendChild(table2);

    article.appendChild(tables);

    root.appendChild(article);
    return doc;
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
        _print("=> Horse - numéro : " + horse.number + ", " + horse.name + ", " + horse.sex + ", " + horse.robe + ", " +
                horse.age + ", " + horse.handicap + ", " + horse.driver + ", " + horse.coach + ", " + horse.lane + ", " +
                horse.owner + ", " + horse.gains + ", " + horse.origin + ", " + horse.music + ", " + horse.bet + ", " + horse.records) ;
     }
    _print("") ;
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "UTF-8");
//    serializer.setIndent(4);
//    serializer.setMaxLength(64);
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
    for (i in OUTPUT_DIR) {
    	var file = new File(OUTPUT_DIR[i], (reunion.date + "_" + _srcFile.getName()).replace("ok","xml")) ;
    	writeXML(document, file) ;
    }

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

