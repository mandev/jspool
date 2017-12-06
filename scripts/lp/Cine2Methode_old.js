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
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// List All children - Node, int

var OUTPUT_DIR = ["D:/METHODE/DEV/cinema/","D:/METHODE/QA/cinema/","D:/METHODE/PROD/cinema/"] ;
var DEP = ["77","78","91","92","93","94","95"] ;
var dateFin = "";
var lieuArray = new Array() ;

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
    return jour + mois + annee ;	
}

// Create a film instance
function createFilm(doc, value) {
    var fm = doc.query("//Film [@id='"+value+"']").get(0);

    var value0 = getValue(fm, "@id") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver le titre du film");
        return null ;
    }

    return getValue(fm, "@titre") ;
    
}

// Create a lieu instance
function createLieu(lieu, doc) {
    var lu = new Object();

    var value0 = getValue(lieu, "@id") ;

    if ( value0 == "" ) {
        if ( teamArray.length == 0 ) {
            _print("Impossible de trouver le nom du lieu");
            return null ;
        }
    }
    lu.id = value0 ;

    lu.nom = getValue(lieu, "@nom") ;
    lu.numeroAdresse = getValue(lieu, "@numeroAdresse") ;
    lu.adresse = getValue(lieu, "@adresse") ;
    lu.ville = getValue(lieu, "@ville") ;
    lu.codePostal = getValue(lieu, "@codePostal") ;
    lu.codeLocation = getValue(lieu, "@codeLocation") ;
    lu.telephone = getValue(lieu, "InfoContact/@telephone") ;
    lu.events = createEvents(doc, value0) ;

    return lu ;
}

// Create a lieu instance
function createEvents(doc, value) {
    var events = new Array() ;
    
    var nodes = doc.query("//EvenementSimple [@lieuId='" + value + "']");
    
    for (var j=0; j<nodes.size(); j++) {
        var event = nodes.get(j) ;
        var ev = new Object();
        var value0 = getValue(event, "@id") ;
        var value1 = getValue(event, "@contenuId") ;

        if ( value0 == "" ) {
            if ( teamArray.length == 0 ) {
                _print("Impossible de trouver le nom de l'événement");
                return null ;
            }
        }
        ev.id = value0 ;
        ev.contenuId = value1 ;
        ev.titre = createFilm(doc, value1) ;
        ev.horairesLitteraux = getValue(event, "Horaires/@horairesLitteraux").toLowerCase().replace('lundi','lun').replace('mardi','mar').replace('mercredi','mer').replace('jeudi','jeu').replace('vendredi','ven').replace('samedi','sam').replace('dimanche','dim') ;
    
        if ( value0 != "" ) events.push(ev);
    }

    return events ;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

function beautifyTel(tel) {
    return tel.substr(0,2) + "." + tel.substr(2,2) + "." + tel.substr(4,2) + "." + tel.substr(6,2) + "." + tel.substr(8,2);
}

function dynamicSort(property) {
    return function (a,b) {
        return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    }
}

	function createXML(code) {

    var root = new Element("doc");
    root.addAttribute(new Attribute("lang", "fr") ) ;

    var doc = new Document(root);
    doc.insertChild(new DocType("doc", "/SysConfig/LP/Rules/lp.dtd"), 0);
    doc.insertChild(new ProcessingInstruction("EM-dtdExt", "/SysConfig/LP/Rules/lp.dtx"), 1);
    doc.insertChild(new ProcessingInstruction("EM-templateName", "/SysConfig/LP/Templates/Standard.xml"), 2);
    doc.insertChild(new ProcessingInstruction("xml-stylesheet", "href=\"/SysConfig/LP/Styles/base.css\" type=\"text/css\""), 3);

    var article = new Element("article");
    var titraille = new Element("titraille");
    var titre = new Element("titre");
    var p = new Element("p");
    p.appendChild("A L'AFFICHE JUSQU'AU " + dateFin);
    titre.appendChild(p);
    titraille.appendChild(titre);
    article.appendChild(titraille);

    var texte = new Element("texte");
    var codeDep = "";
    var lieuId = "";

    lieuArray.sort(dynamicSort("ville"));

    for (var j in lieuArray) {
        var lieu = lieuArray[j] ;
        var p0 = new Element("p");
        if (lieu.codePostal.substr(0,2).equals(code)) {
            if (!codeDep.equals(lieu.codePostal)) {
                codeDep = lieu.codePostal;
                var inter = new Element("intertitre");
                var p1 = new Element("p");
                p1.appendChild(lieu.ville);
                inter.appendChild(p1);
                texte.appendChild(inter);
            }
            if (!lieuId.equals(lieu.id)) {
                lieuId = lieu.id;
                var b1 = new Element("b");
                b1.appendChild(lieu.nom + ", " + ((lieu.numeroAdresse=="")? "" : (lieu.numeroAdresse + ", ")) + lieu.adresse + " ");
                p0.appendChild(b1);
                p0.appendChild("(tél. " + beautifyTel(lieu.telephone) + "). ");
            }
            for (var i in lieu.events) {
                var event = lieu.events[i] ;
                b2 = new Element("b");
                b2.appendChild(event.titre + " : ");
                p0.appendChild(b2);
                p0.appendChild(event.horairesLitteraux + " ");
            }
            texte.appendChild(p0);
        }
    }

    article.appendChild(texte);
    root.appendChild(article);

    return doc;
}

function printXML(){
    for (var k in lieuArray) {
        var lieu = lieuArray[k] ;

        _print("Lieu => ID : " +  lieu.id + ", nom : " +  lieu.nom + ", numeroAdresse : " +  lieu.numeroAdresse + ", adresse : " +  lieu.adresse + ", ville : " +  lieu.ville + ", codePostal : " +  lieu.codePostal + ", codeLocation : " +  lieu.codeLocation + ", telephone : " +  lieu.telephone);

        for (var l in lieu.events) {
            var event = lieu.events[l] ;

            _print("Event => ID : " +  event.id + ", titre : " +  event.titre + ", contenuId : " +  event.contenuId + ", horairesLitteraux : " +  event.horairesLitteraux);
        }
    }
    _print(dateFin) ;
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

//            try {

    _print("Creating builder");
    var builder = new Builder();
    var doc = builder.build(file);

    _print("Parsing document");
    var agenda = doc.query("//FluxAgenda").get(0);
    dateFin = getValue(agenda, "@jourFin").toUpperCase() + " " + getValue(agenda, "@dateFin").substr(0,2) + " " + getValue(agenda, "@moisFin").toUpperCase() ;

    var lieux = doc.query("//Lieu");
    for (var j=0; j<lieux.size(); j++) {
        var lieu = createLieu(lieux.get(j), doc) ;
        if ( lieu != null ) lieuArray.push(lieu) ;
    }
	
//            _print("Printing xml");
//            printXML() ;

    _print("Creating xml");
    for (k in DEP) {
        var document = createXML(DEP[k]) ;

        var name = _srcFile.getName().substr(0, 4) + DEP[k] + "_" + getToday() + ".xml" ;
        for (j in OUTPUT_DIR) {
            var file = new File(OUTPUT_DIR[j], name) ;
            writeXML(document, file) ;
        }
    }

//                }
//               catch(e) {
//                    _print(e) ;
//                   return _FAIL ;
//                }

    return _OK ;
//return _KEEP ;
}

// start & exit
_exit = main() ;

