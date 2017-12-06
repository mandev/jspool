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

var OUTPUT_DIR = ["D:/METHODE/PROD/Turf/", "D:/METHODE/QA/Turf/", "D:/METHODE/DEV/Turf/", "D:/METHODE/PRODV6/Turf/"] ;
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
        return null ;
    }
    reunion.number = value0 ;
    reunion.classe = "reunion" ;
    reunion.date = value1 ;
    reunion.course = createCourse(doc) ;

    return reunion ;
}

// Create a course instance
function createCourse(courses) {
    var course = new Object() ;
    var value0 = getValue(courses, "DESCRIPTION/CONDITION/PARI/TYPEPARI") ;
//Rajout SH le 15092012 a 22h06    
    var testPartants=getValue(courses, "DESCRIPTION/CONDITION/PARTANTS") ;
//      if ( value0 == "" ) { 	// A Decommenter si pb
    if (( value0 == "" )&&( testPartants !="03" ) )  {
//Fin rajout SH le 15092012 a 22h06 
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
    var value7 = getValue(courses, "DESCRIPTION/CONDITION/DISTANCE").replace(".", " ") + " m" ;
    var value8 = getValue(courses, "DESCRIPTION/CONDITION/PARCOURS") ;
    var value9 = getValue(courses, "DESCRIPTION/CONDITION/TCNCOND") ;
    var value10 = getValue(courses, "DESCRIPTION/CONDITION/DISTANCE").replace(".", "") ;
    var value11 = getValue(courses, "DESCRIPTION/CONDITION/NB_PART_PREM_LIGNE_AUTOSTART");

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
    course.recul = value10 ;
    course.nbstart = value11 ;
    course.starters = createStarters(courses, value3) ;

    return course ;
}

// Create a starter instance
function createStarters(courses, value) {
    var horses = new Array() ;
    var nodes = courses.query("CHEVAUX/CHEVAL") ;
    
    for (var i = 0; i < nodes.size() ; i++) {
        var node = nodes.get(i) ;
        var horse = new Object() ;
        horse.number = getValue(node, "NUMORDRE") ;
        horse.name = getValue(node, "NOMCHEV") ;
        horse.sex = getValue(node, "SEXECHEV") ;
        horse.robe = getValue(node, "ROBECHEV") ;
        horse.age = getValue(node, "AGECHEVA") ;
        horse.handicap = getValue(node, "HANDICAP") ;
        horse.recul = getValue(node, "HANDICAP").replace(".", "") ;
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
        horse.team = getValue(node, "NUMECURI") ;

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
    lastCourse.dist = getValue(node, "DERNCOURSE/DISTANCE") ;
    lastCourse.lane = getValue(node, "DERNCOURSE/PLACEOFF") ;
    lastCourse.hand = getValue(node, "DERNCOURSE/HANDICAP") ;
    lastCourse.bet = getValue(node, "DERNCOURSE/COTEFIN") ;

    return lastCourse ;
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

    for (var i in courseArray) {
        var course = courseArray[i] ;

        // Create a table for Reunion & Course display
        var tables = new Element("tables") ;

        // Display a table of header first
        var table0 = new Element("table") ;
        table0.addAttribute(new Attribute("class", "header_PAR" )) ;

        // Create Reunion & Course Header
        if (course.number != "") {
            var tr0 = new Element("tr") ;
            tr0.addAttribute(new Attribute("class", reunion.classe + "_" + course.classe + "_header0" )) ;
            var td01 = new Element("td") ;
            td01.addAttribute(new Attribute("rowspan", "3")) ;
            td01.addAttribute(new Attribute("class", "courseNumber")) ;
            td01.appendChild(course.number) ;
            tr0.appendChild(td01) ;
            var td02 = new Element("td") ;
            td02.addAttribute(new Attribute("class", "courseName")) ;
            var b02 = new Element("b") ;
            b02.addAttribute(new Attribute("class", "courseName")) ;
            b02.appendChild(course.name) ;
            td02.appendChild(b02) ;
            var ld02 = new Element("ld") ;
            ld02.addAttribute(new Attribute("pattern", ".")) ;
            td02.appendChild(ld02) ;
            var b03 = new Element("b") ;
            b03.addAttribute(new Attribute("class", "courseHoraire")) ;
            b03.appendChild("horaire") ;
            td02.appendChild(b03) ;
            tr0.appendChild(td02) ;

            table0.appendChild(tr0) ;

            var tr1 = new Element("tr") ;
            tr1.addAttribute(new Attribute("class", reunion.classe + "_" + course.classe + "_header1" )) ;
            var td11 = new Element("td") ;
            td11.addAttribute(new Attribute("class", "courseCaracteristics")) ;
            td11.appendChild(course.discipline + " - " + course.category + " - "  ) ;
            tr1.appendChild(td11) ;
            var td12 = new Element("td");
            td12.addAttribute(new Attribute("class", "img")) ;
            td12.addAttribute(new Attribute("rowspan", "2")) ;
            tr1.appendChild(td12);
            var td13 = new Element("td");
            td13.addAttribute(new Attribute("class", "img")) ;
            td13.addAttribute(new Attribute("rowspan", "2")) ;
            tr1.appendChild(td13);
            table0.appendChild(tr1) ;

            var tr2 = new Element("tr") ;
            tr2.addAttribute(new Attribute("class", reunion.classe + "_" + course.classe + "_header2" )) ;
            var td21 = new Element("td") ;
            td21.addAttribute(new Attribute("class", "courseCaracteristics")) ;
            td21.appendChild(course.price + " - " + course.distance) ;
            if (course.classe.equals("P")) td21.appendChild( " - " + course.lap) ;
            tr2.appendChild(td21) ;
            table0.appendChild(tr2) ;
        }
        tables.appendChild(table0) ;


        // Display a table of starters
        var table1 = new Element("table") ;
        table1.addAttribute(new Attribute("class", course.classe + "_headers" )) ;

        // Display a table of header first
        var tr3 = new Element("tr") ;
        tr3.addAttribute(new Attribute("class", course.classe + "_tab_header_starters0" )) ;

        var td30 = new Element("td") ;
        td30.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_type")) ;
	   if (course.type.matches(".*Tierc.*Quart.*Quint.*")) 
	   {
	 	  td30.appendChild("Tiercé - Quarté+ - Quinté+ - 2sur4 - Trio - Couplés - Couplé Ordre") ; 
	   }
	   else td30.appendChild(course.type) ;
        tr3.appendChild(td30) ;

        table1.appendChild(tr3) ;
        tables.appendChild(table1) ;

        var table2 = new Element("table") ;
        table2.addAttribute(new Attribute("class", course.classe + "_starters" )) ;

        // Display of PAR type of table
        if ( course.type.matches(".*Tierc.*Quart.*Quint.*") ) {

            // Display a table of header first
            var tr4 = new Element("tr");
            tr4.addAttribute(new Attribute("class", course.classe + "_tab_header_starters1" )) ;

            var td40 = new Element("td");
            td40.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_number")) ;
            td40.appendChild("N°") ;
            tr4.appendChild(td40) ;
            var td41 = new Element("td");
            td41.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_horse")) ;
            td41.appendChild("CHEVAUX") ;
            tr4.appendChild(td41) ;
            var td42 = new Element("td");
            td42.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_sexRobe")) ;
            td42.appendChild("S.R.") ;
            tr4.appendChild(td42) ;
            var td43 = new Element("td");
            td43.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_age")) ;
            td43.appendChild("ÂGE") ;
            tr4.appendChild(td43) ;
            var td44 = new Element("td");
            td44.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_handicap")) ;
            ( (course.classe.equals("A")) ? td44.appendChild("DIST.") : td44.appendChild("POIDS") ) ;
            tr4.appendChild(td44) ;
            var td45 = new Element("td");
            td45.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_drivers")) ;
            if (course.classe.equals("A")) td45.appendChild("DRIVERS"); else td45.appendChild("JOCKEYS") ;
            tr4.appendChild(td45) ;
            if (course.classe.equals("P")) {
                var td46 = new Element("td");
                td46.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_lane")) ;
                td46.appendChild("CDE") ;
                tr4.appendChild(td46) ;
            }
            var td47 = new Element("td");
            td47.addAttribute(new Attribute("class", course.classe + "_tab_header_starters_bet")) ;
           // td47.appendChild("Cotes") ;
            tr4.appendChild(td47) ;

            table2.appendChild(tr4);

            for (var k in course.starters) {
                var starter = course.starters[k] ;
                var tr5 = new Element("tr");
                tr5.addAttribute(new Attribute("class", course.classe + "_tab_starters0" )) ;

                var td50 = new Element("td");
                td50.addAttribute(new Attribute("class", course.classe + "_tab_starters_number0" )) ;
                td50.appendChild(starter.number) ;
                tr5.appendChild(td50) ;
                var td51 = new Element("td");
                td51.addAttribute(new Attribute("class", course.classe + "_tab_starters_name0" )) ;
			 if (starter.team != "") td51.appendChild(starter.name + " - (E" + starter.team + ")") ;
                else td51.appendChild(starter.name) ;
                tr5.appendChild(td51) ;
                var td52 = new Element("td");
                td52.addAttribute(new Attribute("class", course.classe + "_tab_starters_sexRobe0" )) ;
                td52.appendChild(starter.sex + starter.robe) ;
                tr5.appendChild(td52) ;
                var td53 = new Element("td");
                td53.addAttribute(new Attribute("class", course.classe + "_tab_starters_age0" )) ;
                td53.appendChild(starter.age) ;
                tr5.appendChild(td53) ;
                var td54 = new Element("td");
                td54.addAttribute(new Attribute("class", course.classe + "_tab_starters_handicap0" )) ;
                td54.appendChild(starter.handicap) ;
                tr5.appendChild(td54) ;
                var td55 = new Element("td");
                td55.addAttribute(new Attribute("class", course.classe + "_tab_starters_driver0" )) ;
                td55.appendChild(starter.driver) ;
                tr5.appendChild(td55) ;
                if (course.classe.equals("P")) {
                    var td56 = new Element("td");
                    td56.addAttribute(new Attribute("class", course.classe + "_tab_starters_lane0")) ;
                    td56.appendChild(starter.lane) ;
                    tr5.appendChild(td56) ;
                }
                var td57 = new Element("td");
                td57.addAttribute(new Attribute("class", course.classe + "_tab_starters_bet0" )) ;
                td57.appendChild(starter.bet) ;
                tr5.appendChild(td57) ;

                table2.appendChild(tr5) ;
            }
            tables.appendChild(table2) ;

            // Display a table of comments display
            var table3 = new Element("table") ;
            table3.addAttribute(new Attribute("class", course.classe + "_books_conditions" )) ;

            // Create comments display if exists
            var tr8 = new Element("tr") ;
            tr8.addAttribute(new Attribute("class", course.classe + "_tab_head_books_conditions" )) ;
            var td80 = new Element("td") ;
            td80.addAttribute(new Attribute("class", course.classe + "_tab_books0" )) ;
            td80.addAttribute(new Attribute("rowspan", "2")) ;
            tr8.appendChild(td80) ;
            var td81 = new Element("td") ;
            td81.addAttribute(new Attribute("class", "img")) ;
            tr8.appendChild(td81) ;
            var td82 = new Element("td");
            td82.addAttribute(new Attribute("class", course.classe + "_tab_gains" )) ;
            tr8.appendChild(td82);
            table3.appendChild(tr8) ;

            tables.appendChild(table3) ;
        }
        // display of classical table
        else {
            // Display starters
            for (var k in course.starters) {
                var horse = course.starters[k] ;
                var tr6 = new Element("tr") ;
                var recul = "" ;
                var autostart = "" ;
                if (horse.recul > course.recul) {
                	recul = "_plain" ;
                	course.recul = horse.recul;
                }
                if ((course.lap == "Départ à l'autostart")&&(k==course.nbstart)) {
                	autostart = "_dash" ;
                	course.lap = "" ;
                }
                tr6.addAttribute(new Attribute("class", course.classe + "_tab_starters1" + recul + autostart)) ;

                var td60 = new Element("td") ;
                td60.addAttribute(new Attribute("class", course.classe + "_tab_starters_owner1" )) ;
                td60.appendChild(horse.owner) ;
                tr6.appendChild(td60) ;
                var td61 = new Element("td") ;
                td61.addAttribute(new Attribute("class", course.classe + "_tab_starters_coach1" )) ;
                td61.appendChild(horse.coach) ;
                tr6.appendChild(td61) ;
                var td62 = new Element("td") ;
                td62.addAttribute(new Attribute("class", course.classe + "_tab_starters_number1" )) ;
                td62.appendChild(horse.number) ;
                tr6.appendChild(td62) ;
                var td63 = new Element("td") ;
                td63.addAttribute(new Attribute("class", course.classe + "_tab_starters_name1" )) ;
		if (horse.team != "") td63.appendChild(horse.name + " - (E" + horse.team + ")") ;
                else td63.appendChild(horse.name) ;
                tr6.appendChild(td63) ;
                var td64 = new Element("td") ;
                td64.addAttribute(new Attribute("class", course.classe + "_tab_starters_sexAge1" )) ;
                td64.appendChild(horse.sex + horse.age) ;
                tr6.appendChild(td64) ;
                var td65 = new Element("td") ;
                td65.addAttribute(new Attribute("class", course.classe + "_tab_starters_handicap1" )) ;
                td65.appendChild(horse.handicap) ;
                tr6.appendChild(td65) ;
                if (course.classe.equals("P")) {
                    var td66 = new Element("td") ;
                    td66.addAttribute(new Attribute("class", course.classe + "_tab_starters_lane1")) ;
                    td66.appendChild(horse.lane) ;
                    tr6.appendChild(td66) ;
                }
                var td67 = new Element("td") ;
                td67.addAttribute(new Attribute("class", course.classe + "_tab_starters_driver1" )) ;
                td67.appendChild(horse.driver) ;
                tr6.appendChild(td67) ;
                
		if (horse.lastCourse.hipp != "") {
                    var td68 = new Element("td") ;
		    td68.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_hipp1" )) ;
                    td68.appendChild(horse.lastCourse.hipp) ;
                    tr6.appendChild(td68) ;
                    var td69 = new Element("td") ;
                    td69.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_tater1" )) ;
                    td69.appendChild(horse.lastCourse.tater) ;
                    tr6.appendChild(td69) ;
                    if ((course.classe.equals("A"))||(course.classe.equals("M"))) {
                        var td610 = new Element("td") ;
                        td610.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_disc1" )) ;
                        td610.appendChild(horse.lastCourse.disc) ;
                        tr6.appendChild(td610) ;
                        var td611 = new Element("td") ;
                        td611.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_time1" )) ;
                        td611.appendChild(horse.lastCourse.time) ;
                        tr6.appendChild(td611) ;
                    } else if ((course.classe.equals("H"))||(course.classe.equals("S"))) {
                        var td612 = new Element("td") ;
                        td612.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_disc1" )) ;
                        td612.appendChild(horse.lastCourse.disc) ;
                        tr6.appendChild(td612) ;
                        var td613 = new Element("td") ;
                        td613.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_dist1" )) ;
                        td613.appendChild(horse.lastCourse.dist) ;
                        tr6.appendChild(td613) ;
                    }
                    var td614 = new Element("td") ;
                    td614.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_lane1" )) ;
                    td614.appendChild(horse.lastCourse.lane.replace("NP","0")) ;
                    tr6.appendChild(td614) ;
                    var td615 = new Element("td") ;
                    td615.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_hand1" )) ;
                    td615.appendChild(horse.lastCourse.hand) ;
                    tr6.appendChild(td615) ;
                    var td616 = new Element("td") ;
                    td616.addAttribute(new Attribute("class", course.classe + "_tab_starters_lastCourse_bet1" )) ;
                    td616.appendChild(horse.lastCourse.bet) ;
                    tr6.appendChild(td616) ;
		} 
		else {
		    var td617 = new Element("td") ;
                    td617.addAttribute(new Attribute("colspan", "5" )) ;
		    td617.addAttribute(new Attribute("class", course.classe + "_tab_starters_origin" )) ;
                    td617.appendChild(horse.origin) ;
                    tr6.appendChild(td617) ;
		}

                table2.appendChild(tr6) ;
            }
            tables.appendChild(table2) ;

            // Display a table of comments display
            var table4 = new Element("table") ;
            table4.addAttribute(new Attribute("class", course.classe + "_books_conditions" )) ;

            // Create comments display if exists
            var tr7 = new Element("tr") ;
            tr7.addAttribute(new Attribute("class", course.classe + "_tab_head_books_conditions" )) ;
            var td70 = new Element("td") ;
            td70.addAttribute(new Attribute("class", course.classe + "_tab_books1" )) ;
            tr7.appendChild(td70) ;
            var td71 = new Element("td") ;
            td71.addAttribute(new Attribute("class", course.classe + "_tab_books2" )) ;
            tr7.appendChild(td71) ;
            var td72 = new Element("td");
            td72.addAttribute(new Attribute("class", course.classe + "_tab_conditions" )) ;
            td72.appendChild(course.condition) ;
            tr7.appendChild(td72);
            table4.appendChild(tr7) ;
            
            tables.appendChild(table4) ;
        }
        article.appendChild(tables) ;
    }

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
                horse.lastCourse.time + ", " + horse.lastCourse.lane + ", " + horse.lastCourse.hand + ", " + horse.lastCourse.bet ) ;
        }
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

 //   try {

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

