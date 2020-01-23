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
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// List All children - Node, int

var OUTPUT_DIR = ["D:/LP/ArrExt/ExportsSoHO/XML_out2/Prod/", "D:/LP/ArrExt/ExportsSoHO/XML_out2/QA/"] ;
var groupArray = new Array() ;

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

// Create a sport instance
function createSport(dataContainers) {
    var sport = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='1']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='1']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver le nom du sport");
    }
    sport.name = value0 ;
    sport.classe = value1 ;

    return sport ;
}

// Create a district instance
function createDistrict(dataContainers) {
    var district = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='2']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='2']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver le nom du district");
    }

    district.name = value0 ;
    // creation d'un district special pour les femininine
    if (district.name.toLowerCase().indexOf("minine")!=-1) district.classe = "FEMININES" ;
    else district.classe = value1 ;

    return district ;
}

// Create a championship instance
function createChampionship(dataContainers) {
    var championship = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='3']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='3']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver le nom du championnat");
    }

    championship.name = value0 ;
    // creation d'un championship special pour les femininine
    if (championship.name.toLowerCase().indexOf("minine")!=-1) championship.classe = "FEMININES" ;
    else championship.classe = value1 ;

    return championship ;
}

// Create a group instance
function createGroup(dataContainers) {
    var group = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='4']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='4']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        if ( groupArray.length == 0 ) {
            _print("Impossible de trouver le nom du groupe");
            return null ;
        }
    }
    group.name = value0 ;
    group.classe = value1 ;

    group.sport = createSport(dataContainers);
    group.district = createDistrict(dataContainers);
    group.championship = createChampionship(dataContainers);
    group.results = createResults(dataContainers);
    group.rankings = createRanks(dataContainers);
    group.nextRound = createNextRound(dataContainers);
    group.calendars = createCalendars(dataContainers);
    return group ;
}

// Create a results instance
function createResults(dataContainers) {
    var result = new Object() ;

    var xpath = "dataContainer [@type='5']/dataBlocs/dataBloc"
    var nodes = dataContainers.query(xpath) ;

    var round = "" ;
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        round = getValue(node, "dataList/data [@name='Num_journee']/value") ;
        if ( round != "" ) break ;
    }

    if ( round == "" ) {
        _print("Impossible de trouver le numéro de journée dans les résultats");
    }

    var matchs = new Array() ;
    var matchs0 = new Array() ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var match = new Object();
        match.homeTeam = getValue(node, "dataList/data [@name='Receveur']/value") ;
        match.awayTeam = getValue(node, "dataList/data [@name='Visiteur']/value") ;
        match.score = getValue(node, "dataList/data [@name='ScoreMatch']/value") ;
        if ( match.homeTeam != "" && match.awayTeam != "" && match.score != "" ) {
            matchs.push(match) ;
	}
        // Equipe Exempte
        else {
	    var match0 = new Object();
            match0.homeTeam = getValue(node, "outputs/output [@type='Raw']/value");
	    match0.awayTeam = "" ;
            match0.score = "" ;
        
            matchs0.push(match0) ;
        }
    }
    for (j in matchs0) matchs.push(matchs0[j]) ;
    
    result.round = round ;
    result.matchs = matchs ;
    return result;
}

// Create a rankings instance
function createRanks(dataContainers) {
    var rankings = new Array() ;

    var xpath = "dataContainer [@type='6']/dataBlocs/dataBloc"
    var nodes = dataContainers.query(xpath) ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var rank = new Object();
        
        rank.position = getValue(node, "dataList/data [@name='Numero']/value") ;
        rank.played = getValue(node, "dataList/data [@name='Journee']/value") ;
        rank.team = getValue(node, "dataList/data [@name='NomEquipe']/value") ;
		// $SH Moyenne le 02122012
		rank.moy = getValue(node, "dataList/data [@name='Moy']/value") ;
		// Fin $SH Moyenne le 02122012
        rank.points = getValue(node, "dataList/data [@name='Points']/value") ;
        rank.goalAgainst = getValue(node, "dataList/data [@name='ButContre']/value") ;
        rank.goalFor = getValue(node, "dataList/data [@name='ButPour']/value") ;
        rank.goalDiff = getValue(node, "dataList/data [@name='ButDiff']/value") ;
        rank.lostMatch = getValue(node, "dataList/data [@name='MatchPerdu']/value") ;
        rank.wonMatch = getValue(node, "dataList/data [@name='MatchGagne']/value") ;
        rank.drawMatch = getValue(node, "dataList/data [@name='MatchNul']/value") ;
        rank.filet = createFilets(dataContainers, getValue(node, "dataList/data [@name='Numero']/value")) ;

        if ( rank.team != "" )
            rankings.push(rank) ;
    }
    return rankings;
}

// Create a filets instance
// We have to specify filet for separation rankings if exists
function createFilets(dataContainers, position) {
    var val = false ;

    var xpath = "dataContainer [@type='6']/dataBlocs/dataBloc [@name='Enrichments']"
    var nodes = dataContainers.query(xpath) ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        
        filet = getValue(node, "styleContainer/styles/style[@name='LineNumber']/value") ;
        if ( filet.equals(position) ) val = true ;
    }
    return val;

}

// Create a nextRound instance
function createNextRound(dataContainers) {
    var round = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='6']/dataBlocs/dataBloc [@name='Comment']/outputs/output [@type='Raw']/value") ;

    if ( value0 == "" ) {
        _print("Impossible de trouver le commentaire de la prochaine journée");
    }
    round.name = "nextRound" ;
    round.comment = value0 ;

    return round;
}

// Create a calendars instance
function createCalendars(dataContainers) {
    var calendars = new Array() ;

    // Liste des dataBlocs
    var xpath = "dataContainer [@type='7']/dataBlocs"
    var nodes = dataContainers.query(xpath) ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var calendar = new Object() ;
        calendar.round = getValue(node, "dataBloc/dataList/data [@name='Journee']/value") ;
        var date = getValue(node, "dataBloc/dataList/data [@name='Date']/value") ;
        var sdf = new SimpleDateFormat("dd/MM/yyyy");
        var sdf2 = new SimpleDateFormat("d MMM yyyy");
        calendar.roundDate = sdf2.format(sdf.parse(date));
        calendar.returnRound = getValue(node, "dataBloc/dataList/data [@name='Journee_retour']/value") ;
        var date2 = getValue(node, "dataBloc/dataList/data [@name='Date_retour']/value") ;
        calendar.returnRoundDate = sdf2.format(sdf.parse(date2));
        if ( calendar.round != "" ) {
            var nodes2 = node.query("dataBloc") ;
            var matchs = new Array() ;
            for (var j = 0; j < nodes2.size(); j++) {
                var node2 = nodes2.get(j);
                var match = new Object();
                match.homeTeam = getValue(node2, "dataList/data [@name='Receveur']/value") ;
                match.awayTeam = getValue(node2, "dataList/data [@name='Visiteur']/value") ;
                if ( match.homeTeam != "" && match.awayTeam != "" )
                    matchs.push(match) ;
            }
            calendar.matchs = matchs ;
            calendars.push(calendar) ;
            continue ;
        }
        else {
            _print("Impossible de trouver le numéro de journée dans le calendrier");
        }

        if ( calendar.roundDate == "" ) {
            _print("Impossible de trouver la date de la journée dans le calendrier");
        }
    }

    return calendars;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

function createXML() {
    
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

    for (var i in groupArray) {
        var group = groupArray[i] ;

        // Create Sport header if exists
        if (group.sport.name != "") {
            var intertitre0 = new Element("intertitre");
            intertitre0.addAttribute(new Attribute("class", group.sport.classe)) ;
            intertitre0.appendChild(group.sport.name) ;
            texte.appendChild(intertitre0);
        }
        // Create District header if exists
        if (group.district.name != "") {
            if ( groupArray.length == 0 ) {
                _print("Impossible de trouver le nom du district");
            }
            // Create Division header only if the District related contains a "#"
            else {
                var intertitre1 = new Element("intertitre");
                if (group.district.name.matches("[#].*")) {
                    intertitre1.addAttribute(new Attribute("class","DIVISION")) ;
                    var distr = group.district.name.replace("#","") ;
                    if (distr.matches(".*[ ].*")) {
                        intertitre1.appendChild(distr.substring(0,distr.indexOf(' ',0)).replace("pionnat", "pionnat ")) ;
                        intertitre1.appendChild(distr.substr(distr.indexOf(' ',0)+1,distr.length())) ;
                    }
                    else {
                        intertitre1.appendChild(distr) ;
                    }
                }
                else if (group.district.name.matches("[@].*")) {
                    intertitre1.addAttribute(new Attribute("class","ssDIVISION")) ;
                    var distr = group.district.name.replace("@","") ;
                    intertitre1.appendChild(distr) ;
                }
                else {
                    intertitre1.addAttribute(new Attribute("class",group.district.classe)) ;
                    intertitre1.appendChild(group.district.name) ;
                }
                texte.appendChild(intertitre1);
            }
        }
        
        // Create Championship header if exists
        if (group.championship.name != "") {
            var intertitre2 = new Element("intertitre");
            intertitre2.addAttribute(new Attribute("class",group.championship.classe)) ;
            intertitre2.appendChild(group.championship.name) ;
            texte.appendChild(intertitre2);
        }

        // Create Group header 
        if (group.name != "" && group.name != group.championship.name) {
            var intertitre3 = new Element("intertitre");
            intertitre3.addAttribute(new Attribute("class", group.classe)) ;
            intertitre3.appendChild(group.name) ;
            texte.appendChild(intertitre3);
        }

        // Display a table of results secondly
        for (var j in group.results.matchs) {
            var p4 = new Element("p");
            p4.addAttribute(new Attribute("class", "GROUPE_results")) ;

            var match = group.results.matchs[j] ;
            if (match.awayTeam == "") {
                p4.appendChild(match.homeTeam) ;
            }
            else {
                p4.appendChild(match.homeTeam + " - " + match.awayTeam) ;
                var ld4 = new Element("ld");
                ld4.addAttribute(new Attribute("pattern", ".")) ;
                p4.appendChild(ld4) ;
                p4.appendChild(match.score) ;
            }
            texte.appendChild(p4);
        }

        if (group.rankings != "") {

            // Display a table of rankings thirdly
            var intertitre5 = new Element("intertitre") ;
            intertitre5.addAttribute(new Attribute("class", "CLASSEMENT")) ;

            intertitre5.appendChild("CLASSEMENT") ;
            texte.appendChild(intertitre5) ;

            var table1 = new Element("table");
            table1.addAttribute(new Attribute("class", "GROUPE_rankings")) ;
            table1.addAttribute(new Attribute("cellpadding", "")) ;
            table1.addAttribute(new Attribute("cellspacing", "")) ;
            table1.addAttribute(new Attribute("width", "100%")) ;


            // Display a table of header first
            // var thead = new Element("thead") ;

            var tr5 = new Element("tr");
            tr5.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings")) ;

            var td50 = new Element("td");
            td50.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_team")) ;
            td50.addAttribute(new Attribute("colspan", "2")) ;
            td50.appendChild("") ;
            tr5.appendChild(td50) ;
            var td51 = new Element("td");
			td51.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_pts")) ;
        
		// $SH 02122012 
		if ((group.sport.name == "BASKET BALL")&&(group.district.name == "#Championnat de France")) {
            td51.appendChild("%") ;
       		tr5.appendChild(td51) ;
        } else {    
			td51.appendChild("Pts") ;
       		tr5.appendChild(td51) ;
			}
		// Fin $SH 02122012 	
		
			var td52 = new Element("td");
            td52.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_played")) ;
            td52.appendChild("J.") ;
            tr5.appendChild(td52) ;
            var td53 = new Element("td");
            td53.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_won")) ;
            td53.appendChild("G.") ;
            tr5.appendChild(td53) ;
	    if (group.rankings[0].drawMatch!="") {
            	var td54 = new Element("td");
            	td54.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_draw")) ;
            	td54.appendChild("N.") ;
            	tr5.appendChild(td54) ;
	    }
            var td55 = new Element("td");
            td55.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_lost")) ;
            td55.appendChild("P.") ;
            tr5.appendChild(td55) ;
            var td56 = new Element("td");
            td56.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_gFor")) ;
            td56.appendChild("p.") ;
            tr5.appendChild(td56) ;
            var td57 = new Element("td");
            td57.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_gAgainst")) ;
            td57.appendChild("c.") ;
            tr5.appendChild(td57) ;
            var td58 = new Element("td");
            td58.addAttribute(new Attribute("class", "GROUPE_tab_header_rankings_gDiff")) ;
            td58.appendChild("Diff.") ;
            tr5.appendChild(td58) ;

            // thead.appendChild(tr5);
            // table1.appendChild(thead);
	    table1.appendChild(tr5);

            var booleen = "blank" ;
            for (var k in group.rankings) {
                var rank = group.rankings[k] ;
                var tr6 = new Element("tr");
                var filet = "" ;

                if (rank.filet) {
                    filet = "_filet" ;
                }

                if (booleen.equals("blank")) {
                    tr6.addAttribute(new Attribute("class", "GROUPE_tab_rankings_blank")) ;
                    booleen = "grey" ;
                } else {
                    tr6.addAttribute(new Attribute("class", "GROUPE_tab_rankings_grey")) ;
                    booleen = "blank" ;
                }

                var td60 = new Element("td");
                td60.addAttribute(new Attribute("class", "GROUPE_tab_rankings_pos" + filet)) ;
                td60.appendChild(rank.position) ;
                tr6.appendChild(td60) ;
                var td61 = new Element("td");
                td61.addAttribute(new Attribute("class", "GROUPE_tab_rankings_team" + filet)) ;
                td61.appendChild(rank.team) ;
                tr6.appendChild(td61) ;
                var td62 = new Element("td");
                td62.addAttribute(new Attribute("class", "GROUPE_tab_rankings_pts" + filet)) ;
               // $SH 02122012 
			if ((group.sport.name == "BASKET BALL")&&(group.district.name == "#Championnat de France")) {
				td62.appendChild(rank.moy) ;
                tr6.appendChild(td62) ;
			} else {    
				td62.appendChild(rank.points) ;
                tr6.appendChild(td62) ;
			}
			// Fin $SH 02122012 	
				
				
                
				
				var td63 = new Element("td");
                td63.addAttribute(new Attribute("class", "GROUPE_tab_rankings_played" + filet)) ;
                td63.appendChild(rank.played) ;
                tr6.appendChild(td63) ;
                var td64 = new Element("td");
                td64.addAttribute(new Attribute("class", "GROUPE_tab_rankings_won" + filet)) ;
                td64.appendChild(rank.wonMatch) ;
                tr6.appendChild(td64) ;
                if (rank.drawMatch!="") {
		   var td65 = new Element("td");
                   td65.addAttribute(new Attribute("class", "GROUPE_tab_rankings_draw" + filet)) ;
                   td65.appendChild(rank.drawMatch) ;
                   tr6.appendChild(td65) ;
		}		
                var td66 = new Element("td");
                td66.addAttribute(new Attribute("class", "GROUPE_tab_rankings_lost" + filet)) ;
                td66.appendChild(rank.lostMatch) ;
                tr6.appendChild(td66) ;
                var td67 = new Element("td");
                td67.addAttribute(new Attribute("class", "GROUPE_tab_rankings_gFor" + filet)) ;
                td67.appendChild(rank.goalFor) ;
                tr6.appendChild(td67) ;
                var td68 = new Element("td");
                td68.addAttribute(new Attribute("class", "GROUPE_tab_rankings_gAgainst" + filet)) ;
                td68.appendChild(rank.goalAgainst) ;
                tr6.appendChild(td68) ;
                var td69 = new Element("td");
                td69.addAttribute(new Attribute("class", "GROUPE_tab_rankings_gDiff" + filet)) ;
                td69.appendChild(rank.goalDiff) ;
                tr6.appendChild(td69) ;

            
                table1.appendChild(tr6) ;
            }

            texte.appendChild(table1);

        }

        if (group.calendars != "") {
            for (var j in group.calendars) {
                var calendar = group.calendars[j] ;
                var p7 = new Element("p");
                p7.addAttribute(new Attribute("class", "CAL_journee")) ;
                p7.appendChild(calendar.round);
                var sp = new Element("span") ;
                sp.addAttribute(new Attribute("class", "exposant" ));
                sp.appendChild((calendar.round.equals("1")) ? "re" : "e");
                p7.appendChild(sp);
                p7.appendChild(" journée") ;
                texte.appendChild(p7);
                var p8 = new Element("p");
                p8.addAttribute(new Attribute("class", "CAL_journee2")) ;
                p8.appendChild("Aller : " + calendar.roundDate) ;
                texte.appendChild(p8);
                var p9 = new Element("p");
                p9.addAttribute(new Attribute("class", "CAL_journee2")) ;
                p9.appendChild("Retour : " + calendar.returnRoundDate + " (" + calendar.returnRound);
                var sp2 = new Element("span") ;
                sp2.addAttribute(new Attribute("class", "exposant" ));
                sp2.appendChild((calendar.returnRound.equals("1")) ? "re" : "e");
                p9.appendChild(sp2);
                p9.appendChild(" j.)") ;
                texte.appendChild(p9);

                for (var k in calendar.matchs) {
                    var match = calendar.matchs[k] ;
                    var p10 = new Element("p");
                    p10.addAttribute(new Attribute("class", "CAL_results")) ;
               	    p10.appendChild(match.homeTeam + " - " + match.awayTeam) ;
                    texte.appendChild(p10);
                }
            }
        }

        // Create a table for comments display of next round
        // Create comments display if exists
        if (group.nextRound.name != "") {
            var p6 = new Element("p") ;
            p6.addAttribute(new Attribute("class", group.nextRound.name)) ;
            p6.appendChild(group.nextRound.comment) ;
            
            texte.appendChild(p6) ;
        }
    }

    article.appendChild(texte);
    root.appendChild(article);

    return doc;
}

function printXML(){
    for (var i in groupArray) {
        var group = groupArray[i] ;

        _print("Sport : " +  group.sport.name + ", district : " + group.district.name + ", championship : " + group.championship.name + ", group : " + group.name);

        _print("=>Result - Journée : " +  group.results.round) ;
        for (var j in group.results.matchs) {
            var match = group.results.matchs[j] ;
            _print("=>Result - Match : " +  match.homeTeam + ", " + match.awayTeam + ", " + match.score );
        }

        for (var k in group.rankings) {
            var rank = group.rankings[k] ;
            _print("=>Rank : " +  rank.position + ", " + rank.played + ", " +
                rank.team + ", " + rank.points + ", " + rank.goalAgainst + ", " +
                rank.goalFor + ", " + rank.goalDiff + ", " + rank.lostMatch + ", " +
                rank.wonMatch + ", " +rank.drawMatch);
        }

        //        for (var j in sport.calendars) {
        //            var calendar = sport.calendars[j] ;
        //            _print("=>Calendar - Journée : " +  calendar.round + ", " + calendar.roundDate) ;
        //            for (var k in calendar.matchs) {
        //                var match = calendar.matchs[k] ;
        //                _print("=>Calendar - Match : " +  match.homeTeam + ", " + match.awayTeam );
        //            }
        //        }
        _print("") ;
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
    var dataContainers = doc.query("//dataContainers");
    for (var i=0; i<dataContainers.size(); i++) {
        var group = createGroup(dataContainers.get(i)) ;
        if ( group != null ) groupArray.push(group) ;
    }

    //    _print("Printing xml");
    //    printXML() ;

    _print("Creating xml");
    var document = createXML() ;

    _print("Writing xml");
    var name = "_" + getToday() + "_" + _srcFile.getName().substr(0, _srcFile.getName().indexOf(".")) + ".xml" ;
    for (j in OUTPUT_DIR) {
        var file = new File(OUTPUT_DIR[j], name) ;
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

