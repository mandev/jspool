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

// Type=1 sport
// Type=2 district
// Type=3 championnnat
// Type=4 groupe
// Type=5 résultats
// Type=6 classements
// Type=7 calendriers

//var OUTPUT_DIR = "C:/ExportsSoHO/XML_out2/" ;
var OUTPUT_DIR = "C:/tmp/" ;
var groupArray = new Array() ;

// Create a sport instance
function createSport(dataContainers) {
    var sport = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='1']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='1']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        if ( groupArray.length == 0 ) {
            _print("createSport() - Impossible de trouver le nom du sport");
        }
        else {
            value0 = groupArray[groupArray.length-1].sport.name ;
            value1 = groupArray[groupArray.length-1].sport.classe ;
        }
    }

    sport.name = value0 ;
    sport.classe = value1 ;
    return sport ;
}

function createDistrict(dataContainers) {
    var district = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='2']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='2']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        if ( groupArray.length == 0 ) {
            _print("Impossible de trouver le nom du district");
        }
        else {
            value0 = groupArray[groupArray.length-1].district.name ;
            value1 = groupArray[groupArray.length-1].district.classe ;
        }
    }

    district.name = value0 ;
    district.classe = value1 ;
    return district ;
}

function createChampionship(dataContainers) {
    var championship = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='3']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='3']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    if ( value0 == "" ) {
        if ( groupArray.length == 0 ) {
            _print("Impossible de trouver le nom du championnat");
        }
        else {
            value0 = groupArray[groupArray.length-1].championship.name ;
            value1 = groupArray[groupArray.length-1].championship.classe ;
        }
    }

    championship.name = value0 ;
    championship.classe = value1 ;
    return championship ;
}

function createGroup(dataContainers) {
    var group = new Object();

    var value0 = getValue(dataContainers, "dataContainer [@type='4']/dataBlocs/dataBloc/dataList/data/value") ;
    var value1 = getValue(dataContainers, "dataContainer [@type='4']/styleContainer/styles/style[@name='StyleSheet']/value") ;

    _print("createGroup() : " + value0);

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
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var match = new Object();
        match.homeTeam = getValue(node, "dataList/data [@name='Receveur']/value") ;
        match.awayTeam = getValue(node, "dataList/data [@name='Visiteur']/value") ;
        match.score = getValue(node, "dataList/data [@name='ScoreMatch']/value") ;
        if ( match.homeTeam != "" && match.awayTeam != "" && match.score != "" )
            matchs.push(match) ;
    }

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
        rank.points = getValue(node, "dataList/data [@name='Points']/value") ;
        rank.goalAgainst = getValue(node, "dataList/data [@name='ButContre']/value") ;
        rank.goalFor = getValue(node, "dataList/data [@name='ButPour']/value") ;
        rank.goalDiff = getValue(node, "dataList/data [@name='ButDiff']/value") ;
        rank.lostMatch = getValue(node, "dataList/data [@name='MatchPerdu']/value") ;
        rank.wonMatch = getValue(node, "dataList/data [@name='MatchGagne']/value") ;
        rank.drawMatch = getValue(node, "dataList/data [@name='MatchNul']/value") ;
        if ( rank.team != "" )
            rankings.push(rank) ;
    }
    return rankings;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

function createXML() {
    
    //var root = new Element("doc xml:lang='fr'");
    var root = new Element("doc");
    var article = new Element("article");
    root.appendChild(article);
    var ch = "........................................................" ;

    for (var i in groupArray) {
        var group = groupArray[i] ;

        // Create a table for results display
        var tectableau0 = new Element("tectableau");
        article.appendChild(tectableau0);

        // Display a table of header first
        var table0 = new Element("table");
        table0.addAttribute(new Attribute("class", group.classe + "_entete" )) ;
        
        // Create Sport header if exists
        if (group.sport.name != "") {
            var tr0 = new Element("tr");
            tr0.addAttribute(new Attribute("class",group.sport.classe))
            table0.appendChild(tr0);
        }
        // Create District header if exists
        if (group.district.name != "") {
            var tr1 = new Element("tr");
            tr1.addAttribute(new Attribute("class",group.district.classe))
            table0.appendChild(tr1);
        }
        // Create Championship header if exists
        if (group.championship.name != "") {
            var tr2 = new Element("tr");
            tr2.addAttribute(new Attribute("class",group.championship.classe))
            table0.appendChild(tr2);
        }
        if (group.name != "") {
            var tr3 = new Element("tr");
            tr3.addAttribute(new Attribute("class",group.classe))
            table0.appendChild(tr3);
        }
        tectableau0.appendChild(table0);

        // Display a table of results secondly
        var table1 = new Element("table");
        table1.addAttribute(new Attribute("class", group.classe + "_results" )) ;

        for (var j in group.results.matchs) {
            var match = group.results.matchs[j] ;
            var tr = new Element("tr");
            var td0 = new Element("td");
            td0.addAttribute(new Attribute("class", group.classe + "_rencontre")) ;
            var encounter = match.homeTeam + " - " + match.awayTeam ;
            td0.appendChild(encounter) ;
            tr.appendChild(td0) ;
            var td1 = new Element("td");
            td1.addAttribute(new Attribute("class", group.classe + "_pts_conduite")) ;
            td1.appendChild(ch.substr(encounter.length, ch.length)) ;
            tr.appendChild(td1) ;
            var td2 = new Element("td");
            td2.addAttribute(new Attribute("class", group.classe + "_res_renc")) ;
            td2.appendChild(match.score) ;
            tr.appendChild(td2) ;
            table1.appendChild(tr);
        }
        tectableau0.appendChild(table1);
    }

    return new Document(root);
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

        _print("") ;
    }
    _print("") ;
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "ISO-8859-1");
    serializer.setIndent(4);
    serializer.setMaxLength(64);
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
    var root = doc.getRootElement();

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
    var file = new File(OUTPUT_DIR, _srcFile.getName()) ;
    writeXML(document, file) ;

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

