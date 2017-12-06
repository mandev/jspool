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
//_print("srcDir : " + _srcDir) ;
//_print("srcFile : " + _srcFile.getPath()) ;

// List All children - Node, int

var OUTPUT_DIR = ["D:/METHODE/PROD/Turf/", "D:/METHODE/QA/Turf/", "D:/METHODE/DEV/Turf/"] ;
var reunion = new Object() ;
var courseArray = new Array() ;

// Create a reunion instance
function createReunion(doc) {
    var reunion = new Object() ;

    var node = doc.query("//REUNION").get(0);
    var value0 = getValue(node, "INFOREUNION/NUMREUN") ;
    var value1 = getValue(node, "INFOREUNION/DATCOPQR/@datenum") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver la réunion");
    }

    reunion.number = value0 ;
    reunion.classe = "reunion" ;
    reunion.date = value1 ;

    return reunion ;
}

// Create a course instance
function createCourse(courses) {
    var course = new Object() ;

    var value0 = getValue(courses, "DESCRIPTION/CONDITION/PARI/TYPEPARI") ;

    if ( value0 == "" ) {
        if ( courseArray.length == 0 ) {
            _print("Impossible de trouver le nom de la course") ;
            return null ;
        }
    }

    var value1 = getValue(courses, "DESCRIPTION/ENTETE/NUMCOUR") ;
    var value2 = getValue(courses, "DESCRIPTION/ENTETE/NOMCOUR") ;
    var value3 = getValue(courses, "DESCRIPTION/DISCIPLINE") ;
    var value4 = getValue(courses, "DESCRIPTION/LIBDISCIPL") ;
    var value5 = getValue(courses, "DESCRIPTION/CONDITION/CATEGORIE") ;
    var value6 = getValue(courses, "DESCRIPTION/ENTETE/MONPRIX").replace(".", " ") + " €" ;
    var value7 = getValue(courses, "DESCRIPTION/CONDITION/DISTANCE").replace(".", " ") + " m" ; ;
    var value8 = getValue(courses, "DESCRIPTION/CONDITION/PARCOURS") ;
    var value9 = getValue(courses, "DESCRIPTION/CONDITION/TCNCOND") ;


    if ( value0 == "" ) {
        _print("Impossible de trouver le nom de la course") ;
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
    course.starters = createStarters(courses, value3) ;
    course.gains = createGains(courses, value3) ;

    return course ;
}

// Create a starter instance
function createStarters(courses, value) {
    var horses = new Array() ;
    var nodes = courses.query("CHEVAUX/CHEVAL") ;
    
    for (var i = 0; i < nodes.size() ; i++) {
        var node = nodes.get(i) ;
        var horse = new Object() ;
        horse.place = getValue(node, "@place") ;
        horse.number = getValue(node, "NUMORDRE") ;
        horse.name = getValue(node, "NOMCHEV") ;
        horse.sex = getValue(node, "SEXECHEV") ;
        horse.robe = getValue(node, "ROBECHEV") ;
        horse.age = getValue(node, "AGECHEVA") ;
        horse.handicap = getValue(node, "HANDICAP") ;
        horse.driver = trim(getValue(node, "JOCKEY/INITIALEJOCK") + " " + getValue(node, "JOCKEY/NOMJOCK")) ;
        horse.coach = trim(getValue(node, "ENTRAINEUR/INITIALEENTR") + " " + getValue(node, "ENTRAINEUR/NOMENTR")) ;
        horse.lane = getValue(node, "POSCORDE") ;
        horse.owner = trim(getValue(node, "PROPRIETAIRE/INITIALEPROP") + " " + getValue(node, "PROPRIETAIRE/NOMPROP")) ;
        if (value.equals("P")) {
            horse.gains = getValue(node, "GVICPLAT") ;
        } else if (value.equals("H")||value.equals("S")) {
            horse.gains = getValue(node, "GTOTHAIE") ;
        } else if (value.equals("A")) {
            horse.gains = getValue(node, "GTOTTROT") ;
        }
        horse.origin = trim(getValue(node, "ORIGINES/PERE") + " - " + getValue(node, "ORIGINES/MERE")) ;
        horse.music = getValue(node, "MUSIQUES/MUSIQUE") ;
        horse.bet = getValue(node, "COTEPROB") ;
        horse.records = trim(getValue(node, "HIPPREDUCCH") + " - " + getValue(node, "HANDREDUCCH") + " - " + getValue(node, "REDUCCH")) ;
        horse.lastCourse = createLastCourse(node) ;
        horse.withdrawn = getValue(node, "CODEINCIDENT") ;
        horse.time = getValue(node, "TEMPSARRIVEE") + " (" + getValue(node, "REDUCKM") + ")"  ;


        if ( horse.number != "" )
            horses.push(horse) ;
    }

    return horses;
}

// Create the lastCourse instance for the foolowing horse
function createLastCourse(node) {
    var lastCourse = new Object() ;

    lastCourse.hipp = getValue(node, "DERNCOURSE/HIPPODROME") ;
    lastCourse.tater = getValue(node, "DERNCOURSE/LIBETATERR") ;
    lastCourse.disc = getValue(node, "DERNCOURSE/DISCIPLINE") ;
    lastCourse.time = getValue(node, "DERNCOURSE/REDUCKM") ;
    lastCourse.lane = getValue(node, "DERNCOURSE/PLACEOFF") ;
    lastCourse.hand = getValue(node, "DERNCOURSE/HANDICAP") ;
    lastCourse.bet = getValue(node, "DERNCOURSE/COTEFIN") ;

    return lastCourse ;
}

// Create a starter instance
function createGains(courses, value) {
    var gains = new Object() ;

    gains.gag1 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPGAG1") ;
    gains.gag2 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPGAG2") ;
    gains.gag3 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPGAG3") ;
    gains.pl11 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPL11") ;
    gains.pl12 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPL12") ;
    gains.pl13 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPL13") ;
    gains.pla2 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPLA2") ;
    gains.pla3 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPLA3") ;
    gains.pla4 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPLA4") ;
    gains.pla5 = getValue(courses, "RAPPORT/RAPPORTGAGNPLACE/RAPPPLA5") ;
    gains.cg12 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLG12") ;
    gains.cp12 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLP12") ;
    gains.cg13 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLG13") ;
    gains.cp13 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLP13") ;
    gains.cp23 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLP23") ;
    gains.cp14 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLP14") ;
    gains.cp24 = getValue(courses, "RAPPORT/COUPLEGAGNPLACE/RAPCOUPLP24") ;
    gains.trio = getValue(courses, "RAPPORT/TRIO/RAPTRIOURBA") ;
    gains.trdh = getValue(courses, "RAPPORT/TRIO/RAPTRIOURDH") ;
    gains.tr12 = getValue(courses, "RAPPORT/TRIO/RAPTRIOUP12") ;
    gains.cpor = getValue(courses, "RAPPORT/COUPLEORDRE/RAPCPLORDREORD") ;
    gains.tror = getValue(courses, "RAPPORT/TRIOORDRE/RAPTRIOORDREORD") ;
    gains.pknu = getValue(courses, "RAPPORT/PICK5/RAPPICK5NUM") ;
    gains.pkva = getValue(courses, "RAPPORT/PICK5/RAPPICK5VAL") ;
    
    return gains ;
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

    var root = new Element("doc") ;
    root.addAttribute(new Attribute("lang", "fr")) ;

    var doc = new Document(root);
    doc.insertChild(new DocType("doc", "/SysConfig/LP/Rules/lp.dtd"), 0);
    doc.insertChild(new ProcessingInstruction("EM-dtdExt", "/SysConfig/LP/Rules/lp.dtx"), 1);
    doc.insertChild(new ProcessingInstruction("EM-templateName", "/SysConfig/LP/Templates/Standard.xml"), 2);
    doc.insertChild(new ProcessingInstruction("xml-stylesheet", "href=\"/SysConfig/LP/Styles/base.css\" type=\"text/css\""), 3);

    var article = new Element("article") ;
    var tables = new Element("tables") ;

    for (var i in courseArray) {
        var course = courseArray[i] ;

        // Create a table for Reunion & Course display
 
        // Display a table of header first
        var table0 = new Element("table") ;
        table0.addAttribute(new Attribute("class", "header_RES" )) ;

        // Create Reunion & Course Header
        if (course.number != "") {
            var tr0 = new Element("tr") ;
            tr0.addAttribute(new Attribute("class", course.classe + "_header0" ));
            var td01 = new Element("td") ;
            td01.addAttribute(new Attribute("colspan","2"));
 	    td01.appendChild(course.number);
            var sp = new Element("span") ;
	    sp.addAttribute(new Attribute("class", "exposant" ));
	    sp.appendChild((course.number.equals("1")) ? "re" : "e"); 
	    td01.appendChild(sp);
	    td01.appendChild(" COURSE") ;
            tr0.appendChild(td01) ;
            
            table0.appendChild(tr0) ;

            // Display starters
            var tr1 = new Element("tr") ;
            tr1.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;

            var td10 = new Element("td") ;
            td10.addAttribute(new Attribute("class", course.classe + "_horseName" )) ;
            var b10 = new Element("b") ;
            b10.appendChild(course.starters[0].place + ". " + course.starters[0].name + " " + course.starters[0].number) ;
            td10.appendChild(b10) ;
            td10.appendChild(" " + course.starters[0].driver) ;
            tr1.appendChild(td10) ;
            var td11 = new Element("td") ;
            td11.addAttribute(new Attribute("class", course.starters[0].classe + "_tab_starters_gains" )) ;
            td11.appendChild("G. " + course.gains.gag1) ;
            tr1.appendChild(td11) ;
            table0.appendChild(tr1) ;

            var tr2 = new Element("tr") ;
            tr2.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;

            var td20 = new Element("td") ;
            td20.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            td20.appendChild(course.starters[0].owner) ;
            tr2.appendChild(td20) ;
            var td21 = new Element("td") ;
            td21.addAttribute(new Attribute("class", course.classe + "_tab_starters_gains" )) ;
            td21.appendChild("P. " + course.gains.pl11) ;
            tr2.appendChild(td21) ;
            table0.appendChild(tr2) ;

            var tr3 = new Element("tr") ;
            tr3.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            var td30 = new Element("td") ;
            td30.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            td30.appendChild(course.starters[1].place + ". " + course.starters[1].name + " " + course.starters[1].number + " " + course.starters[1].driver) ;
            tr3.appendChild(td30) ;
            var td31 = new Element("td") ;
            td31.addAttribute(new Attribute("class", course.classe + "_tab_starters_gains" )) ;
            if (course.starters[0].place == course.starters[1].place) td31.appendChild("G. " + course.gains.gag2) ;
            else td31.appendChild("P. " + course.gains.pla2) ;
            tr3.appendChild(td31) ;
            table0.appendChild(tr3) ;

            if (course.starters[0].place == course.starters[1].place) {
                var tr34 = new Element("tr") ;
                tr34.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
                var td340 = new Element("td") ;
                td340.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
                td340.appendChild(" ") ;
                tr34.appendChild(td340) ;
                var td341 = new Element("td") ;
                td341.addAttribute(new Attribute("class", course.classe + "_tab_starters_gains" )) ;
                td341.appendChild("P. " + course.gains.pla2) ; ;
                tr34.appendChild(td341) ;
                table0.appendChild(tr34) ;
            }


            var tr4 = new Element("tr") ;
            tr4.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            var td40 = new Element("td") ;
            td40.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            td40.appendChild(course.starters[2].place + ". " + course.starters[2].name + " " + course.starters[2].number + " " + course.starters[2].driver) ;
            tr4.appendChild(td40) ;
            var td41 = new Element("td") ;
            td41.addAttribute(new Attribute("class", course.classe + "_tab_starters_gains" )) ;
            td41.appendChild("P. " + course.gains.pla3) ;
            tr4.appendChild(td41) ;
            table0.appendChild(tr4) ;

            var NP = "Non partant" ;
            for (var k in course.starters) {
                var starter = course.starters[k] ;
                if (starter.withdrawn.equals("FO")) {
                    NP += " " + starter.number + " " + starter.name + ",";
                }
            }
            if (NP == "Non partant") NP = "Tous Couru"; 

            if (course.starters.length > 3) {
                var tr5 = new Element("tr") ;
                tr5.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
                var td50 = new Element("td") ;
                td50.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
                td50.appendChild(course.starters[3].place + ". " + course.starters[3].name + " " + course.starters[3].number + " " + course.starters[3].driver + ".") ;
 			 tr5.appendChild(td50) ;
                table0.appendChild(tr5) ;
				// traitement cas quinté et pick5 - SH - le 09072012
				var testtypecourse=course.type;
				//_print("Type" + testtypecourse);
				if ((testtypecourse.indexOf("Quinté+")>=0)||(course.gains.pknu !="0")) {
				//		_print("OK traitement particulier pour " + testtypecourse);
						var tr5 = new Element("tr") ;
						tr5.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
						var td50 = new Element("td") ;
						td50.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
						td50.appendChild(course.starters[4].place + ". " + course.starters[4].name + " " + course.starters[4].number + " " + course.starters[4].driver + ".") ;
						tr5.appendChild(td50) ;
						table0.appendChild(tr5) ;
				}
				// fin de traitement cas quinte et pick5 - SH - le 09072012
            }

            var tr6 = new Element("tr") ;
            tr6.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            var td60 = new Element("td") ;
            td60.addAttribute(new Attribute("class", course.classe + "_tab_starters" )) ;
            td60.addAttribute(new Attribute("colspan", "2" )) ;

            if (course.starters.length < 8) {
                td60.appendChild("Coup. ord. " + course.gains.cpor +
                    ". Trio ord. " + course.gains.tror + ". " + NP + " " + course.starters[0].time + ".") ;
            }
            else if (course.starters[1].place == course.starters[2].place) {
                td60.appendChild("Coup. gag. (" +
                    course.starters[0].number + "-" + course.starters[1].number + ") " + course.gains.cg12 +
                    " (" + course.starters[0].number + "-" + course.starters[2].number + ") " + course.gains.cg13 +
                    ". Trio (" + course.starters[0].number + "-" + course.starters[1].number + "-" + course.starters[2].number + ") : " +
                    course.gains.trio + ". " + NP + " " + course.starters[0].time + ".") ;
            }
            else if (course.starters[2].place == course.starters[3].place){
                td60.appendChild("Coup. gag. " + course.gains.cg12 + ". Coup. pl. (" +
                    course.starters[0].number + "-" + course.starters[1].number + ") " + course.gains.cp12 +
                    " (" + course.starters[0].number + "-" + course.starters[2].number + ") " + course.gains.cp13 +
                    " (" + course.starters[0].number + "-" + course.starters[3].number + ") " + course.gains.cp14 +
                    " (" + course.starters[1].number + "-" + course.starters[2].number + ") " + course.gains.cp23 +
                    " (" + course.starters[1].number + "-" + course.starters[3].number + ") " + course.gains.cp24 +
                    ". Trio (" + course.starters[0].number + "-" + course.starters[1].number + "-" + course.starters[2].number + ") : " + course.gains.trio +
                    " (" + course.starters[0].number + "-" + course.starters[1].number + "-" + course.starters[3].number + ") : " + course.gains.trdh +
                    ". " + NP + " " + course.starters[0].time + ".") ;
            }
            else {
                td60.appendChild("Coup. gag. " + course.gains.cg12 + ". Coup. pl. (" +
                    course.starters[0].number + "-" + course.starters[1].number + ") " + course.gains.cp12 +
                    " (" + course.starters[0].number + "-" + course.starters[2].number + ") " + course.gains.cp13 +
                    " (" + course.starters[1].number + "-" + course.starters[2].number + ") " + course.gains.cp23 +
                    ". Trio (" + course.starters[0].number + "-" + course.starters[1].number + "-" + course.starters[2].number + ") : " +
                    course.gains.trio + ". " + NP + " " + course.starters[0].time + ".") ;
            }
            if (course.gains.pknu != "0") { td60.appendChild(" PICK 5 (" + course.gains.pknu + ") : " + course.gains.pkva + "."); }
            tr6.appendChild(td60) ;
            table0.appendChild(tr6) ;

        }
        tables.appendChild(table0) ;
    }
    article.appendChild(tables) ;
    root.appendChild(article) ;
    return doc ;
}

function printXML(){
    _print("Reunion N° : " +  reunion.number ) ;

    for (var i in courseArray) {
        var course = courseArray[i] ;
        _print("=> Course - type : " + course.type) ;
        _print("=> Course - number : " + course.number) ;
        _print("=> Course - name : " + course.name) ;
        _print("=> Course - discipline : " + course.discipline) ;
        _print("=> Course - category : " + course.category) ;
        _print("=> Course - price : " + course.price) ;
        _print("=> Course - distance : " + course.distance) ;
        _print("=> Course - lap : " + course.lap) ;
        _print("=> Course - condition : " + course.condition) ;

        for ( var j in course.starters ) {
            var horse = course.starters[j] ;
            _print("=> Horse - numéro : " + horse.number + ", " + horse.name + ", " + horse.sex + ", " + horse.robe + ", " +
                horse.age + ", " + horse.handicap + ", " + horse.driver + ", " + horse.coach + ", " + horse.lane + ", " +
                horse.owner + ", " + horse.gains + ", " + horse.origin + ", " + horse.music + ", " + horse.bet + ", " + 
                horse.records + ", " + horse.lastCourse.hipp + ", " + horse.lastCourse.tater + ", " + horse.lastCourse.disc + ", " +
                horse.lastCourse.time + ", " + horse.lastCourse.lane + ", " + horse.lastCourse.hand + ", " + horse.lastCourse.bet + ", " +
                horse.time + ", " + horse.withdrawn ) ;
        }

        _print("=> Gains : " + course.gains.gag1 + " - " + course.gains.pl11 + " - " + course.gains.pla2 + " - " +
                course.gains.pla3 + " - " + course.gains.cg12 + " - " + course.gains.cp12 + " - " + course.gains.cp13 + " - " +
                course.gains.cp23 + " - " + course.gains.trio ) ;

        _print("") ;
    }
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "UTF-8") ;
//    serializer.setIndent(4) ;
//    serializer.setMaxLength(64) ;
    serializer.write(document) ;
    os.close() ;
}

// Main
function main() {

    var file = _srcFile.getFile() ;

//    try {

    _print("Creating builder") ;
    var builder = new Builder() ;
    var doc = builder.build(file) ;
    
    _print("Parsing document") ;
    reunion = createReunion(doc) ;

    var courses = doc.query("//COURSE") ;
    for (var i=0; i<courses.size() ; i++) {
        var course = createCourse(courses.get(i)) ;
        if ( course != null ) courseArray.push(course) ;
    }

//    _print("Printing xml") ;
//    printXML() ;

    _print("Creating xml") ;
    var document = createXML() ;

    _print("Writing xml") ;
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

