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

var OUTPUT_DIR = ["D:/METHODE/PROD/Turf/","D:/METHODE/QA/Turf/","D:/METHODE/DEV/Turf/"] ;
var starterArray = new Array() ;

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
    horse.music = getValue(node, "MUSIQUES/MUSIQUE") ;
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
        starter.handicap = getValue(node, "PDSDISTCHEVAL_PERF") + getValue(node, "PDSDISTCHEVAL_PERF_DOP") ;
        starter.time = getValue(node, "REDUCTCHEVAL_PERF") + getValue(node, "REDUCTCHEVAL_PERF_DOP") ;
        starter.driver = getValue(node, "JOCKEYCHEVAL_PERF") + getValue(node, "JOCKEYCHEVAL_PERF_DOP") ;
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

    var article = new Element("article") ;

    for (var i in starterArray) {
        var starter = starterArray[i] ;

        // Create Reunion & Course Header
        if (starter.number != "") {

        // Create a table par starter
        var table0 = new Element("table") ;
        table0.addAttribute(new Attribute("class", "header_PRF" )) ;

        var thead0 = new Element("thead") ;
        thead0.addAttribute(new Attribute("class", "header_PRF" )) ;

            // Display starters
            var tr0 = new Element("tr") ;
            tr0.addAttribute(new Attribute("class", "starter_header" )) ;
            var td01 = new Element("td") ;
            td01.addAttribute(new Attribute("class", "starter_number" )) ;
            td01.addAttribute(new Attribute("rowspan", "3" )) ;
            td01.appendChild(starter.number) ;
            tr0.appendChild(td01) ;
            var td02 = new Element("td") ;
            var b02 = new Element("b") ;
            b02.addAttribute(new Attribute("class", "starter_Name")) ;
            b02.appendChild(starter.name) ;
            td02.appendChild(b02) ;
            tr0.appendChild(td02) ;
            var td03 = new Element("td") ;
            td03.addAttribute(new Attribute("class", "starter_handicap" )) ;
            td03.appendChild(starter.handicap) ;
            tr0.appendChild(td03) ;
            thead0.appendChild(tr0) ;

            var tr1 = new Element("tr") ;
            tr1.addAttribute(new Attribute("class", "starter_driver" )) ;
            var td10 = new Element("td") ;
            td10.appendChild(starter.driver) ;
            tr1.appendChild(td10) ;
            thead0.appendChild(tr1) ;


            var tr2 = new Element("tr") ;
            tr2.addAttribute(new Attribute("class", "starter_music" )) ;
            var td20 = new Element("td") ;
            td20.appendChild(starter.music) ;
            tr2.appendChild(td20) ;
            thead0.appendChild(tr2) ;

            table0.appendChild(thead0) ;
            article.appendChild(table0) ;

            var comment = new Element("comment") ;
            comment.addAttribute(new Attribute("class", "starter_comment" )) ;
            article.appendChild(comment) ;

            var i = 0;
            for (var j in starter.performs) {
                var perform = starter.performs[j] ;

                if (perform.type.equals("S")) {
                    var performance0 = new Element("best_perf_header") ;
                    performance0.addAttribute(new Attribute("class", "best_perf_header" )) ;
                    performance0.appendChild("SA MEILLEURE PERFORMANCE") ;
                    article.appendChild(performance0) ;
                }

                var performance = new Element("last_perf") ;
                performance.addAttribute(new Attribute("class", "last_perf" )) ;
                performance.appendChild("<b> " + perform.hipp + " </b>, " + perform.date + ". " + perform.course + ". " + perform.ground + ". " +
                    perform.disc + ". " + perform.price + ". " + perform.dist + ". ") ;

                for ( var k in perform.perfStarters ) {
                    var horse = perform.perfStarters[k] ;
                    if (horse.name.equals(starter.name)) {
                        performance.appendChild("<b>" + horse.number + ". " + horse.name + " " + horse.handicap + " " +
                            horse.time + "</b>" + " (" + horse.driver + " " + horse.bet + "). " ) ;
                    } else {
                        performance.appendChild(horse.number + ". " + horse.name + " " + horse.handicap + ". " ) ;
                    }
                }
                performance.appendChild(perform.numStarters + " part.") ;

                if ((i<2)||(i>4)) article.appendChild(performance) ;
                i++;

            }


        }
    }

    root.appendChild(article) ;
    return new Document(root) ;
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
    var starters = doc.query("//CHEVAL") ;
    for (var i=0; i<starters.size() ; i++) {
        var starter = createStarter(starters.get(i)) ;
        if ( starter != null ) starterArray.push(starter) ;
    }

//    _print("Printing xml") ;
//    printXML() ;

    _print("Creating xml") ;
    var document = createXML() ;

    _print("Writing xml") ;
    for (i in OUTPUT_DIR) {
    	var file = new File(OUTPUT_DIR[i], _srcFile.getName().replace("ok","xml")) ;
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

