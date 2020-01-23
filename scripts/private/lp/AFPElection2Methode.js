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

var OUTPUT_DIR = ["C:/export/home/election/regionales/2015/2_tour/envois"] ;
var inscrits = "I : " ;
var votants = "V : " ;
var exprimes = "E : " ;
var abstentions = "Abs : " ;
var blancs = "Blanc : " ;
var nuls = "Nul : " ;
var listes = "Listes" ;
var sources = "Source" ;
var signature = "./bde" ;
var signSrc = "(ministère";
			 
var results = new Object();

// Today
function getToday() {
    var da = new Date() ;
    if (da.getHours() > 3) {
        da.setDate(da.getDate());
    }
    var jour = new String(da.getDate()) ;
    if ( jour.length == 1 ) jour = "0" + jour ;

    var mois = new String(da.getMonth()+1) ;
    if ( mois.length == 1 ) mois = "0" + mois ;

    var annee = new String(da.getFullYear()) ;
    //return jour + '-' + mois + '-' + annee ;	
	return annee + mois + jour ;	
}

// Create a team instance
function createResults(doc) {
    var results = new Object();
    var cands = new Array() ;
	        	  	
    var value0 = getValue(doc, "//titre/p") ;

    results.elu = "Ballottage";
    if ( value0 == "" ) {
        _print("Impossible de trouver le titre");
        return null ;
    }
    else if (value0.indexOf("2e") == -1) results.elu = ""; 
    results.titre = value0.replace("Elections régionales 2e tour - ", "") ;
    results.inscrit = "0";
    results.votant = "0";
    results.exprime = "0";
    results.abstention = "0";
    results.maire = "";
    results.siege = "";
    
    var nodes = doc.query("//texte/p") ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i).getValue();
        
        if (node.trim() != ""){
		if ((!startsWith(node, listes))&&(!startsWith(node, signature))&&(!startsWith(node, signSrc))) {
	        	if (startsWith(node,"Résultat du 1er tour")) break ;
	        	else if (startsWith(node, inscrits)) results.inscrit = node.substring(inscrits.length).trim().replace("."," ") ;
	        	else if (startsWith(node, votants)) results.votant = node.substring(votants.length).trim().replace("."," ");
	        	else if (startsWith(node, exprimes)) results.exprime = node.substring(exprimes.length).trim().replace("."," ") ;
	        	else if (startsWith(node, sources)) results.source = node.substring(sources.length).trim().replace("."," ") ;
	        	else if (startsWith(node, abstentions)) results.abstention = (Math.round(node.substring(abstentions.length).trim().replace("%","").replace(",",".")*10)/10 + "").replace(".",",") ;
			else if (startsWith(node, blancs)) results.blanc = (Math.round(node.substring(blancs.length).trim().replace("%","").replace(",",".")*10)/10 + "").replace(".",",") ;
			else if (startsWith(node, nuls)) results.nul = (Math.round(node.substring(nuls.length).trim().replace("%","").replace(",",".")*10)/10 + "").replace(".",",") ;
			else { 
	        	  	var liste = node.trim().substring(0, node.trim().indexOf('%')+1).replace(") ", ")  ");
	        	  	_print("liste : " + liste);
	        	  	var sieg = node.trim().substring(node.trim().indexOf('%')+1, node.trim().length());
	        	  	_print("sieg : " + sieg);
	        	     //_print("candidats : " + node.trim());
				var candidat = new Object();
				var tokens = liste.split("  ");
        			for (var j=0; j < tokens.length; j++){
	        	  		var token = tokens[j].trim();
	        	  		//_print("candidat tokens : " + token);
	        	  		if (token.length == 0) continue;
		        	  	if (token.indexOf('(') > 0) candidat.name = token;
		        	  	else {
			        	  	var tokens0 = token.split(" ");
			        	  	for (var j=0; j < tokens0.length; j++){
			        	  		var token0 = tokens0[j].trim();
			        	  		if (token0.indexOf('%') > 0) {
				        	  		candidat.pct = (Math.round(token0.trim().replace("%","").replace(",",".")*10)/10 + "").replace(".",",");
				        	  	}
				        	  	else candidat.voix = token0.replace("."," ");
			        	  	}
		        	  	}
		        	  	
	        	  	}
	        	  	candidat.elus = sieg.trim().replace("Ballottage", "");
		        	if (candidat.name) {
		        		cands.push(candidat) ;
		        	}
       	  	}
        	  } 
        }
    }
    cands.sort(function(a,b) { return parseFloat(b.pct.replace(",",".")) - parseFloat(a.pct.replace(",",".")) } );
    results.candidats = cands ; 

    // for (var i=0; i < results.candidats.length; i++){
	//	 _print("candidat voix : " + results.candidats[i].voix);
    	//	 if (( parseInt(results.candidats[i].voix.replace(" ","")) > parseInt(results.exprime.replace(" ",""))/2 + 1 ) && ( parseInt(results.candidats[i].voix.replace(" ","")) > parseInt(results.inscrit.replace(" ",""))/4 + 1 )) {
    	//		results.elu = "Conseil élu";
    	//   }
    //}

    //results.elus = "";
    //if (results.elu == "Conseil élu") {
    //	   for (var i=0; i < results.candidats.length; i++){
    //	   	 if ((results.candidats[i].name)&&(results.candidats[i].elus.trim()!="")) {
    //	      	results.elus += results.candidats[i].name + " : " + results.candidats[i].elus.trim() + ", ";
    //	   	 }
    //	   }
    //}
    
    //if (results.elus != "") {
	//	_print(results.elus);
	//	results.elus = results.elus.substring(0, results.elus.length-2);
	//}

    //_print("resultat elus : " + results.elus);
    return results ;
}

function beautifyTime(time) {
    var tokens = time.split( ":" );
    return tokens[0] + " h " + tokens[1] + "'" + tokens[2] + "''";
}

function startsWith(str, str2){
    return str.indexOf(str2) == 0;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

function createXML() {
    
    var root = new Element("doc");
    var sep = "grey";
        
    root.addAttribute(new Attribute("lang", "fr") ) ;

    var doc = new Document(root);
    doc.insertChild(new DocType("doc", "/SysConfig/LP/Rules/lp.dtd"), 0);
    doc.insertChild(new ProcessingInstruction("EM-dtdExt", "/SysConfig/LP/Rules/lp.dtx"), 1);
    doc.insertChild(new ProcessingInstruction("EM-templateName", "/SysConfig/LP/Templates/Standard.xml"), 2);
    doc.insertChild(new ProcessingInstruction("xml-stylesheet", "href=\"/SysConfig/LP/Styles/base.css\" type=\"text/css\""), 3);

    var article = new Element("article");

    // Create a table for results display
    var tables = new Element("tables");
    var p1 = new Element("p");
    p1.addAttribute(new Attribute("class", "tab_results_header_sect")) ;
    p1.appendChild(results.titre) ;
    tables.appendChild(p1);
 //   var p2 = new Element("p");
 //   p2.addAttribute(new Attribute("class", "tab_results_header_elu")) ;
 //   p2.appendChild(results.elu) ;
 //   tables.appendChild(p2);
    var table = new Element("table");
    table.addAttribute(new Attribute("class", "tab_results_header")) ;
    
    var tr0 = new Element("tr");
    var td01 = new Element("td");
    td01.addAttribute(new Attribute("class", "tab_results_header_insc")) ;
    td01.addAttribute(new Attribute("colspan", "2")) ;
    td01.appendChild("Inscrits");
    tr0.appendChild(td01);
    var td02 = new Element("td");
    td02.addAttribute(new Attribute("class", "tab_results_total_insc")) ;
    td02.appendChild(results.inscrit);
    tr0.appendChild(td02);
    var td03 = new Element("td");
    td03.addAttribute(new Attribute("class", "tab_results_total_insc2")) ;
    tr0.appendChild(td03);
    var td04 = new Element("td");
    td04.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
    tr0.appendChild(td04);
    table.appendChild(tr0);

    var tr1 = new Element("tr");
    var td10 = new Element("td");
    td10.addAttribute(new Attribute("class", "tab_results_header_vote")) ;
    td10.addAttribute(new Attribute("colspan", "2")) ;
    td10.appendChild("Votants");
    tr1.appendChild(td10);
    var td11 = new Element("td");
    td11.addAttribute(new Attribute("class", "tab_results_total_vote")) ;
    td11.appendChild(results.votant);
    tr1.appendChild(td11);
    var td12 = new Element("td");
    td12.addAttribute(new Attribute("class", "tab_results_total_vote2")) ;
    tr1.appendChild(td12);
    var td13 = new Element("td");
    td13.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
    tr1.appendChild(td13);
    table.appendChild(tr1);

    var tr2 = new Element("tr");
    var td20 = new Element("td");
    td20.addAttribute(new Attribute("class", "tab_results_header_expr")) ;
    td20.addAttribute(new Attribute("colspan", "2")) ;
    td20.appendChild("Exprimés");
    tr2.appendChild(td20);
    var td21 = new Element("td");
    td21.addAttribute(new Attribute("class", "tab_results_total_expr")) ;
    td21.appendChild(results.exprime);
    tr2.appendChild(td21);
    var td22 = new Element("td");
    td22.addAttribute(new Attribute("class", "tab_results_total_expr2")) ;
    tr2.appendChild(td22);
    var td23 = new Element("td");
    td23.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
    tr2.appendChild(td23);
    table.appendChild(tr2);

    var tr3 = new Element("tr");
    var td30 = new Element("td");
    td30.addAttribute(new Attribute("class", "tab_results_header_abst")) ;
    td30.addAttribute(new Attribute("colspan", "2")) ;
    td30.appendChild("Abstention");
    tr3.appendChild(td30);
    var td31 = new Element("td");
    td31.addAttribute(new Attribute("class", "tab_results_total_abst")) ;
    tr3.appendChild(td31);
    var td32 = new Element("td");
    td32.addAttribute(new Attribute("class", "tab_results_total_abst2")) ;
    td32.appendChild(results.abstention);
    tr3.appendChild(td32);
    var td33 = new Element("td");
    td33.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
    td33.appendChild("%");
    tr3.appendChild(td33);
    table.appendChild(tr3);

    var tr4 = new Element("tr");
    var td40 = new Element("td");
    td40.addAttribute(new Attribute("class", "tab_results_header_abst")) ;
    td40.addAttribute(new Attribute("colspan", "2")) ;
    td40.appendChild("Blancs");
    tr4.appendChild(td40);
    var td41 = new Element("td");
    td41.addAttribute(new Attribute("class", "tab_results_total_abst")) ;
    tr4.appendChild(td41);
    var td42 = new Element("td");
    td42.addAttribute(new Attribute("class", "tab_results_total_abst2")) ;
    td42.appendChild(results.blanc);
    tr4.appendChild(td42);
    var td43 = new Element("td");
    td43.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
    td43.appendChild("%");
    tr4.appendChild(td43);
    table.appendChild(tr4);

    var tr5 = new Element("tr");
    var td50 = new Element("td");
    td50.addAttribute(new Attribute("class", "tab_results_header_abst")) ;
    td50.addAttribute(new Attribute("colspan", "2")) ;
    td50.appendChild("Nuls");
    tr5.appendChild(td50);
    var td51 = new Element("td");
    td51.addAttribute(new Attribute("class", "tab_results_total_abst")) ;
    tr5.appendChild(td51);
    var td52 = new Element("td");
    td52.addAttribute(new Attribute("class", "tab_results_total_abst2")) ;
    td52.appendChild(results.nul);
    tr5.appendChild(td52);
    var td53 = new Element("td");
    td53.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
    td53.appendChild("%");
    tr5.appendChild(td53);
    table.appendChild(tr5);

    for (var j in results.candidats) {
    	    if (sep == "grey") sep = "blank"; else sep = "grey";
    	    var cand = results.candidats[j] ;
	    var tr6 = new Element("tr");
	    tr6.addAttribute(new Attribute("class", "tab_results_header_" + sep)) ;
	    var td60 = new Element("td");
	    td60.addAttribute(new Attribute("class", "tab_results_header_cand")) ;
	    td60.addAttribute(new Attribute("colspan", "2")) ;
	    td60.appendChild(cand.name);
	    var ld = new Element("ld");
	    ld.addAttribute(new Attribute("pattern", ".")) ;
	    td60.appendChild(ld);
	    tr6.appendChild(td60);
	    var td61 = new Element("td");
	    td61.addAttribute(new Attribute("class", "tab_results_total_voix")) ;
	    td61.appendChild(cand.voix);
	    tr6.appendChild(td61);
	    var td62 = new Element("td");
	    td62.addAttribute(new Attribute("class", "tab_results_total_pctVoix")) ;
	    td62.appendChild(cand.pct);
	    tr6.appendChild(td62);
	    var td63 = new Element("td");
	    td63.addAttribute(new Attribute("class", "tab_results_total_pct")) ;
	    td63.appendChild("%");
	    tr6.appendChild(td63);
	    table.appendChild(tr6);
    }

//    var tr5 = new Element("tr");
//    var td50 = new Element("td");
//    td50.addAttribute(new Attribute("class", "tab_results_footer")) ;
//    td50.addAttribute(new Attribute("colspan", "5")) ;
//    var b = new Element("b");
//    b.appendChild("Maire sortant :");
//    td50.appendChild(b);
//    td50.appendChild(results.maire.replace("Maire sortant :",""));
//    tr5.appendChild(td50);
//    table.appendChild(tr5);
//    var tr6 = new Element("tr");
//    var td60 = new Element("td");
//    td60.addAttribute(new Attribute("class", "tab_results_footer")) ;
//    td60.addAttribute(new Attribute("colspan", "5")) ;
//    td60.appendChild(results.siege);
//    td60.appendChild(". ");
//    td60.appendChild(results.elus)
//    tr6.appendChild(td60);
//    table.appendChild(tr6);

    tables.appendChild(table);
    article.appendChild(tables);
    root.appendChild(article);

    return doc;
}

function printXML(){
    _print("Results : titre : " + results.titre) ;
    _print("Results : élu : " + results.elu) ;
    _print("Results => inscrits : " + results.inscrit + ", votants : " +  results.votant + ", exprimes : " +  results.exprime + ", abstention : " +  results.abstention);

    for (var j in results.candidats) {
        var cand = results.candidats[j] ;
        _print("Results => Nom : " + cand.name + ", voix : " + cand.voix + ", pct : " + cand.pct );
    }
    _print("Results : " + results.siege) ;
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

    try {

	    _print("Creating builder");
	    var builder = new Builder();
	    var doc = builder.build(file);
	
	    _print("Parsing document");
	    results = createResults(doc) ;
	    
	    _print("Printing xml");
	    printXML() ;
	
	    _print("Creating xml");
	    var document = createXML() ;
	
	    _print("Writing xml");
	    var name = _srcFile.getName().substr(0, _srcFile.getName().indexOf(".")) + ".xml" ;
	    name = "AFP_" + name ;
	    for (j in OUTPUT_DIR) {
	        var file = new File(OUTPUT_DIR[j], getToday() + '-' + name) ;
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

