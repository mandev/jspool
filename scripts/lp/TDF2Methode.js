/* test.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io) ;
importPackage(Packages.java.text) ;
importPackage(Packages.java.util) ;
importPackage(Packages.java.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.org.apache.commons.io) ;
//importPackage(Packages.org.apache.commons.lang) ;
//importPackage(org.apache.xerces.parsers) ;
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang3);
importPackage(Packages.org.apache.commons.lang3.text);
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// List All children - Node, int

var INPUT_DIR = "C:/Exports/TDF/XML/" ;
var OUTPUT_DIR = ["C:/Exports/TDF/XML_out/Prod","C:/Exports/TDF/XML_out/QA","C:/Exports/TDF/XML_out/Dev","C:/Exports/TDF/XML_out/ProdV6"] ;
var teamArray = new Array() ;
var rankArray = new Array() ;
var XOM = ScriptUtils.createXomBuilder(false, false);
var year="2015";

// Today
function getToday() {
    var da = new Date() ;
    if (da.getHours() > 3) {
        da.setDate(da.getDate()+1);
    }
    var jour = new String(da.getDate()) ;
    if ( jour.length == 1 ) jour = "0" + jour ;

    var mois = new String(da.getMonth()+1) ;
    if ( mois.length == 1 ) mois = "0" + mois ;

    var annee = new String(da.getFullYear()).substr(2,2) ;
    return jour + '-' + mois + '-' + annee ;	
}

// Create a team instance
function createTeam(team) {
    var equipe = new Object();

    var value0 = getValue(team, "@number") ;

    if ( value0 == "" ) {
        if ( teamArray.length == 0 ) {
            _print("Impossible de trouver le nom de l'equipe");
            return null ;
        }
    }
    equipe.number = value0 ;

    equipe.code = getValue(team, "@code") ;
    equipe.name = getValue(team, "@name") ;
    equipe.director = getValue(team, "@director") ;
    equipe.codirector = getValue(team, "@codirector") ;
    equipe.nationality = getValue(team, "@nationality") ;
    equipe.riders = createRiders(team);
    
    return equipe ;
}

// Create a riders instance
function createRiders(team) {
    var riders = new Array() ;

    var nodes = team.query("rider") ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var rider = new Object();
        
        rider.number = getValue(node, "@number") ;
        rider.lastname = WordUtils.capitalize(WordUtils.swapCase(getValue(node, "@lastname"))) ;
        rider.firstname = WordUtils.initials(getValue(node, "@firstname")) + "." ;
        rider.nationality = getValue(node, "@nationality") ;
        rider.birthdate = getValue(node, "@birthdate") ;
        rider.uci = getValue(node, "@uci") ;
        rider.status = getValue(node, "@status") ;

        if ( rider.number != "" )
            riders.push(rider) ;
    }
    return riders;
}

function beautifyTime(time) {
    var tokens = time.split( ":" );
    return ((tokens[0].substr(0,1).equals("0"))?tokens[0].substr(1) : tokens[0]) + "h" + tokens[1] + "'" + tokens[2] + "''";
}

// Create a ranking instance
function createRank(rank) {
    var rang = new Object();

    rang.position = getValue(rank, "@position") ;
    rang.number = getValue(rank, "@number") ;
    rang.teamcode = getValue(rank, "@teamcode") ;
    rang.time = beautifyTime(getValue(rank, "@time")) ;
    rang.gap = beautifyTime(getValue(rank, "@gap")) ;
    rang.points = getValue(rank, "@points") ;

    if ( rang.position == "" ) return null;

    return rang;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

function createXML(name) {
    
    var root = new Element("doc");
    root.addAttribute(new Attribute("lang", "fr") ) ;

    var doc = new Document(root);
    doc.insertChild(new DocType("doc", "/SysConfig/LP/Rules/lp.dtd"), 0);
    doc.insertChild(new ProcessingInstruction("EM-dtdExt", "/SysConfig/LP/Rules/lp.dtx"), 1);
    doc.insertChild(new ProcessingInstruction("EM-templateName", "/SysConfig/LP/Templates/Standard.xml"), 2);
    doc.insertChild(new ProcessingInstruction("xml-stylesheet", "href=\"/SysConfig/LP/Styles/base.css\" type=\"text/css\""), 3);

    var article = new Element("article");

    // Create a table for results display
    var texte = new Element("texte");

    if ((name.match("SITG"))||(name.match("SIJG"))){
        for (var i in rankArray) {
            var rang = rankArray[i] ;

            for (var j in teamArray) {
                var equipe = teamArray[j] ;

                if (rang.teamcode == equipe.code) {
                    for (var k in equipe.riders) {
                        var rider = equipe.riders[k] ;

                        if (rang.number == rider.number) {
                            var p = new Element("p");
                            p.appendChild(rang.position + ". ") ;
                            if (rider.nationality == "FRA") {
                                var b = new Element("b");
                                b.appendChild(rider.lastname + " ") ;
                                b.appendChild(rider.firstname + " ") ;
                                p.appendChild(b);
                            }
                            else {
                                p.appendChild(rider.lastname + " ") ;
                                p.appendChild(rider.firstname + " ") ;
                            }
                            p.appendChild("(" + rider.nationality + ") ") ;
                            p.appendChild("(" + equipe.code + ") ") ;
                            var ld = new Element("ld");
                            ld.addAttribute(new Attribute("pattern", ".")) ;
                            p.appendChild(ld) ;
                            (rang.position == "1") ? p.appendChild(rang.time) : p.appendChild(rang.gap) ;
                            texte.appendChild(p);
                        }
                    }
                }
            }
        }
    }
    else if (name.match("SITE")) {
        var p = new Element("p");
        for (var i in rankArray) {
            var rang = rankArray[i] ;

            for (var j in teamArray) {
                var equipe = teamArray[j] ;

                if (rang.teamcode == equipe.code) {
                    for (var k in equipe.riders) {
                        var rider = equipe.riders[k] ;

                        if (rang.number == rider.number) {

                            p.appendChild(rang.position + ". ") ;
                            if (rider.nationality == "FRA") {
                                var b = new Element("b");
                                b.appendChild(rider.lastname + " ") ;
                                b.appendChild(rider.firstname + " ") ;
                                p.appendChild(b);
                            }
                            else {
                                p.appendChild(rider.lastname + " ") ;
                                p.appendChild(rider.firstname + " ") ;
                            }
                            p.appendChild("(" + rider.nationality + ") ") ;
                            p.appendChild("(" + equipe.code + ") ") ;
                            (rang.position == "1") ? p.appendChild(rang.time + "; ") : p.appendChild(rang.gap + "; ") ;
                        }
                    }
                }
            }
        }
        texte.appendChild(p);
    }
    else if ((name.match("SIPG"))||(name.match("SIMG"))) {
        var p = new Element("p");
        for (var i in rankArray) {
            var rang = rankArray[i] ;

            for (var j in teamArray) {
                var equipe = teamArray[j] ;

                if (rang.teamcode == equipe.code) {
                    for (var k in equipe.riders) {
                        var rider = equipe.riders[k] ;

                        if (rang.number == rider.number) {
                            p.appendChild(rang.position + ". ") ;
                            if (rider.nationality == "FRA") {
                                var b = new Element("b");
                                b.appendChild(rider.lastname + " ") ;
                                b.appendChild(rider.firstname + " ") ;
                                p.appendChild(b);
                            }
                            else {
                                p.appendChild(rider.lastname + " ") ;
                                p.appendChild(rider.firstname + " ") ;
                            }
                            p.appendChild("(" + rider.nationality + ") ") ;
                            p.appendChild("(" + equipe.code + "), ") ;
                            p.appendChild(rang.points+"; ");
                        }
                    }
                }
            }
        }
        texte.appendChild(p);
    }
    else if ((name.match("SETG"))||(name.match("SETE"))) {
        var p = new Element("p");
        var z = 0;
        for (var i in rankArray) {
            var rang = rankArray[i] ;
            z=z+1;
            //var arraypun=rankArray[i+1] ;
            for (var j in teamArray) {
                var equipe = teamArray[j] ;

                if (rang.teamcode == equipe.code) {
                    p.appendChild(rang.position + ". ");
                    p.appendChild(equipe.name + " ");
                    _print("size"+rankArray.size);
                    if (rankArray.size == z){
                        var gap=rang.gap;
                    } else {
                        gap=rang.gap+"; ";
                    }
                    //var gap=rang.gap;
                    (rang.position == "1") ? p.appendChild(rang.time+"; ") : p.appendChild(gap);
                }
            }
        }
        texte.appendChild(p);
    }

    article.appendChild(texte);
    root.appendChild(article);

    return doc;
}

function printXML(){
    for (var i in teamArray) {
        var equipe = teamArray[i] ;

        _print("Equipe => number : " + equipe.number + ", code : " +  equipe.code + ", name : " +  equipe.name + ", director : " +  equipe.director + ", codirector : " +  equipe.codirector + ", nationality : " +  equipe.nationality);

        for (var j in equipe.riders) {
            var rider = equipe.riders[j] ;
            _print("Equipe => Coureur : " + rider.number + ", " + rider.lastname + ", " + rider.firstname + ", " + rider.nationality + ", " + rider.birthdate + ", " + rider.uci + ", " + rider.status );
        }
        _print("") ;
    }
    _print("") ;

    for (var k in rankArray) {
        var rang = rankArray[k] ;

        _print("Rang => pos : " +  rang.position + ", number : " +  rang.number + ", teamcode : " +  rang.teamcode + ", time : " +  rang.time + ", gap : " +  rang.gap);
    }
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
    var dat = new Date();
    var yr = dat.getFullYear();
    
    var file0 = new File(INPUT_DIR, "_TDF_" + yr + "_STARTERS.xml") ;
    var file = _srcFile.getFile() ;

    try {
        _print("Creating builder");
        var doc0 = XOM.build(file0);
        var doc = XOM.build(file);

        _print("Parsing document");
        var teams = doc0.query("//team");
        for (var i=0; i<teams.size(); i++) {
            var team = createTeam(teams.get(i)) ;
            if ( team != null ) teamArray.push(team) ;
        }
        var ranks = doc.query("//rank");
        for (var j=0; j<ranks.size(); j++) {
            var rank = createRank(ranks.get(j)) ;
            if ( rank != null ) rankArray.push(rank) ;
        }

        //    _print("Printing xml");
        //    printXML() ;

        _print("Creating xml");
        var document = createXML( _srcFile.getName()) ;

        _print("Writing xml");
        var name = _srcFile.getName().substr(0, _srcFile.getName().indexOf(".")) + "_" + getToday() + ".xml" ;
        for (j in OUTPUT_DIR) {
            var file = new File(OUTPUT_DIR[j], name) ;
            writeXML(document, file) ;
        }

    }
    catch(e) {
        _print(e) ;
        return _FAIL ;
    }

    return _OK ;
//return _KEEP ;
}

// start & exit
_exit = main() ;
