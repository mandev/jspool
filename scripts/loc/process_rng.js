/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.java.net);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.nu.xom);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());
// prod: http://elections.interieur.gouv.fr/telechargements/RG2015/
// D:\LP\ArrExt\elections\in

var OUTPUT_DIR = "D:/LP/ArrExt/elections/resultats";
var CHARSET = "ISO-8859-1";

var isModified = false;

function writeElement(document, dstFile) {
    _print("writeElement: " + dstFile);
    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);
    else
        FileUtils.forceMkdir(dstFile.getParentFile());

    var os = new BufferedOutputStream(new FileOutputStream(dstFile));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(document);
    os.close();
}

function parseRng() {
    _print("parseRng");

    var xc = new XPathContext();
    xc.addNamespace("rng", "http://relaxng.org/ns/structure/1.0");

    var file = _srcFile.getFile() ;
    var doc = ScriptUtils.createXomBuilder(false, false).build(file);
    var root = doc.getRootElement();

            _print("parseIndex - root: " + root.toString());

    //    <rng:element name="DataObjectPackage">
    //        <rng:element name="DescriptiveMetadata">
    //            <rng:element name="ArchiveUnit">
    //                <rng:element name="Content">
    //                    <rng:element name="ArchiveUnit">
    //                        <rng:element name="Content">
    var nodes = doc.query('//rng:element[@name="DataObjectPackage"]//rng:element[@name="DescriptiveMetadata"]//rng:element[@name="ArchiveUnit"]//rng:element[@name="Content"]', xc); 
    if (nodes == null ) {
        _print("nodes does not exist");
        return ;
    }

    var max = nodes.size() - 1 ;
    _print("nodes.size(): " + max);
    
    var content = nodes.get(nodes.size()-1) ;
    var elts = content.query('rng:element[@name]',xc) ;            
    for (var i = 0; i < elts.size(); i++) {
        var element = elts.get(i);
        // _print("node: " + element);
        var name  = getSubElements(element, xc);
//        var name = element.getAttribute("name").getValue();
//        if ( name == "Keyword") {
//            name = name + "." + getKeyWordReference(element, xc)  ;            
//        }
        _print("tag: " + name);
     }

     _print("ok");
 }

function getSubElements(element, xc) {
    var name = element.getAttribute("name").getValue();
    var elts = element.query('rng:element[@name]',xc) ;            
    for (var i = 0; i < elts.size(); i++) {
        return name + "." +  getSubElements(elts.get(i), xc);
    }
    return name ;
}

function getKeyWordReference(element, xc) {
    var elts = element.query('rng:element[@name="KeywordReference"]',xc) ;            
    var value = elts.get(0).getValue().trim();
    return value ;
}


function parseIndex2() {
    
    for (var i = 0; i < rootElt.size(); i++) {

    var regionNodes = doc.query("/Election/Regions/Region"); // Election/Regions/Region/CodReg DateDerMaj HeureDerMaj Complet

        for (var i = 0; i < regionNodes.size(); i++) {
            var regionNode = regionNodes.get(i);
            var cr = regionNode.getFirstChildElement("CodReg").getValue();
            var cp = regionNode.getFirstChildElement("Complet").getValue();

            _print("parseIndex - region: " + cr);
            var maj = regionNode.getFirstChildElement("DateDerMaj").getValue() + "_" + regionNode.getFirstChildElement("HeureDerMaj").getValue();
            if (REGION_MAP.get(cr) != maj) {
            	 
//            	 if ( cp != "N" ) { 
                	var status = writeXML("Region", OUTPUT_DIR + "/" + cr, ROOT_URL + "/" + cr, cr);
	      		 if ( status == 0 ) {               
	               	 isModified = true;
	                	REGION_MAP.put(cr, maj);
           		 }
  //          	 }
                var codSecElecNodes = regionNode.query("SectionsElectorales/SectionElectorale/CodSecElec"); // Election/Regions/Region/CodReg DateDerMaj HeureDerMaj Complet
                for (var j = 0; j < codSecElecNodes.size(); j++) {
                    parseRegionIndex(cr, codSecElecNodes.get(j).getValue());
                }
            	 
            }
        }
    }
}

function parseRegionIndex(codReg, codSecElec) {
    _print("parseRegionIndex: " + codReg + " - " + codSecElec);

    var file = null;
    var lpath, upath, query, cse;
    if (StringUtils.endsWith(codSecElec, "00")) {
        cse = codReg;
        lpath = OUTPUT_DIR + "/" + codReg;
        upath = ROOT_URL + "/" + codReg;
        query = "/Election/Region/Tours/Tour[NumTour=" + TOUR + "]/Communes/Commune";
    }
    else {
        cse = codSecElec;
        lpath = OUTPUT_DIR + "/" + codReg + "/" + codSecElec;
        upath = ROOT_URL + "/" + codReg + "/" + codSecElec;
        query = "/Election/Region/SectionElectorale/Tours/Tour[NumTour=" + TOUR + "]/Communes/Commune";
        writeXML("Section", lpath, upath, cse);
    }

    try {
        file = download(upath + "/index.xml", lpath + "/index.xml");
        var doc = ScriptUtils.createXomBuilder(false, false).build(file);
        var communeNodes = doc.query(query);
        for (var i = 0; i < communeNodes.size(); i++) {
            var communeNode = communeNodes.get(i);
            var pvn = communeNode.getFirstChildElement("ResultatsParvenus").getValue();
		  if ( pvn == "N" ) continue ;
            var csc = communeNode.getFirstChildElement("CodSubCom").getValue();
            var key = codReg + "_" + codSecElec + "_" + csc;
            var maj = communeNode.getFirstChildElement("DateDerMaj").getValue() + "_" + communeNode.getFirstChildElement("HeureDerMaj").getValue();
            if (COMMUNE_MAP.get(key) != maj) {
                var status = writeXML("Commune", lpath, upath, cse + "" + csc);
            	 if ( status == 0 ) {
	                isModified = true;
	                COMMUNE_MAP.put(key, maj);
            	 }
            }
        }
    }
    catch (e) {
        var logmsg = "ERROR: " + e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]";
        _print(logmsg);
        FileUtils.writeStringToFile(LOG_FILE, new Date() + " - " + logmsg + "\n", CHARSET, true);
    }
}

function writeXML(tag, lpath, upath, code) {
    _print("writeXML: " + tag + " - " + lpath + " - " + upath + " " + code);
    var file = null;
    var status = 0 ;

    try {
        file = download(upath + "/" + code + ".xml", null);
        writeElement(createXmlDoc(file, tag), new File(lpath, code + ".xml"));
    }
    catch (e) {
        var logmsg = "ERROR: " + e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]";
        _print(logmsg);
        FileUtils.writeStringToFile(LOG_FILE, new Date() + " - " + logmsg + "\n", CHARSET, true);
        status = 1 ;
    }

    if (file != null && file.exists())
        FileUtils.forceDelete(file);

	return status ;
}

function createXmlDoc(file, tag) {
    var element = new Element(tag);
    var doc = ScriptUtils.createXomBuilder(false, false).build(file);
    var electionNode = doc.getRootElement();
    var node = electionNode.getFirstChildElement("Region");
    element.appendChild(node.getFirstChildElement("CodReg").copy());
    element.appendChild(node.getFirstChildElement("LibReg").copy());
    var nbSapNode = node.getFirstChildElement("NbSap");
    if (nbSapNode != null)
        element.appendChild(nbSapNode.copy());

    var sectionElectoraleNode = node.getFirstChildElement("SectionElectorale");
    if (sectionElectoraleNode != null) {
        element.appendChild(sectionElectoraleNode.getFirstChildElement("CodSecElec").copy());
        element.appendChild(sectionElectoraleNode.getFirstChildElement("LibSecElec").copy());
        node = sectionElectoraleNode;
    }

    var communeNode = node.getFirstChildElement("Commune");
    if (communeNode != null) {
        element.appendChild(communeNode.getFirstChildElement("CodSubCom").copy());
        element.appendChild(communeNode.getFirstChildElement("LibSubCom").copy());
        node = communeNode;
    }

    var toursNode = node.getFirstChildElement("Tours");
    var tourNodes = toursNode.getChildElements("Tour");
    for (var i = 0; i < tourNodes.size(); i++) {
        var tourNode = tourNodes.get(i);
        var numTourNode = tourNode.getFirstChildElement("NumTour");
        var numTour = numTourNode.getValue();
        if (numTour == TOUR) {
            element.appendChild(numTourNode.copy());

            var mentionsNode = tourNode.getFirstChildElement("Mentions");
            element.appendChild(mentionsNode.getFirstChildElement("Inscrits").copy());
            element.appendChild(mentionsNode.getFirstChildElement("Abstentions").copy());
            element.appendChild(mentionsNode.getFirstChildElement("Votants").copy());
            element.appendChild(mentionsNode.getFirstChildElement("Blancs").copy());
            element.appendChild(mentionsNode.getFirstChildElement("Nuls").copy());
            element.appendChild(mentionsNode.getFirstChildElement("Exprimes").copy());

            var listesElt = new Element("Listes");
            element.appendChild(listesElt);

            var listesNode = tourNode.getFirstChildElement("Listes");
            var listeNodes = listesNode.getChildElements("Liste");
            for (var j = 0; j < listeNodes.size(); j++) {
                var listeElt = new Element("Liste");
                listesElt.appendChild(listeElt);
                var listeNode = listeNodes.get(j);
                listeElt.appendChild(listeNode.getFirstChildElement("NomTeteListe").copy());
                listeElt.appendChild(listeNode.getFirstChildElement("PrenomTeteListe").copy());
                listeElt.appendChild(listeNode.getFirstChildElement("CiviliteTeteListe").copy());
                listeElt.appendChild(listeNode.getFirstChildElement("CodNuaListe").copy());
                listeElt.appendChild(listeNode.getFirstChildElement("LibNuaListe").copy());
                listeElt.appendChild(listeNode.getFirstChildElement("NbVoix").copy());
                listeElt.appendChild(listeNode.getFirstChildElement("RapportExprime").copy());
                var nbSiegesNode = listeNode.getFirstChildElement("NbSieges") ;
                if ( nbSiegesNode != null) listeElt.appendChild(nbSiegesNode.copy());          
            }
        }
    }

    var sourceElt = new Element("Source");
    sourceElt.appendChild("Minist�re de l'Int�rieur");
    element.appendChild(sourceElt);
    return new Document(element);
}


function main() {
    parseRng();
    return _KEEP ;
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
