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
var starterArray = new Array() ;

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

// Create a starter instance
function createStarter(node) {
    var horse = new Object() ;
    horse.number = getValue(node, "NUMORDRE") ;
    horse.name = getValue(node, "NOMCHEV") ;
    horse.sex = getValue(node, "SEXECHEV") ;
    horse.robe = getValue(node, "ROBECHEV") ;
    horse.handicap = getValue(node, "HANDICAP") ;
    horse.driver = getValue(node, "JOCKEY/INITIALEJOCK") + " " + getValue(node, "JOCKEY/NOMJOCK") ;
    horse.origin = getValue(node, "ORIGINES/PERE") + " - " + getValue(node, "ORIGINES/MERE") ;    
    horse.music = getValue(node, "MUSIQUES/MUSIQUE").replace(") ",")_").split(" ").slice(0,6).join(" ").replace(")_",") ") ;
	
//	var token = getValue(node, "MUSIQUES/MUSIQUE").split("p");
//  var music = getValue(node, "MUSIQUES/MUSIQUE").substr(0,getValue(node, "MUSIQUES/MUSIQUE").indexOf(token[6],17)) ;
//  if (music.indexOf("(",0)==-1) horse.music = music;
//  else horse.music = getValue(node, "MUSIQUES/MUSIQUE").substr(0,getValue(node, "MUSIQUES/MUSIQUE").indexOf(token[6],20)) ;
    
	horse.performs = createPerforms(node) ;
    return horse;
}

// Create the Performs instance for the following horse
function createPerforms(starter) {
    var performs = new Array() ;
    var nodes = starter.query("PERFORMANCE") ;

    for (var j = 0; j < nodes.size() ; j++) {
        var node = nodes.get(j) ;
        var perform = new Object() ;

        perform.type = getValue(node, "TYPEPERF_PERF") ;
        perform.date = getValue(node, "DATECOUR_PERF") ;
        perform.hipp = getValue(node, "HIPPODRO_PERF") ;
        perform.course = getValue(node, "NOMCOURS_PERF") ;
        perform.disc = getValue(node, "DISCIPCO_PERF") ;
        perform.dist = getValue(node, "DISTANCE_PERF") + "m";
        perform.price = getValue(node, "MONTPRIX_PERF") ;
        perform.ground = getValue(node, "ETATTERR_PERF") ;
        perform.perfStarters = createPerfStarters(node);
        perform.numStarters = getValue(node, "NBREPART_PERF") ;

        if ( perform.date != "" )
            performs.push(perform) ;
    }

    return performs ;
}

// Create the Performs instance for the following horse
function createPerfStarters(perform) {
    var starters = new Array() ;
    var nodes = perform.query("CHEVALPERFORMANCE") ;

    for (var k = 0; k < nodes.size() ; k++) {
        var node = nodes.get(k) ;
        var starter = new Object() ;

        starter.number = getValue(node, "PLACECHEVAL_PERF") + getValue(node, "PLACECHEVAL_PERF_DOP") ;
        starter.name = getValue(node, "NOMCHEVAL_PERF") + getValue(node, "NOMCHEVAL_PERF_DOP") ;
        // SH le 30112012
		starter.defer = getValue(node, "DEFERRECHEVAL_PERF") + getValue(node, "DEFERRECHEVAL_PERF_DOP") ;
		starter.oeilleres = getValue(node, "OEILLERECHEVAL_PERF") + getValue(node, "OEILLERECHEVAL_PERF_DOP") ;
        // Fin de modification SH le 30112012
		starter.handicap = getValue(node, "PDSDISTCHEVAL_PERF") + getValue(node, "PDSDISTCHEVAL_PERF_DOP") ;
		starter.time = getValue(node, "REDUCTCHEVAL_PERF") + getValue(node, "REDUCTCHEVAL_PERF_DOP") ;
        starter.driver = getValue(node, "JOCKEYCHEVAL_PERF") + getValue(node, "JOCKEYCHEVAL_PERF_DOP") ;
        starter.gap = getValue(node, "ECARTARR_PERF") + getValue(node, "ECARTARR_PERF_DOP") ;
        starter.bet = getValue(node, "COTEFIN_PERF_DOP") ;

        if ( starter.number != "" )
            starters.push(starter) ;
    }

    return starters ;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
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

    for (var i in starterArray) {
        var starter = starterArray[i] ;

        // Create Reunion & Course Header
        if (starter.number != "") {

            // Create a table per starter
            var texte = new Element("texte") ;
            var table0 = new Element("table") ;
            table0.addAttribute(new Attribute("class", "header_PRF" )) ;

            // Display starters
            var tr0 = new Element("tr") ;
            tr0.addAttribute(new Attribute("class", "starter_header" )) ;
            var td01 = new Element("td") ;
            td01.addAttribute(new Attribute("class", "starter_number" )) ;
            td01.addAttribute(new Attribute("rowspan", "3" )) ;
            td01.appendChild(starter.number) ;
            tr0.appendChild(td01) ;
            var td02 = new Element("td") ;
            td02.addAttribute(new Attribute("class", "starter_Name")) ;
            var b02 = new Element("b") ;
            b02.appendChild(starter.name) ;
            td02.appendChild(b02) ;
            tr0.appendChild(td02) ;
            var td03 = new Element("td") ;
            td03.addAttribute(new Attribute("class", "starter_handicap" )) ;
            td03.appendChild(starter.handicap) ;
            tr0.appendChild(td03) ;
            table0.appendChild(tr0) ;

            var tr1 = new Element("tr") ;
            tr1.addAttribute(new Attribute("class", "starter_driver" )) ;
            var td10 = new Element("td") ;
            td10.appendChild(starter.driver) ;
            tr1.appendChild(td10) ;
            table0.appendChild(tr1) ;


            var tr2 = new Element("tr") ;
            tr2.addAttribute(new Attribute("class", "starter_music" )) ;
            var td20 = new Element("td") ;
            td20.appendChild(starter.music) ;
            tr2.appendChild(td20) ;
            table0.appendChild(tr2) ;

            texte.appendChild(table0) ;

            var comment = new Element("p") ;
            comment.addAttribute(new Attribute("class", "starter_comment" )) ;
            texte.appendChild(comment) ;

            var i = 0;
	    var j = 0;
            for (var k in starter.performs) {
                var perform = starter.performs[k] ;

                if (perform.type.equals("S")) {
                    var performance0 = new Element("p") ;
                    performance0.addAttribute(new Attribute("class", "best_perf_header" )) ;
                    performance0.appendChild("SA MEILLEURE PERFORMANCE") ;
                    texte.appendChild(performance0) ;
		    j = k;
                }

                var performance = new Element("p") ;
                performance.addAttribute(new Attribute("class", "last_perf" )) ;
                var hipp = new Element("b");
                hipp.appendChild(perform.hipp + ", ");
                performance.appendChild(hipp);
                performance.appendChild(perform.date + ". " + perform.course + ". " + perform.ground + ". " +
                    perform.disc + ". " + perform.price + ". " + perform.dist + ". ") ;

                for ( var k in perform.perfStarters ) {
                    var horse = perform.perfStarters[k] ;
										
					// SH le 30112012 rajout des données defferage et oeilleres
					var defere = " ";	
					if (horse.defer!="") defere = defere + "- " + horse.defer + " " ;
					else if (horse.oeilleres!="") defere = defere + "- " + horse.oeilleres + " " ;
					// Fin de modification SH le 30112012 rajout des données defferage et oeilleres
					
                    if (horse.name.equals(starter.name)) {
                        var hors = new Element("b");
                        // SH le 30112012 zone MEILLEURE PERFORMANCE du cheval
						// hors.appendChild(horse.number + ". " + horse.name + " " + horse.handicap + " " + horse.time);
					    hors.appendChild(horse.number + ". " + horse.name + defere + horse.handicap + " " + horse.time);
						// Fin de modification SH le 30112012 zone MEILLEURE PERFORMANCE du cheval
						
                        performance.appendChild(hors);
                        performance.appendChild(" (" + horse.driver + " " + horse.bet + "). " ) ;
                    } else {
                        performance.appendChild(horse.number + ". " + horse.name + " " + horse.handicap + ". " ) ;
                    }
                }
                performance.appendChild(perform.numStarters + " part.") ;

		var gap = "";
                for ( var k in perform.perfStarters ) {
		    var horse = perform.perfStarters[k] ;
		    if (horse.gap != "") gap = gap + " - " + horse.gap ;
		}
		performance.appendChild(gap.substring(2,gap.length));
		
                if ((i<3)&&(j<3)) texte.appendChild(performance) ;
		else if ((i>=3)&&(perform.type.equals("S"))) texte.appendChild(performance) ;
		i++;
            }
        }
        article.appendChild(texte);
    }

    root.appendChild(article) ;
    return doc ;
}

function printXML(){

    for (var i in starterArray) {
        var starter = starterArray[i] ;
        _print("=> starter - number : " + starter.number) ;
        _print("=> starter - name : " + starter.name) ;
        _print("=> starter - sex : " + starter.sex) ;
        _print("=> starter - robe : " + starter.robe) ;
        _print("=> starter - handicap : " + starter.handicap) ;
        _print("=> starter - driver : " + starter.driver) ;
        _print("=> starter - origin : " + starter.origin) ;
        _print("=> starter - music : " + starter.music) ;

        for ( var j in starter.performs ) {
            var perform = starter.performs[j] ;
            _print("=> starter - perform : " + perform.hipp + ", " + perform.date + ", " + perform.course + ", " + perform.ground + ", " +
                perform.disc + ", " + perform.price + ", " + perform.dist + ", " + perform.numStarters ) ;

            for ( var k in perform.perfStarters ) {
                var horse = perform.perfStarters[k] ;
                _print("=> starter - perform - starters : " + horse.number + " - " + horse.name + " - " + horse.handicap + " - " +
                    horse.time + " - " + horse.driver ) ;
            }

        }

        _print("") ;
    }
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "ISO-8859-1") ;
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
    var starters = doc.query("//CHEVAL") ;
    for (var i=0; i<starters.size() ; i++) {
        var starter = createStarter(starters.get(i)) ;
        if ( starter != null ) starterArray.push(starter) ;
    }

    //    _print("Printing xml") ;
    //    printXML() ;

    _print("Creating xml") ;
    var document = createXML() ;

    reunion = createReunion(doc) ;

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

