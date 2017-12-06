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

// List All children - Node, int

var OUTPUT_DIR = "D:/LP/ArrExt/ExportsSoHO/XML_out1/" ;
var sportArray = new Array() ;

// Create a sport instance
function createSport(dataContainers) {
    var sport = new Object();

    var value = getValue(dataContainers, "dataContainer [@type='1']/dataBlocs/dataBloc/dataList/data/value") ;
    if ( value == "" ) {
        if ( sportArray.length == 0 ) {
            _print("Impossible de trouver le nom du sport");
            return null ;
        }
        else value = sportArray[sportArray.length-1].name ;
    }
    sport.name = value ;

    value = getValue(dataContainers, "dataContainer [@type='2']/dataBlocs/dataBloc/dataList/data/value") ;
    if ( value == "" ) {
        if ( sportArray.length == 0 ) _print("Impossible de trouver le nom du district");
        else value = sportArray[sportArray.length-1].district ;
    }
    sport.district = value.replace("#"," ").replace("@"," ").replace("/^\s+/", "");

    value = getValue(dataContainers, "dataContainer [@type='3']/dataBlocs/dataBloc/dataList/data/value") ;
    if ( value == "" ) {
        if ( sportArray.length == 0 ) _print("Impossible de trouver le nom du championnat");
        else value = sportArray[sportArray.length-1].championship ;
    }
    sport.championship = value ;

    value = getValue(dataContainers, "dataContainer [@type='4']/dataBlocs/dataBloc/dataList/data/value") ;
    if ( value == "" ) {
        if ( sportArray.length == 0 ) _print("Impossible de trouver le nom du groupe");
        else value = sportArray[sportArray.length-1].group ;
    }
    sport.group = value ;

    sport.results = createResults(dataContainers);
    sport.rankings = createRanks(dataContainers);
    sport.calendars = createCalendars(dataContainers);
    return sport ;
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
        rank.lostMatch = getValue(node, "dataList/data [@name='MatchPerdu']/value") ;
        rank.wonMatch = getValue(node, "dataList/data [@name='MatchGagne']/value") ;
        rank.drawMatch = getValue(node, "dataList/data [@name='MatchNul']/value") ;
        if ( rank.team != "" )
            rankings.push(rank) ;
    }
    return rankings;
}

// Create a rankings instance
function createCalendars(dataContainers) {
    var calendars = new Array() ;

    // Liste des dataBlocs
    var xpath = "dataContainer [@type='7']/dataBlocs"
    var nodes = dataContainers.query(xpath) ;

    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var calendar = new Object() ;
        calendar.round = getValue(node, "dataBloc/dataList/data [@name='Journee']/value") ;
        calendar.roundDate = getValue(node, "dataBloc/dataList/data [@name='Date']/value") ;
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
    
    var root = new Element("root");

    for (var i in sportArray) {
        var sport = sportArray[i] ;

        var sportElement = new Element("sport"); 
        sportElement.addAttribute(new Attribute("name", sport.name)) ; 
        sportElement.addAttribute(new Attribute("district", sport.district)) ; 
        sportElement.addAttribute(new Attribute("championship", sport.championship)) ; 
        sportElement.addAttribute(new Attribute("group", sport.group)) ; 

        var resultsElement = new Element("results");
        resultsElement.addAttribute(new Attribute("round", sport.results.round)) ;

        for (var j in sport.results.matchs) {
            var match = sport.results.matchs[j] ;
            var matchElement = new Element("match");
            matchElement.addAttribute(new Attribute("homeTeam", match.homeTeam)) ;
            matchElement.addAttribute(new Attribute("awayTeam", match.awayTeam)) ;
            matchElement.addAttribute(new Attribute("score", match.score)) ;
            resultsElement.appendChild(matchElement) ;
        }

        var rankingsElement = new Element("rankings");

        for (var j in sport.rankings) {
            var rank = sport.rankings[j] ;
            var rankElement = new Element("rank");
            rankElement.addAttribute(new Attribute("position", rank.position)) ;
            rankElement.addAttribute(new Attribute("played", rank.played)) ;
            rankElement.addAttribute(new Attribute("team", rank.team)) ;
            rankElement.addAttribute(new Attribute("points", rank.points)) ;
            rankElement.addAttribute(new Attribute("goalAgainst", rank.goalAgainst)) ;
            rankElement.addAttribute(new Attribute("goalFor", rank.goalFor)) ;
            rankElement.addAttribute(new Attribute("lostMatch", rank.lostMatch)) ;
            rankElement.addAttribute(new Attribute("wonMatch", rank.wonMatch)) ;
            rankElement.addAttribute(new Attribute("drawMatch", rank.drawMatch)) ;
            rankingsElement.appendChild(rankElement) ;
        }

        var calendarsElement = new Element("calendars");

        for (var j in sport.calendars) {
            var calendar = sport.calendars[j] ;
            var calendarElement = new Element("calendar");
            calendarElement.addAttribute(new Attribute("round", calendar.round)) ;
            calendarElement.addAttribute(new Attribute("roundDate", calendar.roundDate)) ;

            for (var k in calendar.matchs) {
                var match = calendar.matchs[k] ;
                var matchElement = new Element("match");
                matchElement.addAttribute(new Attribute("homeTeam", match.homeTeam)) ;
                matchElement.addAttribute(new Attribute("awayTeam", match.awayTeam)) ;
                calendarElement.appendChild(matchElement) ;
            }
            calendarsElement.appendChild(calendarElement) ;
        }

        root.appendChild(sportElement) ;
        sportElement.appendChild(resultsElement) ;
        sportElement.appendChild(rankingsElement) ;
        sportElement.appendChild(calendarsElement) ;
    }

    return new Document(root);
}

function printXML(){
    for (var i in sportArray) {
        var sport = sportArray[i] ;

        _print("Sport : " +  sport.name + ", " + sport.district + ", " + sport.championship + ", " + sport.group);

        _print("=>Result - Journée : " +  sport.results.round) ;
        for (var j in sport.results.matchs) {
            var match = sport.results.matchs[j] ;
            _print("=>Result - Match : " +  match.homeTeam + ", " + match.awayTeam + ", " + match.score );
        }

        for (var j in sport.rankings) {
            var rank = sport.rankings[j] ;
            _print("=>Rank : " +  rank.position + ", " + rank.played + ", " +
                rank.team + ", " + rank.points + ", " + rank.goalAgainst + ", " +
                rank.goalFor + ", " + rank.lostMatch + ", " + rank.wonMatch + ", " +
                rank.drawMatch);
        }

        for (var j in sport.calendars) {
            var calendar = sport.calendars[j] ;
            _print("=>Calendar - Journée : " +  calendar.round + ", " + calendar.roundDate) ;
            for (var k in calendar.matchs) {
                var match = calendar.matchs[k] ;
                _print("=>Calendar - Match : " +  match.homeTeam + ", " + match.awayTeam );
            }
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
        var sport = createSport(dataContainers.get(i)) ;
        if ( sport != null ) sportArray.push(sport) ;
    }

    // _print("Printing xml");
    //printXML() ;

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

